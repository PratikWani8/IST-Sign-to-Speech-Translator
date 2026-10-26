import base64
import io
import re
from PIL import Image
import numpy as np

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

def validate_image_dimensions(image: Image.Image, min_width: int = 64, min_height: int = 64) -> None:
    """
    Ensures image meets minimum spatial dimensions for valid sign inference.
    """
    width, height = image.size
    if width < min_width or height < min_height:
        raise ValueError(f"Image dimensions ({width}x{height}) are too small. Minimum required: {min_width}x{min_height}")
