import io
import os
import logging
import requests
from PIL import Image
from ultralytics import YOLO
from rembg import remove, new_session # Import the session management for better performance
import numpy as np
import time
import tempfile # Added for temporary file handling

# --- Configuration ---
logger = logging.getLogger(__name__)
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'yolov8n.pt')  # Use the smaller nano model
FINAL_IMAGE_SIZE = (800, 800)  # Standard canvas size (width, height)
FINAL_IMAGE_BG_COLOR = (255, 255, 255, 255) # White background (RGBA)

# --- Performance Settings ---
ENABLE_OBJECT_DETECTION = False  # Disabled - failing and wasting ~2.5 seconds
MAX_IMAGE_DIMENSION = 1024  # Resize large images before processing

# --- Background Removal Model Options ---
# Keeping only the two best performing models
BG_REMOVAL_MODELS = {
    "u2netp": "u2netp",         # Best balance of speed and quality
    "silueta": "silueta",       # Fastest fallback option
}

# Default model - u2netp with silueta as fallback
DEFAULT_BG_MODEL = "u2netp"  # Primary model for best balance
FALLBACK_BG_MODEL = "silueta"  # Fallback if u2netp fails

# --- Model Loading ---
bg_sessions = {}
try:
    # Load YOLO model at startup to avoid cold start delays
    start_time = time.time()
    model = YOLO(MODEL_PATH)
    logger.info(f"YOLO model loaded successfully from {MODEL_PATH} in {time.time() - start_time:.2f}s")
    
    # Initialize background removal sessions for all models
    for name, model_name in BG_REMOVAL_MODELS.items():
        try:
            session_start = time.time()
            bg_sessions[name] = new_session(model_name)
            logger.info(f"Background removal model {name} ({model_name}) initialized in {time.time() - session_start:.2f}s")
        except Exception as e:
            logger.error(f"Failed to initialize {name} model: {e}")
            bg_sessions[name] = None
    
    logger.info(f"Available BG models: {list(bg_sessions.keys())}")
    
except Exception as e:
    model = None
    bg_sessions = {}
    logger.error(f"FATAL: Error loading models. Error: {e}")

# --- Custom Error Class ---
class ProcessingError(Exception):
    def __init__(self, message, status_code=500, details=None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

# --- Improved Object Detection Function ---
def find_best_object(results, original_image):
    """
    Find the best object in the image using multiple criteria.
    Returns None if no suitable object is found.
    """
    try:
        if not results or len(results) == 0:
            logger.info("No objects detected by YOLO")
            return None
        
        # Check if boxes attribute exists and has content
        if not hasattr(results[0], 'boxes') or len(results[0].boxes) == 0:
            logger.info("No boxes detected by YOLO")
            return None
        
        # Safely extract boxes and confidences
        try:
            boxes = results[0].boxes.xyxy.cpu().numpy()
            confidences = results[0].boxes.conf.cpu().numpy()
            
            # Check if we have valid data
            if len(boxes) == 0 or len(confidences) == 0:
                logger.info("Empty detection results")
                return None
                
        except Exception as e:
            logger.error(f"Error extracting boxes from YOLO results: {e}")
            return None
        
        img_width, img_height = original_image.size
        img_area = img_width * img_height
        img_center_x, img_center_y = img_width / 2, img_height / 2
        
        best_score = -1
        best_box_idx = 0
        
        logger.info(f"Found {len(boxes)} objects with confidences: {confidences}")
        
        for i, (box, conf) in enumerate(zip(boxes, confidences)):
            x1, y1, x2, y2 = box
            
            # Calculate box area and relative size
            box_area = (x2 - x1) * (y2 - y1)
            size_score = box_area / img_area
            
            # Calculate center proximity (how close to image center)
            box_center_x = (x1 + x2) / 2
            box_center_y = (y1 + y2) / 2
            center_distance = ((box_center_x - img_center_x) / img_width) ** 2 + ((box_center_y - img_center_y) / img_height) ** 2
            center_score = 1 - min(center_distance, 1.0)
            
            # Aspect ratio score (prefer reasonable aspect ratios)
            box_width = x2 - x1
            box_height = y2 - y1
            aspect_ratio = box_width / box_height if box_height > 0 else 1
            aspect_score = 1.0 / (1.0 + abs(aspect_ratio - 1.0))  # Prefer square-ish objects
            
            # Combined score with adjusted weights
            combined_score = (size_score * 0.4) + (center_score * 0.3) + (conf * 0.2) + (aspect_score * 0.1)
            
            logger.info(f"Object {i}: conf={conf:.3f}, size={size_score:.3f}, center={center_score:.3f}, aspect={aspect_score:.3f}, combined={combined_score:.3f}")
            
            if combined_score > best_score:
                best_score = combined_score
                best_box_idx = i
        
        # Only return the box if it meets minimum criteria
        if best_score > 0.2:  # Minimum threshold
            logger.info(f"Selected object {best_box_idx} with score {best_score:.3f}")
            return boxes[best_box_idx]
        else:
            logger.info(f"No object meets minimum criteria (best score: {best_score:.3f})")
            return None
            
    except Exception as e:
        logger.error(f"Error in find_best_object: {e}")
        return None

# --- Helper function to resize large images ---
def resize_if_needed(image):
    """Resize image if it's too large to improve performance"""
    width, height = image.size
    max_dim = max(width, height)
    
    if max_dim <= MAX_IMAGE_DIMENSION:
        return image
    
    scale = MAX_IMAGE_DIMENSION / max_dim
    new_width = int(width * scale)
    new_height = int(height * scale)
    
    logger.info(f"Resizing image from {width}x{height} to {new_width}x{new_height} for better performance")
    return image.resize((new_width, new_height), Image.Resampling.LANCZOS)

# --- Main Processing Pipeline ---
def process_image(image_url: str) -> bytes:
    """
    Process an image with optimized settings for speed and quality.
    
    Args:
        image_url: URL of the image to process
    """
    if model is None and ENABLE_OBJECT_DETECTION:
        raise ProcessingError("Image processing model is not available.", status_code=503)
    
    # Use default background removal model
    selected_bg_model = DEFAULT_BG_MODEL
    bg_session = bg_sessions.get(selected_bg_model)
    if bg_session is None:
        logger.warn(f"Background removal session for {selected_bg_model} not initialized, using fallback")
        selected_bg_model = FALLBACK_BG_MODEL
        bg_session = bg_sessions.get(selected_bg_model)

    start_time = time.time()
    logger.info(f"Starting processing with BG model: {selected_bg_model}")

    # 1. Download image
    logger.info(f"Step 1/5: Downloading image...")
    try:
        response = requests.get(image_url, timeout=20)
        response.raise_for_status()
        input_image = Image.open(io.BytesIO(response.content)).convert("RGB")
        logger.info(f"Download completed in {time.time() - start_time:.2f}s - Image size: {input_image.size}")
        
        # Resize large images for better performance
        original_size = input_image.size
        input_image = resize_if_needed(input_image)
        if input_image.size != original_size:
            logger.info(f"Image resized from {original_size} to {input_image.size}")
            
    except requests.exceptions.RequestException as e:
        raise ProcessingError(f"Failed to download image: {e}", status_code=400)
    
    detect_time = time.time()
    primary_box = None
    
    # 2. Detect primary object (if enabled)
    if ENABLE_OBJECT_DETECTION and model is not None:
        logger.info("Step 2/5: Detecting main object...")
        try:
            # Try using the PIL image directly with YOLO
            try:
                results = model(input_image, conf=0.1, verbose=False)
                    
                if results and len(results) > 0:
                    primary_box = find_best_object(results, input_image)
                    if primary_box is not None:
                        logger.info(f"Object detection completed in {time.time() - detect_time:.2f}s")
                    else:
                        logger.info("No suitable objects detected")
                else:
                    logger.info("No objects detected by YOLO")
                    primary_box = None
            except Exception as e:
                logger.error(f"Error running YOLO model: {e}")
                primary_box = None
        except Exception as e:
            logger.error(f"Error during object detection: {e}")
            # If detection fails, process the whole image
            primary_box = None
    else:
        logger.info("Step 2/5: Object detection skipped (disabled or model unavailable)")

    crop_time = time.time()
    # 3. Crop image
    logger.info("Step 3/5: Cropping to main object...")
    if primary_box is not None:
        x1, y1, x2, y2 = map(int, primary_box)
        # Add generous margins
        margin_x = int((x2 - x1) * 0.1)  # Increased margin
        margin_y = int((y2 - y1) * 0.1)  # Increased margin
        crop_box = (
            max(0, x1 - margin_x), 
            max(0, y1 - margin_y), 
            min(input_image.width, x2 + margin_x), 
            min(input_image.height, y2 + margin_y)
        )
        image_to_process = input_image.crop(crop_box)
        logger.info(f"Cropped to box: {crop_box}, resulting size: {image_to_process.size}")
    else:
        image_to_process = input_image
        logger.info("Using full image (no object detected or detection disabled)")
    logger.info(f"Cropping completed in {time.time() - crop_time:.2f}s")

    bg_time = time.time()
    # 4. Remove background using 'rembg' with session
    logger.info(f"Step 4/5: Removing background with model {selected_bg_model}...")
    try:
        with io.BytesIO() as buffer:
            image_to_process.save(buffer, format="PNG")
            buffer_data = buffer.getvalue()
            
            # Use the session if available, otherwise fall back to default
            if bg_session:
                item_with_transparent_bg_bytes = remove(buffer_data, session=bg_session)
            else:
                item_with_transparent_bg_bytes = remove(buffer_data, model_name=BG_REMOVAL_MODELS[selected_bg_model])
        
        item_with_transparent_bg = Image.open(io.BytesIO(item_with_transparent_bg_bytes))
        logger.info(f"Background removal completed in {time.time() - bg_time:.2f}s")
    except Exception as e:
        logger.error(f"Background removal failed with {selected_bg_model}: {e}")
        
        # Try fallback model if primary model fails
        if selected_bg_model != FALLBACK_BG_MODEL:
            logger.info(f"Trying fallback model: {FALLBACK_BG_MODEL}")
            try:
                fallback_session = bg_sessions.get(FALLBACK_BG_MODEL)
                with io.BytesIO() as buffer:
                    image_to_process.save(buffer, format="PNG")
                    buffer_data = buffer.getvalue()
                    
                    if fallback_session:
                        item_with_transparent_bg_bytes = remove(buffer_data, session=fallback_session)
                    else:
                        item_with_transparent_bg_bytes = remove(buffer_data, model_name=BG_REMOVAL_MODELS[FALLBACK_BG_MODEL])
                
                item_with_transparent_bg = Image.open(io.BytesIO(item_with_transparent_bg_bytes))
                logger.info(f"Fallback background removal completed in {time.time() - bg_time:.2f}s")
            except Exception as fallback_error:
                logger.error(f"Fallback background removal also failed: {fallback_error}")
                # Final fallback: use original image
                item_with_transparent_bg = image_to_process
                logger.info("Using original image as final fallback")
        else:
            # Already using fallback model, use original image
            item_with_transparent_bg = image_to_process
            logger.info("Using original image as fallback")

    # OPTIMIZED: Skip canvas standardization - smart crop handles final formatting
    output_time = time.time()
    logger.info("Step 5/5: Preparing optimized output (no canvas standardization)...")
    
    # Convert to bytes and return - let smart crop handle the final formatting
    with io.BytesIO() as final_buffer:
        # Save as PNG to preserve transparency
        item_with_transparent_bg.save(final_buffer, format="PNG")
        final_bytes = final_buffer.getvalue()
    
    logger.info(f"Output preparation completed in {time.time() - output_time:.2f}s")
    logger.info(f"OPTIMIZATION: Saved ~0.2s by skipping canvas standardization - smart crop will handle final formatting")
    
    total_time = time.time() - start_time
    logger.info(f"Total processing time: {total_time:.2f}s with model {selected_bg_model}")
    
    return final_bytes 