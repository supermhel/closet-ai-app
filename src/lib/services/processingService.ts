/**
 * Processing Service
 * 
 * This service handles communication with the Python processing service
 * for image standardization (object detection, background removal, and canvas placement).
 */

import logger from "@/utils/logger";
import { ServiceError, ServiceResponse } from "@/utils/serviceUtils";

/**
 * Interface for the response from the processing service
 */
export interface ProcessedImageResult {
  public_id: string;
  secure_url: string;
  version: string;
  processing_metrics?: {
    processing_time: number;
    service_url: string;
    model_used?: string;
  };
}

/**
 * Interface for service health check response
 */
interface ServiceHealthResponse {
  status: string;
  version?: string;
  features?: string[];
}

/**
 * Configuration for processing service
 */
const PROCESSING_CONFIG = {
  serviceUrl: process.env.PROCESSING_SERVICE_URL || 'http://localhost:8000',
  timeout: 35000, // 35 seconds - generous timeout for processing
  healthTimeout: 5000, // 5 seconds for health checks
  retryAttempts: 2,
  retryDelay: 1000, // 1 second between retries
};

/**
 * Checks if the processing service is healthy and available
 */
export async function checkProcessingServiceHealth(): Promise<ServiceResponse<ServiceHealthResponse>> {
  try {
    logger.info("Checking processing service health", { 
      serviceUrl: PROCESSING_CONFIG.serviceUrl 
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROCESSING_CONFIG.healthTimeout);

    const response = await fetch(`${PROCESSING_CONFIG.serviceUrl}/`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ServiceError(
        `Service health check failed with status ${response.status}`,
        "SERVICE_UNHEALTHY"
      );
    }

    const healthData = await response.json();
    
    logger.info("Processing service health check successful", {
      status: healthData.status,
      version: healthData.version
    });

    return {
      success: true,
      data: healthData,
      error: null,
      code: null,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error("Processing service health check failed", { 
      serviceUrl: PROCESSING_CONFIG.serviceUrl,
      error: new Error(errorMessage)
    });
    
    return {
      success: false,
      data: null,
      error: errorMessage,
      code: error instanceof ServiceError ? error.code : "HEALTH_CHECK_FAILED",
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Sends an image to the Python processing service for standardization
 * 
 * @param publicId - The Cloudinary public_id of the image to process
 * @returns A ServiceResponse containing the processed image information
 */
export async function processUploadedImage(publicId: string): Promise<ServiceResponse<ProcessedImageResult>> {
  const startTime = Date.now();
  
  // Validate input
  if (!publicId || typeof publicId !== 'string' || publicId.trim().length === 0) {
    return {
      success: false,
      data: null,
      error: "Invalid public_id: must be a non-empty string",
      code: "INVALID_INPUT",
      timestamp: new Date().toISOString()
    };
  }

  let attempt = 0;
  let lastError: Error = new Error("No attempts made");

  while (attempt < PROCESSING_CONFIG.retryAttempts) {
    try {
      attempt++;
      logger.info("Sending image to processing service", { 
        publicId, 
        attempt, 
        maxAttempts: PROCESSING_CONFIG.retryAttempts,
        serviceUrl: PROCESSING_CONFIG.serviceUrl
      });
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PROCESSING_CONFIG.timeout);

      const response = await fetch('/api/processing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': `proc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        },
        body: JSON.stringify({ publicId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        // Handle specific error cases
        if (response.status === 503) {
          throw new ServiceError(
            "Processing service is not available. Please ensure the Docker container is running.",
            "SERVICE_UNAVAILABLE"
          );
        }
        
        if (response.status === 408 || response.status === 504) {
          throw new ServiceError(
            "Processing service timeout. The image may be too large or complex.",
            "PROCESSING_TIMEOUT"
          );
        }

        throw new ServiceError(
          errorData.error || `Processing service returned status ${response.status}`,
          errorData.code || "PROCESSING_ERROR"
        );
      }

      const result = await response.json();
      
      if (!result.public_id || !result.secure_url) {
        throw new ServiceError(
          "Processing service returned incomplete data - missing public_id or secure_url",
          "INCOMPLETE_RESPONSE"
        );
      }

      const processingTime = Date.now() - startTime;
      
      logger.info("Image processing successful", { 
        originalId: publicId,
        processedId: result.public_id,
        processingTime,
        attempt
      });

      return {
        success: true,
        data: {
          public_id: result.public_id,
          secure_url: result.secure_url,
          version: result.version || "1",
          processing_metrics: {
            processing_time: processingTime,
            service_url: PROCESSING_CONFIG.serviceUrl,
            model_used: result.model_used,
          }
        },
        error: null,
        code: null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      logger.warn("Image processing attempt failed", { 
        publicId, 
        attempt,
        maxAttempts: PROCESSING_CONFIG.retryAttempts,
        error: lastError.message
      });
      
      // Don't retry on certain error types
      if (error instanceof ServiceError && 
          ['INVALID_INPUT', 'SERVICE_UNAVAILABLE'].includes(error.code)) {
        break;
      }
      
      // Wait before retry (except on last attempt)
      if (attempt < PROCESSING_CONFIG.retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, PROCESSING_CONFIG.retryDelay));
      }
    }
  }
  
  const errorMessage = lastError.message;
  const errorCode = lastError instanceof ServiceError ? lastError.code : "UNKNOWN_ERROR";
  
  logger.error("Image processing failed after all attempts", { 
    publicId, 
    attempts: attempt,
    error: lastError
  });
  
  return {
    success: false,
    data: null,
    error: errorMessage,
    code: errorCode,
    timestamp: new Date().toISOString()
  };
}

/**
 * Gets the current configuration for the processing service
 */
export function getProcessingServiceConfig() {
  return {
    ...PROCESSING_CONFIG,
    // Don't expose sensitive information
    serviceUrl: PROCESSING_CONFIG.serviceUrl.replace(/localhost/g, '***'),
  };
} 