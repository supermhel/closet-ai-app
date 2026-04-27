/**
 * AI Analysis Service (Orchestrator for Cloudinary)
 *
 * This service orchestrates the AI pipeline for a clothing item, primarily using
 * Cloudinary for processing and analysis.
 */
import logger from '@/utils/logger';
import { ServiceError } from '@/utils/serviceUtils'; // Assuming ServiceError is defined here
import { 
    getColorName
} from '@/utils/itemFormUtils'; 
import { processUploadedImage } from './processingService';
import { deleteImage, getAssetDetails } from './cloudinaryService';

// Define ServiceErrorCode enum locally if not imported
enum ServiceErrorCode {
    ANALYSIS_ERROR = "ANALYSIS_ERROR",
    PROCESSING_SERVICE_UNAVAILABLE = "PROCESSING_SERVICE_UNAVAILABLE",
    // Add other codes as needed
}

// Add AI service configuration constants
const AI_SERVICE_CONFIG = {
  // Priority levels for different services
  PRIMARY: ['cld-fashion'], // Always use (500 ops)
  SECONDARY: ['aws_rek_tagging'], // Use for important items (50 ops)
  TERTIARY: ['google_tagging', 'imagga_tagging'], // Use sparingly (50 ops each)
  
  // Usage thresholds (percentage of quota to preserve)
  THRESHOLDS: {
    CONSERVATIVE: 0.8, // Stop at 80% usage
    MODERATE: 0.9,     // Stop at 90% usage
    AGGRESSIVE: 0.95   // Stop at 95% usage
  },
  
  // Service quotas (monthly limits)
  QUOTAS: {
    'cld-fashion': 500,
    'aws_rek_tagging': 50,
    'google_tagging': 50,
    'imagga_tagging': 50,
    'captioning': 500 // Usually bundled with cld-fashion
  }
};

// Track service usage (in production, store this in database)
const serviceUsage: Record<string, number> = {
  'cld-fashion': 0,
  'aws_rek_tagging': 0,
  'google_tagging': 0,
  'imagga_tagging': 0,
  'captioning': 0
};

/**
 * Determines which AI services to use based on item priority and quota usage
 */
function getOptimalAIServices(itemType?: string, priority: 'high' | 'medium' | 'low' = 'medium') {
  const services = {
    categorization: [] as string[],
    detection: ['cld-fashion'] as string[] // Always include cld-fashion
  };
  
  // Always add captioning if cld-fashion quota allows
  if (serviceUsage['cld-fashion'] < AI_SERVICE_CONFIG.QUOTAS['cld-fashion'] * AI_SERVICE_CONFIG.THRESHOLDS.MODERATE) {
    services.detection.push('captioning');
  }
  
  // Add secondary services based on priority and quota
  if (priority === 'high' || priority === 'medium') {
    // Add AWS Rekognition if quota allows
    if (serviceUsage['aws_rek_tagging'] < AI_SERVICE_CONFIG.QUOTAS['aws_rek_tagging'] * AI_SERVICE_CONFIG.THRESHOLDS.CONSERVATIVE) {
      services.categorization.push('aws_rek_tagging');
    }
  }
  
  // Add tertiary services only for high priority items or when quota is healthy
  if (priority === 'high') {
    if (serviceUsage['google_tagging'] < AI_SERVICE_CONFIG.QUOTAS['google_tagging'] * AI_SERVICE_CONFIG.THRESHOLDS.CONSERVATIVE) {
      services.categorization.push('google_tagging');
    }
    if (serviceUsage['imagga_tagging'] < AI_SERVICE_CONFIG.QUOTAS['imagga_tagging'] * AI_SERVICE_CONFIG.THRESHOLDS.CONSERVATIVE) {
      services.categorization.push('imagga_tagging');
    }
  }
  
  return {
    categorization: services.categorization.join(','),
    detection: services.detection.join(',')
  };
}

/**
 * Creates cropped versions of detected fashion items
 * @deprecated Currently unused but kept for future implementation
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function createCroppedVariants(publicId: string, detectionData: CloudinaryInfo): Promise<string[]> {
  const croppedUrls: string[] = [];
  
  try {
    // Note: This function uses deprecated object_detection structure
    // Current structure uses cld-fashion_v4 instead
    const detectionInfo = detectionData?.info?.detection as Record<string, unknown>;
    if (detectionInfo?.object_detection?.data?.['cld-fashion']) {
      const fashionData = detectionInfo.object_detection.data['cld-fashion'];
      
      // Process each detected item type
      for (const [itemType, detections] of Object.entries(fashionData.tags || {})) {
        const items = Array.isArray(detections) ? detections : [detections];
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i] as { 'bounding-box'?: number[]; confidence?: number };
          if (item['bounding-box'] && item.confidence && item.confidence > 0.7) {
            const [x, y, width, height] = item['bounding-box'];
            
            // Add padding around the detected object (10% on each side)
            const padding = 0.1;
            const paddedX = Math.max(0, x - width * padding);
            const paddedY = Math.max(0, y - height * padding);
            const paddedWidth = width * (1 + 2 * padding);
            const paddedHeight = height * (1 + 2 * padding);
            
            // Create transformation for cropping
            const transformation = `c_crop,x_${Math.round(paddedX)},y_${Math.round(paddedY)},w_${Math.round(paddedWidth)},h_${Math.round(paddedHeight)}/c_fill,w_400,h_400`;
            
            try {
              // Create the cropped version using Cloudinary's derived image feature
              const croppedUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${transformation}/${publicId}`;
              croppedUrls.push(croppedUrl);
              
              logger.info(`Created cropped variant for ${itemType}`, {
                originalPublicId: publicId,
                croppedUrl,
                confidence: item.confidence,
                boundingBox: item['bounding-box']
              });
            } catch (cropError) {
              logger.warn(`Failed to create cropped variant for ${itemType}`, {
                error: cropError instanceof Error ? cropError : new Error(String(cropError)),
                publicId
              });
            }
          }
        }
      }
    }
  } catch (error) {
    logger.error('Error creating cropped variants', {
      error: error instanceof Error ? error : new Error(String(error)),
      publicId
    });
  }
  
  return croppedUrls;
}

/**
 * Creates a smart crop using fashion detection bounding boxes
 */
function createSmartCropFromFashionDetection(publicId: string, cloudinaryData: CloudinaryInfo): string | null {
  try {
    // Check both possible data structures
    const fashionData = cloudinaryData?.info?.detection?.["cld-fashion_v4"]?.data;
    const legacyFashionData = cloudinaryData?.info?.detection?.object_detection?.data?.['cld-fashion'];
    
    const detectionData = fashionData || legacyFashionData;
    if (!detectionData || !detectionData.tags) return null;

    let bestItem: { bbox: number[]; confidence: number; type: string } | null = null;
    let bestScore = 0;

    // Look through all detected fashion items
    Object.entries(detectionData.tags).forEach(([itemType, detections]) => {
      const items = Array.isArray(detections) ? detections : [detections];
      
      items.forEach((item: any) => {
        if (item['bounding-box'] && item.confidence && item.confidence > 0.6) {
          const [, , width, height] = item['bounding-box'];
          const area = width * height;
          
          // Score based on confidence and size
          const score = (item.confidence * 0.7) + (Math.min(area / 10000, 1) * 0.3);
          
          if (score > bestScore) {
            bestScore = score;
            bestItem = {
              bbox: item['bounding-box'],
              confidence: item.confidence,
              type: itemType
            };
          }
        }
      });
    });

    if (!bestItem) return null;

    const [x, y, width, height] = bestItem.bbox;
    const padding = 0.2; // Increased to 20% padding for better framing
    
    const paddedX = Math.max(0, x - width * padding);
    const paddedY = Math.max(0, y - height * padding);
    let paddedWidth = width * (1 + 2 * padding);
    let paddedHeight = height * (1 + 2 * padding);
    
    // Ensure minimum crop size (at least 200px)
    paddedWidth = Math.max(paddedWidth, 200);
    paddedHeight = Math.max(paddedHeight, 200);
    
    const transformation = `c_crop,x_${Math.round(paddedX)},y_${Math.round(paddedY)},w_${Math.round(paddedWidth)},h_${Math.round(paddedHeight)}/c_fill,w_400,h_400,g_center,q_auto:best`;
    
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${transformation}/${publicId}`;
  } catch (error) {
    console.warn('Fashion detection crop failed:', error);
    return null;
  }
}

/**
 * Creates a smart crop using general object detection
 */
function createSmartCropFromObjectDetection(publicId: string, cloudinaryData: CloudinaryInfo): string | null {
  try {
    // Try to use any object detection data available
    const tags = cloudinaryData.tags || [];
    
    // Look for shoe-related tags to help with cropping
    const shoeRelatedTags = ['shoe', 'sandal', 'footwear', 'sneaker', 'boot', 'slipper'];
    const hasShoeTag = tags.some((tag: string) => 
      shoeRelatedTags.some(shoeTag => tag.toLowerCase().includes(shoeTag))
    );
    
    if (hasShoeTag) {
      // For shoes, use a crop that focuses on the lower portion of the image with better sizing
      const transformation = `c_crop,h_0.8,y_0.1/c_fill,w_400,h_400,g_south,q_auto:best`;
      return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${transformation}/${publicId}`;
    }
    
    return null;
  } catch (error) {
    console.warn('Object detection crop failed:', error);
    return null;
  }
}

/**
 * Updates service usage tracking
 */
function updateServiceUsage(services: { categorization: string; detection: string }) {
  // Update usage counters
  if (services.categorization) {
    services.categorization.split(',').forEach(service => {
      if (service in serviceUsage) {
        serviceUsage[service as keyof typeof serviceUsage]++;
      }
    });
  }
  
  if (services.detection) {
    services.detection.split(',').forEach(service => {
      if (service in serviceUsage) {
        serviceUsage[service as keyof typeof serviceUsage]++;
      }
    });
  }
  
  // Log current usage
  logger.info('AI Service Usage Updated', {
    usage: serviceUsage,
    quotas: AI_SERVICE_CONFIG.QUOTAS
  });
}

/**
 * Gets current quota usage status
 */
export function getQuotaStatus() {
  const status: Record<string, { used: number; quota: number; percentage: number; remaining: number }> = {};
  for (const [service, used] of Object.entries(serviceUsage)) {
    const quota = AI_SERVICE_CONFIG.QUOTAS[service as keyof typeof AI_SERVICE_CONFIG.QUOTAS] || 0;
    status[service] = {
      used,
      quota,
      percentage: quota > 0 ? (used / quota) * 100 : 0,
      remaining: quota - used
    };
  }
  return status;
}

// --- TYPE DEFINITIONS ---

/**
 * The final, comprehensive result object, structured to match the needs of the item form.
 */
export interface AIAnalysisResult {
  name: string;
  category: string;
  description: string;
  colors: string[];
  tags: string[];
  seasons: string[];
  occasions: string[];
  fit: string;
  imageUrl: string;
  processing_metrics?: {
    processing_time: number;
    service_used: 'primary' | 'fallback';
    attempts: number;
  };
  rawAnalysis: { // For debugging and future use
    cloudinary: Record<string, unknown>;
    huggingFace?: Record<string, unknown>; // Make optional
  };
}

/**
 * A simplified representation of the expected data from Cloudinary's "closet_ai_upload" preset.
 */
interface CloudinaryInfo {
  public_id: string;
  secure_url: string;
  requestId?: string;
  tags?: string[];
  colors?: [string, number][];
  predominant?: {
    google?: [string, number][];
    cloudinary?: [string, number][];
  };
  info?: {
    categorization?: {
      aws_rek_tagging?: { data: { tag: string; confidence: number }[] };
      google_tagging?: { data: { tag: string; confidence: number }[] };
      imagga_tagging?: { data: { tag: string; confidence: number }[] };
      cld_fashion_v4?: { data: { name: string; confidence: number }[] };
    };
    detection?: {
      "cld-fashion_v4"?: { 
        data: { 
          tags?: Record<string, Array<{
            categories?: string[];
            confidence?: number;
            attributes?: Record<string, unknown>;
            'bounding-box'?: number[];
          }>>
        } 
      };
      object_detection?: {
        data?: {
          'cld-fashion'?: {
            tags?: Record<string, Array<{
              confidence?: number;
              'bounding-box'?: number[];
            }>>
          }
        }
      };
      captioning?: { data: { caption?: string } };
    };
  };
}

// --- HELPER FUNCTIONS ---

/**
 * Merges raw data from Cloudinary into the final structured result.
 */
function mergeAnalysisResults(
  cloudinaryData: CloudinaryInfo,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hfDescription: string // Keep argument for compatibility
): Omit<AIAnalysisResult, 'imageUrl' | 'processing_metrics'> {
  
  // 1. Consolidate all tags from Cloudinary into one master list.
  const allTags = new Set<string>();
  
  // Get tags from different services
  const awsTags = cloudinaryData.info?.categorization?.aws_rek_tagging?.data || [];
  const googleTags = cloudinaryData.info?.categorization?.google_tagging?.data || [];
  const imaggaTags = cloudinaryData.info?.categorization?.imagga_tagging?.data || [];
  
  // AWS and Google tags have string tags
  awsTags.forEach(t => {
    if (t.tag && typeof t.tag === 'string') {
      allTags.add(t.tag.toLowerCase());
    }
  });
  googleTags.forEach(t => {
    if (t.tag && typeof t.tag === 'string') {
      allTags.add(t.tag.toLowerCase());
    }
  });
  
  // Imagga tags have object tags with language properties
  imaggaTags.forEach(t => {
    if (t.tag && typeof t.tag === 'object' && 'en' in t.tag && typeof (t.tag as Record<string, unknown>).en === 'string') {
      allTags.add(((t.tag as Record<string, string>).en).toLowerCase());
    }
  });

  const tagArray = Array.from(allTags).filter(Boolean);

  // 2. Determine Category (prioritize most confident AWS tag)
  const topAwsTag = awsTags[0]?.tag || 'Clothing';
  
  // Map AWS tags to our category system
  const categoryMapping: Record<string, string> = {
    'Sandal': 'shoes',
    'Shoe': 'shoes',
    'Sneaker': 'shoes',
    'Boot': 'shoes',
    'High Heel': 'shoes',
    'Flip-Flop': 'shoes',
    'Pants': 'bottoms',
    'Jeans': 'bottoms',
    'Shorts': 'bottoms',
    'Skirt': 'bottoms',
    'T-Shirt': 'tops',
    'Shirt': 'tops',
    'Blouse': 'tops',
    'Sweater': 'tops',
    'Hoodie': 'tops',
    'Dress': 'dresses',
    'Gown': 'dresses',
    'Wedding Gown': 'dresses',
    'Jacket': 'outerwear',
    'Coat': 'outerwear',
    'Blazer': 'outerwear',
    'Cape': 'outerwear',
    'Suit': 'formal',
    'Tuxedo': 'formal',
    'Formal Wear': 'formal',
    'Swimsuit': 'swimwear',
    'Bikini': 'swimwear',
    'Bag': 'accessories',
    'Handbag': 'accessories',
    'Shopping Bag': 'accessories',
    'Hat': 'accessories',
    'Accessories': 'accessories'
  };
  
  const category = categoryMapping[topAwsTag] || topAwsTag.toLowerCase();

  // 3. Extract and name Colors - Enhanced with caption analysis
  let colors = (cloudinaryData.colors || []).map(([hex]) => {
    // Use getColorName helper function
    return getColorName(hex);
  });

  // If we detected white but the caption suggests another color, use the caption
  const caption = cloudinaryData.info?.detection?.captioning?.data?.caption || '';
  if (colors[0] === 'White' && caption) {
    const captionLower = caption.toLowerCase();
    const colorKeywords = ['mint', 'green', 'khaki', 'beige', 'tan', 'cream', 'ivory', 'off-white', 'light blue', 'pale', 'sage'];
    
    for (const colorKeyword of colorKeywords) {
      if (captionLower.includes(colorKeyword)) {
        // Map caption colors to our standard colors
        if (colorKeyword === 'mint' && captionLower.includes('green')) {
          colors = ['Mint Green', ...colors.slice(1)];
        } else if (colorKeyword === 'khaki') {
          colors = ['Khaki', ...colors.slice(1)];
        } else if (colorKeyword === 'beige' || colorKeyword === 'tan') {
          colors = ['Beige', ...colors.slice(1)];
        } else if (colorKeyword === 'cream' || colorKeyword === 'ivory') {
          colors = ['Cream', ...colors.slice(1)];
        } else if (colorKeyword === 'sage') {
          colors = ['Sage Green', ...colors.slice(1)];
        }
        break;
      }
    }
  }

  // 4. Get description from captioning or generate one
  const description = cloudinaryData.info?.detection?.captioning?.data?.caption || 
                    `${colors[0] || ''} ${category}`.trim() || 'Fashion Item';

  // 5. Generate a smart name - Enhanced with caption analysis
  let itemName = category;
  
  // Extract more specific item types from caption
  if (caption) {
    const captionLower = caption.toLowerCase();
    
    // Look for specific item types in the caption
    if (captionLower.includes('chino')) itemName = 'Chino Pants';
    else if (captionLower.includes('cargo')) itemName = 'Cargo Pants';
    else if (captionLower.includes('dress pants')) itemName = 'Dress Pants';
    else if (captionLower.includes('khaki pants')) itemName = 'Khaki Pants';
    else if (captionLower.includes('trousers')) itemName = 'Trousers';
    else if (captionLower.includes('dress shirt')) itemName = 'Dress Shirt';
    else if (captionLower.includes('polo')) itemName = 'Polo Shirt';
    else if (captionLower.includes('button-up') || captionLower.includes('button up')) itemName = 'Button-Up Shirt';
  }
  
  // Use more specific names based on the original AWS tag if caption didn't provide specifics
  if (itemName === category) {
    if (category === 'shoes') {
      if (topAwsTag === 'Sandal') itemName = 'Sandals';
      else if (topAwsTag === 'Sneaker') itemName = 'Sneakers';
      else if (topAwsTag === 'Boot') itemName = 'Boots';
      else if (topAwsTag === 'High Heel') itemName = 'High Heels';
      else if (topAwsTag === 'Flip-Flop') itemName = 'Flip-Flops';
      else itemName = 'Shoes';
    } else if (category === 'bottoms') {
      if (topAwsTag === 'Pants') itemName = 'Pants';
      else if (topAwsTag === 'Jeans') itemName = 'Jeans';
      else if (topAwsTag === 'Shorts') itemName = 'Shorts';
      else if (topAwsTag === 'Skirt') itemName = 'Skirt';
      else itemName = 'Bottoms';
    }
  }
  
  const name = `${colors[0] || ''} ${itemName}`.trim() || 'Fashion Item';

  return {
    name,
    category,
    description,
    colors,
    tags: tagArray.slice(0, 10), // Limit to reasonable number
    seasons: ["All Seasons"], // Default
    occasions: ["Casual"], // Default
    fit: "Regular", // Default
    rawAnalysis: {
      cloudinary: cloudinaryData as unknown as Record<string, unknown>,
    },
  };
}

/**
 * Calls the internal API to delete an asset from Cloudinary.
 * This is a fire-and-forget operation used for cleanup.
 */
function deleteCloudinaryAsset(publicId: string): void {
  // Use the imported deleteImage function instead of direct fetch
  deleteImage(publicId).catch(error => {
    logger.warn("Non-critical error: Failed to delete temporary Cloudinary asset", { 
      publicId, 
      error: new Error(error instanceof Error ? error.message : String(error))
    });
  });
}

// Removed duplicate function - using the one imported from cloudinaryService

// Enhanced status update interface
export interface ProgressStatus {
  step: string;
  message: string;
  progress: number; // 0-100
  timeElapsed: number;
  estimatedTimeRemaining: number;
}

export interface EnhancedAIAnalysisResult {
  success: boolean;
  data: AIAnalysisResult | null;
  error: string | null;
  performance: {
    totalTime: number;
    cacheHit: boolean;
    parallelProcessing: boolean;
    breakdown: {
      processing?: number;
      analysis?: number;
      cropGeneration?: number;
    };
  };
  croppedImage?: string | null;
}

// --- ENHANCED PUBLIC ORCHESTRATOR FUNCTION ---

export async function analyzeImage(
  rawPublicId: string,
  updateStatus: (status: ProgressStatus | string) => void,
  itemType?: string,
  priority: 'high' | 'medium' | 'low' = 'medium',
  enableParallelProcessing = true
): Promise<EnhancedAIAnalysisResult> {
  
  const startTime = Date.now();
  const performanceBreakdown: { processing?: number; analysis?: number; cropGeneration?: number } = {};
  let cacheHit = false;
  let parallelProcessing = false;
  let serviceUsed: 'primary' | 'fallback' = 'primary';
  let attempts = 0;

  // Enhanced progress tracking
  const getEstimatedTotalTime = (step: string, progress: number): number => {
    const stepTimes: Record<string, number> = {
      'initialization': 500,
      'quota': 1000,
      'parallel': 3000,
      'sequential': 5000,
      'processing': 4000,
      'analysis': 2000,
      'cropping': 1500,
      'complete': 100
    };
    return stepTimes[step] || 3000;
  };

  const updateProgress = (step: string, message: string, progress: number) => {
    const timeElapsed = Date.now() - startTime;
    const estimatedTotal = getEstimatedTotalTime(step, progress);
    const estimatedTimeRemaining = Math.max(0, estimatedTotal - timeElapsed);
    
    if (typeof updateStatus === 'function') {
      const progressUpdate: ProgressStatus = {
        step,
        message,
        progress,
        timeElapsed,
        estimatedTimeRemaining
      };
      updateStatus(progressUpdate);
    }
  };

  try {
    updateProgress('initialization', 'Starting AI analysis...', 5);

    // Step 1: Check cache first (using simple in-memory cache)
    const aiServices = getOptimalAIServices(itemType, priority);
    const cacheKey = `analysis:${rawPublicId}:${aiServices.categorization}:${aiServices.detection}`;
    
    // Simple in-memory cache (in production, use Redis or similar)
    const inMemoryCache = new Map<string, AIAnalysisResult>();
    const getFromCache = (key: string) => inMemoryCache.get(key);
    const setInCache = (key: string, value: AIAnalysisResult) => inMemoryCache.set(key, value);
    
    const cachedResult = getFromCache(cacheKey);
    if (cachedResult) {
      cacheHit = true;
      updateProgress('cache', 'Using cached analysis results', 100);
      
      logger.info('Using cached AI analysis result', { 
        publicId: rawPublicId,
        cacheKey,
        services: aiServices 
      });

      return {
        success: true,
        data: cachedResult,
        error: null,
        performance: {
          totalTime: Date.now() - startTime,
          cacheHit: true,
          parallelProcessing: false,
          breakdown: { analysis: Date.now() - startTime }
        },
        croppedImage: null
      };
    }

    updateProgress('quota', 'Checking AI service quotas...', 10);
    logger.info('Selected AI services based on quota', {
      services: aiServices,
      priority,
      itemType,
      quotaStatus: getQuotaStatus()
    });

    // Step 2: Parallel processing attempt (if enabled)
    let cloudinaryData: CloudinaryInfo | undefined;
    let processedId: string | undefined;

    if (enableParallelProcessing) {
      parallelProcessing = true;
      updateProgress('parallel', 'Starting parallel processing...', 15);
      
      try {
        const [processingResult] = await Promise.allSettled([
          processUploadedImage(rawPublicId)
        ]);

        const parallelTime = Date.now() - startTime;
        performanceBreakdown.processing = parallelTime;

        if (processingResult.status === 'fulfilled' && processingResult.value.success) {
          processedId = processingResult.value.data?.public_id;
          if (!processedId) {
            throw new Error('Processing result missing public_id');
          }
          updateProgress('processing', 'Background processing completed (optimized - no canvas)', 60);
          
          // Analyze processed image
          const analysisStart = Date.now();
          const assetDetailsResponse = await getAssetDetails(processedId);
          if (assetDetailsResponse.success && assetDetailsResponse.data) {
            cloudinaryData = assetDetailsResponse.data as CloudinaryInfo;
          } else {
            throw new Error(`Failed to get asset details: ${assetDetailsResponse.error}`);
          }
          performanceBreakdown.analysis = Date.now() - analysisStart;
          updateProgress('analysis', 'AI analysis completed', 80);
        } else {
          throw new ServiceError(
            `Parallel processing failed: ${processingResult.status === 'fulfilled' ? processingResult.value.error : 'Processing rejected'}`,
            "PROCESSING_ERROR"
          );
        }
      } catch (parallelError) {
        logger.warn('Parallel processing failed, falling back to sequential', { error: parallelError });
        parallelProcessing = false;
        // Fall through to sequential processing
      }
    }

    // Step 3: Sequential fallback if parallel failed or disabled
    if (!parallelProcessing) {
      updateProgress('sequential', 'Processing with optimized background removal...', 20);
      
      const processingStart = Date.now();
      const processingResult = await processUploadedImage(rawPublicId);
      performanceBreakdown.processing = Date.now() - processingStart;
      
      if (!processingResult.success || !processingResult.data) {
        throw new ServiceError(
          `Sequential processing failed: ${processingResult.error || "Unknown processing error"}`,
          "PROCESSING_ERROR"
        );
      }
      
      processedId = processingResult.data.public_id;
      updateProgress('processing', 'Background processing completed (optimized - no canvas)', 50);
      
      // Analyze processed image
      const analysisStart = Date.now();
      const assetDetailsResponse = await getAssetDetails(processedId);
      if (assetDetailsResponse.success && assetDetailsResponse.data) {
        cloudinaryData = assetDetailsResponse.data as CloudinaryInfo;
      } else {
        throw new Error(`Failed to get asset details: ${assetDetailsResponse.error}`);
      }
      performanceBreakdown.analysis = Date.now() - analysisStart;
      updateProgress('analysis', 'AI analysis completed', 75);
    }

    // Ensure we have the required data before proceeding
    if (!cloudinaryData || !processedId) {
      throw new Error('Missing cloudinaryData or processedId after processing');
    }

    // Step 4: Update quota tracking
    updateServiceUsage(aiServices);

    // Step 5: Generate smart crop
    updateProgress('cropping', 'Generating smart crop...', 85);
    const cropStart = Date.now();
    
    // Try intelligent cropping approaches in order of preference
    let croppedImageUrl: string;
    
    // 1. Try fashion detection bounding box cropping
    const smartCropUrl = createSmartCropFromFashionDetection(processedId, cloudinaryData);
    
    if (smartCropUrl) {
      croppedImageUrl = smartCropUrl;
      console.log('🎯 Using fashion detection smart crop');
    } else {
      // 2. Fallback to object detection cropping (more general)
      const objectCropUrl = createSmartCropFromObjectDetection(processedId, cloudinaryData);
      
      if (objectCropUrl) {
        croppedImageUrl = objectCropUrl;
        console.log('🎯 Using object detection smart crop');
      } else {
        // 3. Try the original image for fashion detection (sometimes processed images lose context)
        const originalCropUrl = createSmartCropFromFashionDetection(rawPublicId, cloudinaryData);
        
        if (originalCropUrl) {
          croppedImageUrl = originalCropUrl;
          console.log('🎯 Using original image fashion detection crop');
        } else {
          // 4. Final fallback: Use Cloudinary's AI-powered auto-cropping with multiple strategies
          const category = cloudinaryData.tags?.find((tag: string) => 
            ['shoe', 'sandal', 'footwear', 'sneaker', 'boot', 'slipper'].some(shoeTag => 
              tag.toLowerCase().includes(shoeTag)
            )
          );
          
          if (category) {
            // For shoes: focus on lower area and use subject detection
            croppedImageUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_crop,h_0.8,y_0.1/c_fill,w_400,h_400,g_auto:subject,q_auto:best/${processedId}`;
            console.log('🎯 Using shoe-optimized auto-crop');
          } else {
            // General auto-crop
            croppedImageUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_400,h_400,g_auto:subject,q_auto:best/${processedId}`;
            console.log('🎯 Using general auto-crop fallback');
          }
        }
      }
    }
    
    performanceBreakdown.cropGeneration = Date.now() - cropStart;
    updateProgress('cropping', 'Smart crop generated', 95);

    // Step 6: Cache the results (but we need to create the final result first)
    // setInCache will be called after creating finalResult
    
    updateProgress('complete', 'Analysis complete!', 100);

    const totalTime = Date.now() - startTime;
    
    logger.info('Enhanced AI analysis completed', {
      publicId: rawPublicId,
      processedId,
      totalTime,
      parallelProcessing,
      cacheHit,
      breakdown: performanceBreakdown,
      optimization: 'Canvas standardization removed - saved ~0.2s'
    });

    // --- DEBUGGING LOG AS REQUESTED ---
    console.log("--- RAW CLOUDINARY ANALYSIS RESULTS ---");
    console.log(JSON.stringify(cloudinaryData, null, 2));
    console.log("--- PERFORMANCE OPTIMIZATIONS APPLIED ---");
    console.log(`✅ Parallel processing: ${parallelProcessing ? 'YES' : 'NO'}`);
    console.log(`✅ Cache hit: ${cacheHit ? 'YES' : 'NO'}`);
    console.log(`✅ Canvas standardization: REMOVED (saved ~0.2s)`);
    console.log(`✅ Total time: ${totalTime}ms`);
    
    // Log colors data
    console.log("COLORS DETECTION:");
    console.log(JSON.stringify(cloudinaryData.colors || [], null, 2));
    console.log(JSON.stringify(cloudinaryData.predominant || {}, null, 2));
    
    // Log AWS Rekognition tagging
    console.log("AWS REKOGNITION TAGGING:");
    console.log(JSON.stringify(
      cloudinaryData.info?.categorization?.aws_rek_tagging?.data || [], 
      null, 2
    ));
    
    // Log Google Vision tagging
    console.log("GOOGLE VISION TAGGING:");
    console.log(JSON.stringify(
      cloudinaryData.info?.categorization?.google_tagging?.data || [], 
      null, 2
    ));
    
    // Log Imagga tagging
    console.log("IMAGGA TAGGING:");
    console.log(JSON.stringify(
      cloudinaryData.info?.categorization?.imagga_tagging?.data || [], 
      null, 2
    ));
    
    // Log Fashion detection
    console.log("FASHION DETECTION (CLD-FASHION):");
    const fashionDetection = cloudinaryData.info?.detection?.["cld-fashion_v4"]?.data || {};
    console.log(JSON.stringify(fashionDetection, null, 2));
    
    // Also check for legacy format
    const legacyFashionDetection = cloudinaryData.info?.detection?.object_detection?.data?.['cld-fashion'];
    if (legacyFashionDetection) {
      console.log("LEGACY FASHION DETECTION:");
      console.log(JSON.stringify(legacyFashionDetection, null, 2));
    }
    
    // Log available detection services
    console.log("AVAILABLE DETECTION SERVICES:");
    console.log(Object.keys(cloudinaryData.info?.detection || {}));
    
    // Log Captioning
    console.log("IMAGE CAPTIONING:");
    console.log(JSON.stringify(
      cloudinaryData.info?.detection?.captioning?.data || {},
      null, 2
    ));
    // --- END DEBUGGING LOG ---

    logger.info("Processing success: Cleaned image analyzed by Cloudinary.", { 
      newPublicId: cloudinaryData.public_id,
      requestId: cloudinaryData.requestId
    });
    
    // Create final result
    const placeholderDescription = "Analyzed by ClosetAI with tags: " + 
      (mergeAnalysisResults(cloudinaryData, "").tags.slice(0, 5).join(', '));
      
    const mergedResult = mergeAnalysisResults(cloudinaryData, placeholderDescription);
    
    const finalResult: AIAnalysisResult = {
      ...mergedResult,
      imageUrl: cloudinaryData.secure_url,
      processing_metrics: {
        processing_time: totalTime,
        service_used: serviceUsed,
        attempts: attempts,
      },
    };

    // Cache the final result
    setInCache(cacheKey, finalResult);
    
    // Clean up the original raw image
    deleteCloudinaryAsset(rawPublicId);

    logger.info('Enhanced AI analysis completed', {
      publicId: rawPublicId,
      processedId,
      totalTime,
      parallelProcessing,
      cacheHit,
      breakdown: performanceBreakdown,
      optimization: 'Canvas standardization removed - saved ~0.2s'
    });

    return {
      success: true,
      data: finalResult,
      error: null,
      performance: {
        totalTime,
        cacheHit,
        parallelProcessing,
        breakdown: performanceBreakdown
      },
      croppedImage: croppedImageUrl
    };

  } catch (error) {
    serviceUsed = 'fallback';
    attempts++;
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn("Entering fallback: Image processing failed. Analyzing original image.", { 
      error: new Error(errorMessage)
    });
    updateStatus("Processing failed. Analyzing original...");

    try {
        const reanalyzeResponse = await fetch('/api/cloudinary/reanalyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              publicId: rawPublicId,
              itemType: itemType // Pass the item type for better organization
            }),
        });

        if (!reanalyzeResponse.ok) {
            throw new Error(`Fallback reanalysis failed: ${await reanalyzeResponse.text()}`);
        }
        
        const reanalyzeResult = await reanalyzeResponse.json();
        if (!reanalyzeResult.success || !reanalyzeResult.public_id) {
            throw new Error('Reanalysis endpoint returned invalid response');
        }
        
        updateStatus("Getting analysis data...");
        
        // Wait a moment to allow Cloudinary to process the AI analysis
        logger.info("Waiting for Cloudinary AI analysis to complete...");
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Use our enhanced function with retries
        const assetDetailsResponse = await getAssetDetails(rawPublicId);
        if (assetDetailsResponse.success && assetDetailsResponse.data) {
          cloudinaryData = assetDetailsResponse.data as CloudinaryInfo;
        } else {
          throw new Error(`Failed to get asset details: ${assetDetailsResponse.error}`);
        }
        
        // If we still don't have analysis data, log a warning
        if (cloudinaryData && (!cloudinaryData.info?.categorization && !cloudinaryData.info?.detection)) {
            logger.warn("AI analysis may be incomplete - some services did not return data", {
                publicId: rawPublicId
            });
        }
        
        // --- DEBUGGING LOG AS REQUESTED (FALLBACK) ---
        if (cloudinaryData) {
          console.log("--- RAW CLOUDINARY ANALYSIS RESULTS (FALLBACK) ---");
          console.log(JSON.stringify(cloudinaryData, null, 2));
          
          // Add additional detailed logging for each Cloudinary service
          console.log("--- CLOUDINARY SERVICES BREAKDOWN ---");
          
          // Log colors data
          console.log("COLORS DETECTION:");
          console.log(JSON.stringify(cloudinaryData.colors || [], null, 2));
          console.log(JSON.stringify(cloudinaryData.predominant || {}, null, 2));
          
          // Log AWS Rekognition tagging
          console.log("AWS REKOGNITION TAGGING:");
          console.log(JSON.stringify(
            cloudinaryData.info?.categorization?.aws_rek_tagging?.data || [], 
            null, 2
          ));
          
          // Log Google Vision tagging
          console.log("GOOGLE VISION TAGGING:");
          console.log(JSON.stringify(
            cloudinaryData.info?.categorization?.google_tagging?.data || [], 
            null, 2
          ));
          
          // Log Imagga tagging
          console.log("IMAGGA TAGGING:");
          console.log(JSON.stringify(
            cloudinaryData.info?.categorization?.imagga_tagging?.data || [], 
            null, 2
          ));
          
          // Log Fashion detection
          console.log("FASHION DETECTION (CLD-FASHION):");
          console.log(JSON.stringify(
            cloudinaryData.info?.detection?.["cld-fashion_v4"]?.data || {},
            null, 2
          ));
          
          // Log Captioning
          console.log("IMAGE CAPTIONING:");
          console.log(JSON.stringify(
            cloudinaryData.info?.detection?.captioning?.data || {},
            null, 2
          ));
        }
        // --- END DEBUGGING LOG ---
        
    } catch (fallbackError) {
        const errorMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        const serviceError = new ServiceError(
            `The AI analysis service failed completely: ${errorMsg}`,
            ServiceErrorCode.ANALYSIS_ERROR
        );
        return { 
          success: false, 
          error: serviceError.message, 
          data: null,
          performance: {
            totalTime: Date.now() - startTime,
            cacheHit: false,
            parallelProcessing,
            breakdown: performanceBreakdown
          }
        };
    }
  }
  
  // Final processing (moved outside the catch block)
  if (cloudinaryData) {
    try {
      updateStatus("Finalizing analysis...");
      
      // Create a placeholder description since HF is removed
      const placeholderDescription = "Analyzed by ClosetAI with tags: " + 
        (mergeAnalysisResults(cloudinaryData, "").tags.slice(0, 5).join(', '));
        
      const mergedResult = mergeAnalysisResults(cloudinaryData, placeholderDescription);
      const processingTime = Date.now() - startTime;
      
      const finalResult: AIAnalysisResult = {
        ...mergedResult,
        imageUrl: cloudinaryData.secure_url,
        processing_metrics: {
          processing_time: processingTime,
          service_used: serviceUsed,
          attempts: attempts,
        },
      };

      logger.info("AI analysis completed successfully", {
        processingTime,
        serviceUsed,
        attempts,
        tagsFound: finalResult.tags.length,
        colorsFound: finalResult.colors.length
      });

      return { 
        success: true, 
        data: finalResult, 
        error: null,
        performance: {
          totalTime: processingTime,
          cacheHit,
          parallelProcessing,
          breakdown: performanceBreakdown
        }
      };

    } catch (mergingError) {
      const errorMsg = mergingError instanceof Error ? mergingError.message : String(mergingError);
      const serviceError = new ServiceError(
          `The AI analysis service failed during the final merging step: ${errorMsg}`,
          ServiceErrorCode.ANALYSIS_ERROR
      );
      return { 
        success: false, 
        error: serviceError.message, 
        data: null,
        performance: {
          totalTime: Date.now() - startTime,
          cacheHit,
          parallelProcessing,
          breakdown: performanceBreakdown
        }
      };
    }
  } else {
    // If we don't have cloudinaryData, return error
    return { 
      success: false, 
      error: "Failed to obtain cloudinary data", 
      data: null,
      performance: {
        totalTime: Date.now() - startTime,
        cacheHit,
        parallelProcessing,
        breakdown: performanceBreakdown
      }
    };
  }
}
