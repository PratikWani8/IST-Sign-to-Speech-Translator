import base64
import io
import re
from typing import Optional
from PIL import Image
import numpy as np
import cv2

def decode_base64_image(image_base64: str) -> Image.Image:
    """
    Decodes a base64 encoded string into a PIL Image.
    Supports data URI prefixes like 'data:image/jpeg;base64,...'.
    """
    if not image_base64 or not isinstance(image_base64, str):
        raise ValueError("Invalid image input: base64 string is required")
    
    # Strip potential data URL prefix
    header_pattern = r"^data:image\/[a-zA-Z]+;base64,"
    clean_base64 = re.sub(header_pattern, "", image_base64.strip())
    
    try:
        image_bytes = base64.b64decode(clean_base64)
    except Exception as e:
        raise ValueError(f"Failed to decode base64 data: {str(e)}")
        
    if len(image_bytes) == 0:
        raise ValueError("Decoded image data is empty")
        
    # Check max size (10 MB)
    if len(image_bytes) > 10 * 1024 * 1024:
        raise ValueError("Image size exceeds maximum allowed limit of 10MB")
        
    try:
        image = Image.open(io.BytesIO(image_bytes))
        # Convert RGBA, Grayscale, etc. to RGB
        if image.mode != "RGB":
            image = image.convert("RGB")
        return image
    except Exception as e:
        raise ValueError(f"Failed to open image file: {str(e)}")

def validate_image_dimensions(image: Image.Image, min_width: int = 48, min_height: int = 48) -> None:
    """
    Ensures image meets minimum spatial dimensions for valid sign inference.
    """
    width, height = image.size
    if width < min_width or height < min_height:
        raise ValueError(f"Image dimensions ({width}x{height}) are too small. Minimum required: {min_width}x{min_height}")

def center_crop_square(image: Image.Image) -> Image.Image:
    """
    Crops the maximum central square from an image.
    Helps remove side background from wide 4:3 or 16:9 camera frames.
    """
    width, height = image.size
    if width == height:
        return image
        
    min_dim = min(width, height)
    left = (width - min_dim) // 2
    top = (height - min_dim) // 2
    right = left + min_dim
    bottom = top + min_dim
    return image.crop((left, top, right, bottom))

def detect_and_crop_hand(image: Image.Image, padding: float = 0.20) -> Optional[Image.Image]:
    """
    Uses skin color segmentation in YCrCb color space to detect
    and extract a tight square crop around the primary hand region.
    Returns None if no distinct skin region is identified.
    """
    np_img = np.array(image)
    if np_img.ndim != 3 or np_img.shape[2] != 3:
        return None
        
    h, w = np_img.shape[:2]
    total_area = h * w
    
    # Convert RGB to YCrCb for illumination-invariant human skin detection
    ycrcb = cv2.cvtColor(np_img, cv2.COLOR_RGB2YCrCb)
    lower_skin = np.array([0, 133, 77], dtype=np.uint8)
    upper_skin = np.array([255, 173, 127], dtype=np.uint8)
    mask = cv2.inRange(ycrcb, lower_skin, upper_skin)
    
    # Morphological filtering to eliminate salt-and-pepper noise and connect fingers
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
    mask = cv2.morphologyEx(mask, cv2.MORPH_DILATE, kernel, iterations=1)
    
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None
        
    # Find largest contour
    valid_contours = [c for c in contours if cv2.contourArea(c) >= (0.015 * total_area)]
    if not valid_contours:
        return None
        
    best_contour = max(valid_contours, key=cv2.contourArea)
    x, y, bw, bh = cv2.boundingRect(best_contour)
    
    # If the contour already spans > 90% of both dimensions, it's already tightly cropped
    if bw >= 0.88 * w and bh >= 0.88 * h:
        return None
        
    # Construct a padded square bounding box around the detected hand
    side = max(bw, bh)
    pad = int(side * padding)
    side_padded = side + (2 * pad)
    
    cx, cy = x + bw // 2, y + bh // 2
    x1 = max(0, cx - side_padded // 2)
    y1 = max(0, cy - side_padded // 2)
    x2 = min(w, x1 + side_padded)
    y2 = min(h, y1 + side_padded)
    
    # Ensure minimum crop size of 64x64
    if (x2 - x1) < 64 or (y2 - y1) < 64:
        return None
        
    cropped_np = np_img[y1:y2, x1:x2]
    return Image.fromarray(cropped_np)

