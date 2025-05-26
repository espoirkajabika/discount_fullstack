# app/utils/image_utils.py
"""
Image processing utilities for file uploads
"""
from PIL import Image
import io
from typing import Tuple, Dict, Any

def compress_image(
    image_data: bytes, 
    max_size_bytes: int = 1024*1024, 
    quality: int = 85,
    max_dimension: int = 1920
) -> Tuple[bytes, Dict[str, Any]]:
    """
    Compress an image to fit within size limits
    
    Args:
        image_data: Original image bytes
        max_size_bytes: Maximum size in bytes (default 1MB)
        quality: JPEG quality (1-100, default 85)
        max_dimension: Maximum width/height in pixels
    
    Returns:
        Tuple of (compressed_image_bytes, compression_info)
    """
    try:
        # Get original info
        original_size = len(image_data)
        img = Image.open(io.BytesIO(image_data))
        original_dimensions = img.size
        original_format = img.format
        
        # Convert to RGB if necessary (for JPEG compatibility)
        if img.mode in ['RGBA', 'P']:
            # Create white background for transparent images
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'RGBA':
                background.paste(img, mask=img.split()[-1])  # Use alpha channel as mask
            else:
                background.paste(img)
            img = background
        
        # Progressive resize and compression
        current_quality = quality
        current_max_dimension = max_dimension
        attempts = 0
        max_attempts = 10
        
        while current_quality > 20 and attempts < max_attempts:
            attempts += 1
            
            # Resize if needed
            if img.width > current_max_dimension or img.height > current_max_dimension:
                img.thumbnail((current_max_dimension, current_max_dimension), Image.Resampling.LANCZOS)
            
            # Compress to JPEG
            output = io.BytesIO()
            img.save(output, format='JPEG', quality=current_quality, optimize=True)
            compressed_data = output.getvalue()
            
            # Check if it fits
            if len(compressed_data) <= max_size_bytes:
                compression_info = {
                    "original_size": original_size,
                    "compressed_size": len(compressed_data),
                    "original_dimensions": original_dimensions,
                    "final_dimensions": img.size,
                    "original_format": original_format,
                    "final_format": "JPEG",
                    "quality_used": current_quality,
                    "compression_ratio": (1 - len(compressed_data)/original_size) * 100 if original_size > 0 else 0,
                    "attempts": attempts
                }
                return compressed_data, compression_info
            
            # If still too large, reduce quality and/or size
            current_quality -= 10
            current_max_dimension = int(current_max_dimension * 0.8)  # Reduce dimensions by 20%
            
            # Reload image for next iteration if we changed dimensions significantly
            if current_max_dimension < max_dimension * 0.7:
                img = Image.open(io.BytesIO(image_data))
                if img.mode in ['RGBA', 'P']:
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'RGBA':
                        background.paste(img, mask=img.split()[-1])
                    else:
                        background.paste(img)
                    img = background
        
        # If we get here, return the last attempt even if it's still too large
        compression_info = {
            "original_size": original_size,
            "compressed_size": len(compressed_data),
            "original_dimensions": original_dimensions,
            "final_dimensions": img.size,
            "original_format": original_format,
            "final_format": "JPEG",
            "quality_used": current_quality,
            "compression_ratio": (1 - len(compressed_data)/original_size) * 100 if original_size > 0 else 0,
            "attempts": attempts,
            "warning": "Could not compress to target size"
        }
        return compressed_data, compression_info
        
    except Exception as e:
        # Return original data if compression fails
        error_info = {
            "original_size": len(image_data),
            "compressed_size": len(image_data),
            "error": str(e),
            "compression_ratio": 0
        }
        return image_data, error_info

def get_image_info(image_data: bytes) -> Dict[str, Any]:
    """
    Get detailed information about an image
    
    Args:
        image_data: Image bytes
        
    Returns:
        Dictionary with image information
    """
    try:
        img = Image.open(io.BytesIO(image_data))
        return {
            "format": img.format,
            "mode": img.mode,
            "size": img.size,
            "width": img.width,
            "height": img.height,
            "bytes": len(image_data),
            "megapixels": round((img.width * img.height) / 1000000, 2),
            "aspect_ratio": round(img.width / img.height, 2) if img.height > 0 else 0,
            "has_transparency": img.mode in ['RGBA', 'LA'] or (img.mode == 'P' and 'transparency' in img.info)
        }
    except Exception as e:
        return {
            "error": str(e),
            "bytes": len(image_data)
        }

def validate_image_file(image_data: bytes, allowed_types: list = None) -> Tuple[bool, str]:
    """
    Validate if the data is a valid image file
    
    Args:
        image_data: Image bytes to validate
        allowed_types: List of allowed formats (default: ['JPEG', 'PNG', 'GIF', 'WEBP'])
        
    Returns:
        Tuple of (is_valid, message)
    """
    if allowed_types is None:
        allowed_types = ['JPEG', 'PNG', 'GIF', 'WEBP']
    
    try:
        img = Image.open(io.BytesIO(image_data))
        
        # Check format
        if img.format not in allowed_types:
            return False, f"Format {img.format} not allowed. Allowed: {', '.join(allowed_types)}"
        
        # Check if image is corrupted by trying to load it
        img.load()
        
        # Check reasonable dimensions
        if img.width < 1 or img.height < 1:
            return False, "Image dimensions too small"
        
        if img.width > 10000 or img.height > 10000:
            return False, "Image dimensions too large (max 10000x10000)"
        
        return True, "Valid image"
        
    except Exception as e:
        return False, f"Invalid image: {str(e)}"

def create_thumbnail(image_data: bytes, size: Tuple[int, int] = (300, 300)) -> bytes:
    """
    Create a thumbnail of the image
    
    Args:
        image_data: Original image bytes
        size: Thumbnail size (width, height)
        
    Returns:
        Thumbnail image bytes
    """
    try:
        img = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if img.mode in ['RGBA', 'P']:
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'RGBA':
                background.paste(img, mask=img.split()[-1])
            else:
                background.paste(img)
            img = background
        
        # Create thumbnail
        img.thumbnail(size, Image.Resampling.LANCZOS)
        
        # Save as JPEG
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=85, optimize=True)
        return output.getvalue()
        
    except Exception as e:
        print(f"Thumbnail creation failed: {e}")
        return image_data  # Return original if thumbnail creation fails