from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl, validator
import logging
import sys
import os
import time
import io
import traceback
import asyncio
from typing import Optional, Dict, Any

from process import process_image, ProcessingError, find_best_object

# --- LOGGING CONFIGURATION ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

# --- CONFIGURATION ---
SERVICE_CONFIG = {
    "version": "3.2.0",
    "max_image_size": 10 * 1024 * 1024,  # 10MB
    "processing_timeout": 30,  # 30 seconds
    "max_concurrent_requests": 3,  # Limit concurrent processing
}

# Global semaphore to limit concurrent requests
processing_semaphore = asyncio.Semaphore(SERVICE_CONFIG["max_concurrent_requests"])

# --- FASTAPI APP INITIALIZATION ---
app = FastAPI(
    title="Closet AI - Image Processing Service",
    description="This service processes clothing images by detecting the primary item, cropping it, and removing the background.",
    version=SERVICE_CONFIG["version"],
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REQUEST/RESPONSE MODELS ---
class ImageRequest(BaseModel):
    image_url: HttpUrl
    
    @validator('image_url')
    def validate_image_url(cls, v):
        url_str = str(v)
        if not any(url_str.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp']) and 'cloudinary.com' not in url_str:
            raise ValueError('URL must point to a valid image format or be from Cloudinary')
        return v

class ProcessingResponse(BaseModel):
    success: bool
    message: str
    processing_time: Optional[float] = None
    model_used: Optional[str] = None
    details: Dict[str, Any] = {}

class HealthResponse(BaseModel):
    message: str
    version: str
    status: str
    features: list
    system_info: Dict[str, Any]

# --- UTILITY FUNCTIONS ---
def get_system_info() -> Dict[str, Any]:
    """Get basic system information for health checks"""
    import psutil
    import platform
    
    try:
        return {
            "platform": platform.system(),
            "python_version": platform.python_version(),
            "cpu_count": psutil.cpu_count(),
            "memory_available": f"{psutil.virtual_memory().available / (1024**3):.1f}GB",
            "disk_usage": f"{psutil.disk_usage('/').percent}%"
        }
    except Exception as e:
        logger.warning(f"Could not get system info: {e}")
        return {"error": "System info unavailable"}

# --- MIDDLEWARE ---
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Generate a request ID
    request_id = os.urandom(8).hex()
    
    # Add request ID to the request state
    request.state.request_id = request_id
    
    # Log incoming request
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    logger.info(
        f"Request started: {request.method} {request.url.path} "
        f"[ID: {request_id}] [IP: {client_ip}] [UA: {user_agent[:50]}...]"
    )
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(
            f"Request completed: {request.method} {request.url.path} "
            f"[ID: {request_id}] - Status: {response.status_code} - Time: {process_time:.3f}s"
        )
        
        # Add performance headers
        response.headers["X-Processing-Time"] = f"{process_time:.3f}"
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Service-Version"] = SERVICE_CONFIG["version"]
        
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(
            f"Request failed: {request.method} {request.url.path} "
            f"[ID: {request_id}] - Error: {str(e)} - Time: {process_time:.3f}s"
        )
        raise

# --- ERROR HANDLERS ---
@app.exception_handler(ProcessingError)
async def processing_error_handler(request: Request, exc: ProcessingError):
    request_id = getattr(request.state, "request_id", "unknown")
    logger.error(f"Processing error [ID: {request_id}]: {exc.message}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "detail": exc.message,
            "request_id": request_id,
            "error_type": "ProcessingError",
            "error_details": exc.details,
            "troubleshooting": {
                "common_causes": [
                    "Invalid image URL",
                    "Image too large or corrupted",
                    "Network timeout downloading image",
                    "Background removal model failure"
                ],
                "suggestions": [
                    "Verify the image URL is accessible",
                    "Try with a smaller image",
                    "Check network connectivity"
                ]
            }
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", "unknown")
    logger.error(f"Unhandled exception [ID: {request_id}]: {str(exc)}")
    logger.error(traceback.format_exc())
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "detail": "An unexpected error occurred during processing",
            "request_id": request_id,
            "error_type": type(exc).__name__,
            "troubleshooting": {
                "message": "This appears to be an internal server error. Please check the service logs for more details.",
                "contact": "Check the processing service container logs for detailed error information"
            }
        }
    )

# --- API ENDPOINTS ---
@app.get("/", response_model=HealthResponse)
async def root():
    """Enhanced root endpoint providing detailed service status and information."""
    return HealthResponse(
        message="Closet AI - Image Processing Service is running!",
        version=SERVICE_CONFIG["version"],
        status="healthy",
        features=[
            "Smart object detection using size, position, and confidence scoring",
            "Automatic margin addition for better framing",
            "Background removal with transparent PNG output",
            "Multi-model fallback system",
            "Performance monitoring and metrics",
            "Concurrent request limiting"
        ],
        system_info=get_system_info()
    )

@app.get("/health")
async def health_check():
    """Dedicated health check endpoint for monitoring systems."""
    try:
        # Perform a quick system check
        system_info = get_system_info()
        
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "version": SERVICE_CONFIG["version"],
            "system": system_info,
            "active_requests": SERVICE_CONFIG["max_concurrent_requests"] - processing_semaphore._value
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.post("/process")
async def process_image_endpoint(request: Request):
    """
    Enhanced image processing endpoint with better error handling and monitoring.
    
    Processes a clothing image by:
    1. Validating input parameters
    2. Detecting the primary item using YOLOv8 with multi-factor scoring (if enabled)
    3. Cropping the image with a small margin for better framing
    4. Removing the background using optimized models with fallback
    5. Returning the resulting PNG image with a transparent background
    
    Returns a PNG image with transparent background if successful.
    """
    request_id = getattr(request.state, "request_id", "unknown")
    start_time = time.time()
    
    # Acquire semaphore to limit concurrent processing
    async with processing_semaphore:
        try:
            # Parse and validate the request body
            body = await request.json()
            image_url = body.get("image_url")
            
            if not image_url:
                raise ProcessingError(
                    "Missing required parameter: image_url", 
                    status_code=400,
                    details={"parameter": "image_url", "provided": None}
                )
            
            # Validate URL format
            if not isinstance(image_url, str) or len(image_url.strip()) == 0:
                raise ProcessingError(
                    "Invalid image_url: must be a non-empty string",
                    status_code=400,
                    details={"parameter": "image_url", "provided": type(image_url).__name__}
                )
                
            logger.info(f"Processing image from URL: {image_url} [ID: {request_id}]")
            
            # Create a timeout wrapper
            async def process_with_timeout():
                loop = asyncio.get_event_loop()
                return await loop.run_in_executor(None, process_image, str(image_url))
            
            try:
                # Process the image with timeout
                image_bytes = await asyncio.wait_for(
                    process_with_timeout(), 
                    timeout=SERVICE_CONFIG["processing_timeout"]
                )
            except asyncio.TimeoutError:
                raise ProcessingError(
                    f"Processing timeout after {SERVICE_CONFIG['processing_timeout']} seconds",
                    status_code=408,
                    details={
                        "timeout": SERVICE_CONFIG["processing_timeout"],
                        "suggestion": "Try with a smaller image or increase timeout"
                    }
                )
            
            if not image_bytes or len(image_bytes) == 0:
                raise ProcessingError(
                    "Processing completed but returned empty image data",
                    status_code=500,
                    details={"output_size": 0}
                )
            
            processing_time = time.time() - start_time
            
            logger.info(
                f"Successfully processed image [ID: {request_id}] - "
                f"Time: {processing_time:.3f}s, Size: {len(image_bytes)} bytes"
            )
            
            # Return the processed image bytes with enhanced headers
            return StreamingResponse(
                io.BytesIO(image_bytes), 
                media_type="image/png",
                headers={
                    "X-Request-ID": request_id,
                    "X-Processing-Time": f"{processing_time:.3f}",
                    "X-Output-Size": str(len(image_bytes)),
                    "X-Service-Version": SERVICE_CONFIG["version"],
                    "Cache-Control": "no-cache",
                    "Content-Disposition": f"inline; filename=processed_{request_id}.png"
                }
            )
        
        except ProcessingError as e:
            # Let the exception handler deal with this
            raise
        
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"Unexpected error during image processing [ID: {request_id}]: {e}")
            logger.error(traceback.format_exc())
            
            raise HTTPException(
                status_code=500, 
                detail={
                    "message": f"An unexpected error occurred during image processing: {str(e)}",
                    "request_id": request_id,
                    "processing_time": processing_time,
                    "error_type": type(e).__name__
                }
            )

@app.get("/metrics")
async def get_metrics():
    """Basic metrics endpoint for monitoring."""
    try:
        import psutil
        
        return {
            "service": {
                "version": SERVICE_CONFIG["version"],
                "uptime": time.time(),  # Could be enhanced with actual uptime tracking
                "active_requests": SERVICE_CONFIG["max_concurrent_requests"] - processing_semaphore._value,
                "max_concurrent": SERVICE_CONFIG["max_concurrent_requests"]
            },
            "system": {
                "cpu_percent": psutil.cpu_percent(interval=1),
                "memory_percent": psutil.virtual_memory().percent,
                "disk_percent": psutil.disk_usage('/').percent
            },
            "config": {
                "max_image_size": SERVICE_CONFIG["max_image_size"],
                "processing_timeout": SERVICE_CONFIG["processing_timeout"]
            }
        }
    except Exception as e:
        logger.error(f"Failed to get metrics: {e}")
        return {"error": "Metrics unavailable", "message": str(e)}
