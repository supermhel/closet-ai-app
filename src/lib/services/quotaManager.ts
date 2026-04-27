// AI Service Quota Management
// Manages usage of limited AI services on Cloudinary free tier

export interface QuotaStatus {
  service: string;
  used: number;
  quota: number;
  percentage: number;
  remaining: number;
  status: 'healthy' | 'warning' | 'critical' | 'exhausted';
}

export interface AIServiceConfig {
  categorization: string;
  detection: string;
  priority: 'high' | 'medium' | 'low';
}

class QuotaManager {
  private quotas: { [key: string]: number } = {
    'cld-fashion': 500,
    'aws_rek_tagging': 50,
    'google_tagging': 50,
    'imagga_tagging': 50,
    'captioning': 500
  };

  private usage: { [key: string]: number } = {
    'cld-fashion': 0,
    'aws_rek_tagging': 0,
    'google_tagging': 0,
    'imagga_tagging': 0,
    'captioning': 0
  };

  private thresholds = {
    HEALTHY: 0.6,     // Green: under 60%
    WARNING: 0.8,     // Yellow: 60-80%
    CRITICAL: 0.95,   // Red: 80-95%
    EXHAUSTED: 1.0    // Blocked: 95%+
  };

  /**
   * Get current usage status for all services
   */
  getQuotaStatus(): Record<string, QuotaStatus> {
    const status: Record<string, QuotaStatus> = {};
    
    for (const [service, used] of Object.entries(this.usage)) {
      const quota = this.quotas[service] || 0;
      const percentage = quota > 0 ? used / quota : 0;
      
      let statusLevel: QuotaStatus['status'] = 'healthy';
      if (percentage >= this.thresholds.EXHAUSTED) statusLevel = 'exhausted';
      else if (percentage >= this.thresholds.CRITICAL) statusLevel = 'critical';
      else if (percentage >= this.thresholds.WARNING) statusLevel = 'warning';
      
      status[service] = {
        service,
        used,
        quota,
        percentage: Math.round(percentage * 100),
        remaining: quota - used,
        status: statusLevel
      };
    }
    
    return status;
  }

  /**
   * Get optimized AI service configuration based on priority and quota usage
   */
  getOptimalServices(priority: 'high' | 'medium' | 'low' = 'medium'): AIServiceConfig {
    const status = this.getQuotaStatus();
    const config: AIServiceConfig = {
      categorization: '',
      detection: 'cld-fashion', // Always include primary service
      priority
    };

    // Build categorization services array
    const categorization: string[] = [];
    
    // Add captioning if quota allows (bundled with cld-fashion)
    if (status['cld-fashion'].status !== 'exhausted') {
      config.detection = 'cld-fashion,captioning';
    }

    // Add AWS Rekognition for medium and high priority
    if ((priority === 'medium' || priority === 'high') && 
        status['aws_rek_tagging'].status === 'healthy') {
      categorization.push('aws_rek_tagging');
    }

    // Add Google Vision for high priority only
    if (priority === 'high' && status['google_tagging'].status === 'healthy') {
      categorization.push('google_tagging');
    }

    // Add Imagga for high priority when other quotas are healthy
    if (priority === 'high' && 
        status['imagga_tagging'].status === 'healthy' &&
        status['aws_rek_tagging'].status === 'healthy') {
      categorization.push('imagga_tagging');
    }

    config.categorization = categorization.join(',');
    return config;
  }

  /**
   * Record usage of AI services
   */
  recordUsage(services: { categorization?: string; detection?: string }): void {
    if (services.categorization) {
      services.categorization.split(',').forEach(service => {
        const trimmed = service.trim();
        if (this.usage.hasOwnProperty(trimmed)) {
          this.usage[trimmed]++;
        }
      });
    }

    if (services.detection) {
      services.detection.split(',').forEach(service => {
        const trimmed = service.trim();
        if (this.usage.hasOwnProperty(trimmed)) {
          this.usage[trimmed]++;
        }
      });
    }

    console.log('🔢 AI Service Usage Updated:', this.getQuotaStatus());
  }

  /**
   * Reset usage counters (call monthly)
   */
  resetMonthlyUsage(): void {
    Object.keys(this.usage).forEach(service => {
      this.usage[service] = 0;
    });
    console.log('🔄 Monthly quota usage reset');
  }

  /**
   * Get usage summary for logging
   */
  getUsageSummary(): string {
    const status = this.getQuotaStatus();
    const summary = Object.values(status)
      .map(s => `${s.service}: ${s.used}/${s.quota} (${s.percentage}%)`)
      .join(', ');
    return summary;
  }

  /**
   * Check if we can afford to use a specific service
   */
  canUseService(serviceName: string): boolean {
    const status = this.getQuotaStatus();
    return status[serviceName]?.status !== 'exhausted';
  }

  /**
   * Get recommended priority level based on current usage
   */
  getRecommendedPriority(): 'high' | 'medium' | 'low' {
    const status = this.getQuotaStatus();
    const criticalServices = Object.values(status).filter(s => s.status === 'critical' || s.status === 'exhausted');
    
    if (criticalServices.length >= 2) return 'low';
    if (criticalServices.length >= 1) return 'medium';
    return 'high';
  }
}

// Export singleton instance
export const quotaManager = new QuotaManager();

// Helper function to create a SINGLE smart cropped image from detection data
export function createSmartCrop(publicId: string, detectionData: { info?: { detection?: { object_detection?: { data?: Record<string, unknown> } } } }): string | null {
  try {
    const fashionData = detectionData?.info?.detection?.object_detection?.data?.['cld-fashion'] as { tags?: Record<string, unknown> };
    if (!fashionData?.tags) return null;

    let bestItem: { type: string; item: { 'bounding-box': number[]; confidence: number }; score: number } | null = null;
    let bestScore = 0;

    // Analyze all detected items to find the BEST one (focus on size + confidence only)
    Object.entries(fashionData.tags).forEach(([itemType, detections]) => {
      const items = Array.isArray(detections) ? detections : [detections];
      
      items.forEach((item: { 'bounding-box'?: number[]; confidence?: number; attributes?: Record<string, unknown> }) => {
        if (item['bounding-box'] && item.confidence && item.confidence > 0.65) {
          const [, , width, height] = item['bounding-box'];
          const area = width * height;
          
          // Simple scoring: 70% size + 30% confidence (no type bias)
          const confidenceScore = item.confidence * 100;
          const sizeScore = Math.min(area / 500, 100); // More generous size normalization
          
          const compositeScore = (sizeScore * 0.7) + (confidenceScore * 0.3);
          
          if (compositeScore > bestScore) {
            bestScore = compositeScore;
            bestItem = {
              type: itemType,
              item: item as { 'bounding-box': number[]; confidence: number },
              score: compositeScore
            };
          }
        }
      });
    });

    if (!bestItem) return null;

    const selectedItem = bestItem; // Create local variable to help with type inference
    const [x, y, width, height] = selectedItem.item['bounding-box'];
    
    // Consistent padding for all items (no type bias)
    const padding = 0.2; // 20% padding for optimal visual context

    // Calculate padded crop area
    const paddedX = Math.max(0, x - width * padding);
    const paddedY = Math.max(0, y - height * padding);
    const paddedWidth = width * (1 + 2 * padding);
    const paddedHeight = height * (1 + 2 * padding);
    
    // Create high-quality Cloudinary transformation with visual enhancements
    const transformation = [
      `c_crop,x_${Math.round(paddedX)},y_${Math.round(paddedY)},w_${Math.round(paddedWidth)},h_${Math.round(paddedHeight)}`,
      'c_fill,w_800,h_800,g_center',  // 800x800 resolution as requested
      'q_auto:best',                   // Best quality setting
      'f_auto',                        // Auto format optimization
      'dpr_2.0',                      // 2x pixel density for crisp display
      'e_sharpen:150',                // Enhanced sharpening
      'e_auto_color',                 // Auto color enhancement
      'e_auto_contrast'               // Auto contrast enhancement
    ].join('/');
    
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const croppedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${publicId}`;
    
    console.log(`🎯 Smart crop selected: ${selectedItem.type} (confidence: ${Math.round(selectedItem.item.confidence * 100)}%, score: ${Math.round(selectedItem.score)})`);
    
    return croppedUrl;
  } catch (error) {
    console.warn('Failed to create smart crop:', error);
    return null;  
  }
}

// Backward compatibility - now returns array with single smart crop
export function createCroppedImageUrls(publicId: string, detectionData: { info?: { detection?: { object_detection?: { data?: Record<string, unknown> } } } }): string[] {
  const smartCrop = createSmartCrop(publicId, detectionData);
  return smartCrop ? [smartCrop] : [];
} 








