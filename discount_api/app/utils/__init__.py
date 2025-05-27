# app/utils/__init__.py
"""
Utility modules for the discount API
"""

try:
    from .image_utils import (
        compress_image,
        get_image_info,
        validate_image_file,
        create_thumbnail
    )
    
    __all__ = [
        'compress_image',
        'get_image_info', 
        'validate_image_file',
        'create_thumbnail'
    ]
except ImportError as e:
    print(f"Warning: Image utilities not available: {e}")
    # Create dummy functions if PIL is not available
    def compress_image(image_data, **kwargs):
        return image_data, {"message": "Image compression not available"}
    
    def get_image_info(image_data):
        return {"bytes": len(image_data), "message": "Image info not available"}
    
    def validate_image_file(image_data, allowed_types=None):
        return True, "Image validation not available"
    
    def create_thumbnail(image_data, size=(300, 300)):
        return image_data
    
    __all__ = [
        'compress_image',
        'get_image_info', 
        'validate_image_file',
        'create_thumbnail'
    ]