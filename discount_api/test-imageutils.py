#!/usr/bin/env python3
"""
Test the image utilities
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.utils.image_utils import compress_image, get_image_info, validate_image_file, create_thumbnail
from PIL import Image
import io

def create_test_images():
    """Create test images of different sizes"""
    test_images = {}
    
    # Small image (100x100)
    small_img = Image.new('RGB', (100, 100), color='red')
    small_buffer = io.BytesIO()
    small_img.save(small_buffer, format='PNG')
    test_images['small_png'] = small_buffer.getvalue()
    
    # Medium image (800x600)
    medium_img = Image.new('RGB', (800, 600), color='green')
    medium_buffer = io.BytesIO()
    medium_img.save(medium_buffer, format='JPEG', quality=95)
    test_images['medium_jpeg'] = medium_buffer.getvalue()
    
    # Large image (2000x1500)
    large_img = Image.new('RGB', (2000, 1500), color='blue')
    large_buffer = io.BytesIO()
    large_img.save(large_buffer, format='PNG')
    test_images['large_png'] = large_buffer.getvalue()
    
    # RGBA image with transparency
    rgba_img = Image.new('RGBA', (500, 500), color=(255, 0, 0, 128))
    rgba_buffer = io.BytesIO()
    rgba_img.save(rgba_buffer, format='PNG')
    test_images['rgba_png'] = rgba_buffer.getvalue()
    
    return test_images

def test_image_info():
    """Test get_image_info function"""
    print("🔍 Testing get_image_info...")
    
    test_images = create_test_images()
    
    for name, image_data in test_images.items():
        info = get_image_info(image_data)
        print(f"  {name}: {info}")
    
    print("✅ Image info test completed")

def test_validation():
    """Test validate_image_file function"""
    print("\n✅ Testing validate_image_file...")
    
    test_images = create_test_images()
    
    for name, image_data in test_images.items():
        is_valid, message = validate_image_file(image_data)
        print(f"  {name}: {'✅' if is_valid else '❌'} {message}")
    
    # Test invalid data
    invalid_data = b"This is not an image"
    is_valid, message = validate_image_file(invalid_data)
    print(f"  invalid_data: {'✅' if is_valid else '❌'} {message}")
    
    print("✅ Validation test completed")

def test_compression():
    """Test compress_image function"""
    print("\n🗜️ Testing compress_image...")
    
    test_images = create_test_images()
    
    # Test compression with different size limits
    size_limits = [50*1024, 100*1024, 500*1024]  # 50KB, 100KB, 500KB
    
    for limit in size_limits:
        print(f"\n  Testing with {limit//1024}KB limit:")
        
        for name, image_data in test_images.items():
            if len(image_data) > limit:  # Only test compression if needed
                compressed_data, info = compress_image(image_data, max_size_bytes=limit)
                print(f"    {name}: {info['original_size']//1024}KB → {info['compressed_size']//1024}KB "
                      f"({info['compression_ratio']:.1f}% reduction)")
                
                # Verify compressed image is valid
                is_valid, _ = validate_image_file(compressed_data)
                print(f"      Compressed image valid: {'✅' if is_valid else '❌'}")
    
    print("✅ Compression test completed")

def test_thumbnail():
    """Test create_thumbnail function"""
    print("\n🖼️ Testing create_thumbnail...")
    
    test_images = create_test_images()
    
    for name, image_data in test_images.items():
        original_info = get_image_info(image_data)
        thumbnail_data = create_thumbnail(image_data, size=(150, 150))
        thumbnail_info = get_image_info(thumbnail_data)
        
        print(f"  {name}: {original_info['size']} → {thumbnail_info['size']} "
              f"({original_info['bytes']//1024}KB → {thumbnail_info['bytes']//1024}KB)")
    
    print("✅ Thumbnail test completed")

def test_real_world_scenario():
    """Test a realistic upload scenario"""
    print("\n🌍 Testing real-world scenario...")
    
    # Create a large, high-quality image (similar to what users might upload)
    large_img = Image.new('RGB', (4000, 3000), color=(100, 150, 200))
    
    # Add some patterns to make it more realistic
    from PIL import ImageDraw
    draw = ImageDraw.Draw(large_img)
    for i in range(0, 4000, 100):
        draw.line([(i, 0), (i, 3000)], fill=(255, 255, 255), width=2)
    for i in range(0, 3000, 100):
        draw.line([(0, i), (4000, i)], fill=(255, 255, 255), width=2)
    
    # Save as high-quality JPEG
    buffer = io.BytesIO()
    large_img.save(buffer, format='JPEG', quality=95)
    original_data = buffer.getvalue()
    
    print(f"  Original image: {len(original_data)//1024}KB")
    
    # Compress for different scenarios
    scenarios = [
        ("Mobile upload", 1024*1024),      # 1MB
        ("Web upload", 2*1024*1024),       # 2MB  
        ("High quality", 5*1024*1024),     # 5MB
    ]
    
    for scenario_name, size_limit in scenarios:
        compressed_data, info = compress_image(original_data, max_size_bytes=size_limit)
        print(f"  {scenario_name}: {info['compressed_size']//1024}KB "
              f"({info['compression_ratio']:.1f}% reduction, quality: {info['quality_used']})")
    
    print("✅ Real-world scenario test completed")

if __name__ == "__main__":
    print("🧪 Image Utils Test Suite")
    print("=" * 50)
    
    try:
        test_image_info()
        test_validation()
        test_compression()
        test_thumbnail()
        test_real_world_scenario()
        
        print("\n" + "=" * 50)
        print("✅ All tests completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()