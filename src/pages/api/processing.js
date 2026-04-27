import logger from "@/utils/logger";
import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinaryAdmin";

// Configuration
const PROCESSING_CONFIG = {
  serviceUrl: process.env.PROCESSING_SERVICE_URL || 'http://localhost:8000',
  timeout: 30000, // 30 second timeout
  healthTimeout: 5000, // 5 second health check timeout
  maxRetries: 2,
};

// Helper function to upload a buffer to Cloudinary
const uploadStream = (buffer, options) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    }).end(buffer);
  });
};

// Helper function to validate Cloudinary public_id format
const isValidPublicId = (publicId) => {
  if (!publicId || typeof publicId !== 'string') return false;
  // Basic validation - should not be empty and should not contain dangerous characters
  return publicId.trim().length > 0 && !/[<>'"&]/.test(publicId);
};

// Helper function to check service health
const checkServiceHealth = async (serviceUrl, timeout = PROCESSING_CONFIG.healthTimeout) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(`${serviceUrl}/`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return { healthy: response.ok, status: response.status };
  } catch (error) {
    clearTimeout(timeoutId);
    return { healthy: false, error: error.message };
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    logger.warn("Invalid method for processing endpoint", { method: req.method });
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  if (!isCloudinaryConfigured) {
    logger.error("Cloudinary Admin SDK not configured on the server.");
    return res.status(500).json({ error: "Image processing backend is not configured." });
  }

  const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  const startTime = Date.now();
  
  try {
    const { publicId } = req.body;
    
    // Enhanced input validation
    if (!publicId) {
      logger.error("Missing public ID for image processing", { requestId });
      return res.status(400).json({ 
        error: "Image public ID is required",
        code: "MISSING_PUBLIC_ID",
        requestId 
      });
    }

    if (!isValidPublicId(publicId)) {
      logger.error("Invalid public ID format", { requestId, publicId });
      return res.status(400).json({
        error: "Invalid public ID format",
        code: "INVALID_PUBLIC_ID",
        requestId
      });
    }

    const detectionServiceUrl = PROCESSING_CONFIG.serviceUrl;
    logger.info(`Processing request for public_id: ${publicId}`, { 
      requestId, 
      serviceUrl: detectionServiceUrl 
    });
    
    // Enhanced health check with detailed error reporting
    logger.info(`Checking processing service health at ${detectionServiceUrl}`, { requestId });
    const healthCheck = await checkServiceHealth(detectionServiceUrl);
    
    if (!healthCheck.healthy) {
      logger.error("Processing service health check failed", { 
        requestId,
        serviceUrl: detectionServiceUrl,
        error: healthCheck.error,
        status: healthCheck.status,
      });
      
      return res.status(503).json({
        error: "Processing service is not available",
        message: healthCheck.error || `Service returned status ${healthCheck.status}`,
        code: "SERVICE_UNAVAILABLE",
        requestId,
        troubleshooting: {
          service_url: detectionServiceUrl,
          suggestion: "Ensure the Docker container is running: docker-compose up -d processing-service"
        }
      });
    }
    
    logger.info("Processing service is healthy", { requestId });

    // Construct the full URL from the public ID with enhanced error handling
    let imageUrl;
    try {
      imageUrl = cloudinary.url(publicId, {
        resource_type: 'image',
        type: 'upload',
        secure: true,
        version: Date.now(), // Cache busting
        format: 'png', // Consistent format
        fetch_format: 'auto', // Let Cloudinary optimize
        quality: 'auto', // Let Cloudinary optimize quality
      });
      
      if (!imageUrl) {
        throw new Error("Failed to generate Cloudinary URL");
      }
      
      logger.info(`Generated Cloudinary URL for processing`, { 
        requestId, 
        publicId,
        hasUrl: !!imageUrl
      });
      
    } catch (urlError) {
      logger.error("Failed to generate Cloudinary URL", {
        requestId,
        publicId,
        error: urlError.message
      });
      
      return res.status(400).json({
        error: "Failed to generate image URL from public ID",
        code: "URL_GENERATION_FAILED",
        requestId
      });
    }

    let attempt = 0;
    let lastError = null;
    
    // Retry logic for processing service calls
    while (attempt < PROCESSING_CONFIG.maxRetries) {
      attempt++;
      
      try {
        logger.info(`Calling processing service (attempt ${attempt}/${PROCESSING_CONFIG.maxRetries})`, { 
          requestId, 
          publicId,
          serviceUrl: detectionServiceUrl
        });
        
        // Create abort controller for timeout management
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), PROCESSING_CONFIG.timeout);
        
        const processingResponse = await fetch(`${detectionServiceUrl}/process`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
            'User-Agent': 'ClosetAI-API/1.0'
          },
          body: JSON.stringify({ image_url: imageUrl }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!processingResponse.ok) {
          // Enhanced error handling with detailed error extraction
          let errorDetail = "Unknown error from processing service";
          let errorDetails = {};
          
          try {
            const contentType = processingResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorResponse = await processingResponse.json();
              errorDetail = errorResponse.detail || errorResponse.error || errorResponse.message || errorDetail;
              errorDetails = {
                ...errorResponse,
                request_id: errorResponse.request_id || requestId
              };
            } else {
              errorDetail = await processingResponse.text();
            }
          } catch (readError) {
            logger.error("Failed to read error response from processing service", { 
              requestId,
              readError: readError.message,
              status: processingResponse.status
            });
            errorDetail = `Processing service returned ${processingResponse.status} but response could not be read`;
          }
          
          const error = new Error(`Processing failed: ${errorDetail}`);
          error.status = processingResponse.status;
          error.details = errorDetails;
          throw error;
        }

        // Get processed image bytes with size validation
        const processedImageBuffer = await processingResponse.arrayBuffer();
        
        if (!processedImageBuffer || processedImageBuffer.byteLength === 0) {
          throw new Error("Processing service returned empty image data");
        }
        
        if (processedImageBuffer.byteLength > 10 * 1024 * 1024) { // 10MB limit
          logger.warn("Processed image is very large", {
            requestId,
            publicId,
            size: processedImageBuffer.byteLength
          });
        }

        logger.info("Successfully received processed image from service", { 
          requestId,
          publicId,
          imageSize: processedImageBuffer.byteLength,
          attempt
        });

        // Upload processed image to Cloudinary with enhanced error handling
        logger.info("Uploading processed image to Cloudinary", { requestId, publicId });
        
        const uploadResult = await uploadStream(Buffer.from(processedImageBuffer), {
          upload_preset: 'closet_ai_upload',
          // Let the preset handle the folder (wardrobe) - don't override it
          context: {
            original_public_id: publicId,
            processed_by: 'ai_service',
            request_id: requestId,
            processing_version: 'v3'
          },
          tags: ['processed', 'ai_enhanced']
        });

        if (!uploadResult || !uploadResult.public_id) {
          throw new Error("Cloudinary upload failed - no result returned");
        }

        const processingTime = Date.now() - startTime;
        
        logger.info("Successfully processed and uploaded clean image", { 
          requestId,
          originalPublicId: publicId,
          newPublicId: uploadResult.public_id,
          processingTime,
          totalAttempts: attempt
        });
        
        // Return enhanced response with metrics
        return res.status(200).json({
          ...uploadResult,
          requestId,
          processing_metrics: {
            processing_time: processingTime,
            attempts: attempt,
            service_version: 'v3',
            original_public_id: publicId
          }
        });
        
      } catch (attemptError) {
        lastError = attemptError;
        
        logger.warn(`Processing attempt ${attempt} failed`, {
          requestId,
          publicId,
          attempt,
          maxAttempts: PROCESSING_CONFIG.maxRetries,
          error: attemptError.message,
          status: attemptError.status
        });
        
        // Don't retry on certain errors
        if (attemptError.status === 400 || attemptError.status === 413) {
          break; // Bad request or payload too large - don't retry
        }
        
        // Wait before retry (except on last attempt)
        if (attempt < PROCESSING_CONFIG.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        }
      }
    }
    
    // All attempts failed - return detailed error
    const totalTime = Date.now() - startTime;
    
    logger.error("Processing failed after all attempts", { 
      requestId,
      publicId,
      attempts: attempt,
      totalTime,
      finalError: lastError?.message,
      errorStatus: lastError?.status
    });
    
    return res.status(lastError?.status || 500).json({
      error: lastError?.details?.detail || lastError?.message || "Processing failed after multiple attempts",
      code: "PROCESSING_FAILED",
      requestId,
      attempts: attempt,
      processing_time: totalTime,
      details: lastError?.details || {},
      troubleshooting: {
        service_url: detectionServiceUrl,
        suggestion: "Check processing service logs for detailed error information"
      }
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    
    logger.error("Unexpected error in processing endpoint", { 
      requestId,
      errorMessage: error.message,
      stack: error.stack,
      processingTime: totalTime
    });
    
    return res.status(500).json({ 
      error: "An internal server error occurred during image processing",
      message: error.message,
      code: "INTERNAL_ERROR",
      requestId,
      processing_time: totalTime
    });
  }
} 