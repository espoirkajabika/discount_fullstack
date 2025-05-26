#!/usr/bin/env python3
"""
Updated verification script with proper file size
"""
import os
import requests
import jwt
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

def test_small_upload():
    """Test upload with a very small file"""
    
    supabase_url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    print("📤 Testing Upload with Tiny File...")
    
    try:
        # Create a very small test file (just a few bytes)
        test_content = b"tiny"  # Only 4 bytes
        test_filename = f"test-tiny-{datetime.now().strftime('%Y%m%d-%H%M%S')}.txt"
        
        upload_url = f"{supabase_url}/storage/v1/object/product-images/{test_filename}"
        
        headers = {
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "text/plain",
            "Content-Length": str(len(test_content))
        }
        
        print(f"Upload URL: {upload_url}")
        print(f"File size: {len(test_content)} bytes")
        
        response = requests.post(upload_url, data=test_content, headers=headers)
        
        print(f"Upload response: {response.status_code}")
        print(f"Response text: {response.text}")
        
        if response.status_code in [200, 201]:
            print("✅ Tiny file upload successful!")
            
            # Test public URL
            public_url = f"{supabase_url}/storage/v1/object/public/product-images/{test_filename}"
            verify_response = requests.get(public_url)
            print(f"✅ Public URL accessible: {verify_response.status_code}")
            
            # Clean up
            delete_response = requests.delete(upload_url, headers={
                "Authorization": f"Bearer {service_key}"
            })
            print(f"✅ Cleanup: {delete_response.status_code}")
            
            return True
        else:
            print(f"❌ Upload failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Upload test failed: {e}")
        return False

def test_image_upload():
    """Test with a small actual image"""
    
    supabase_url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    print("\n🖼️ Testing with Small Image...")
    
    try:
        # Create a tiny PNG image (1x1 pixel)
        import base64
        
        # This is a 1x1 pixel transparent PNG (67 bytes)
        tiny_png_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        image_content = base64.b64decode(tiny_png_base64)
        
        test_filename = f"test-image-{datetime.now().strftime('%Y%m%d-%H%M%S')}.png"
        upload_url = f"{supabase_url}/storage/v1/object/product-images/{test_filename}"
        
        headers = {
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "image/png",
            "Content-Length": str(len(image_content))
        }
        
        print(f"Image size: {len(image_content)} bytes")
        
        response = requests.post(upload_url, data=image_content, headers=headers)
        
        print(f"Image upload response: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code in [200, 201]:
            print("✅ Image upload successful!")
            
            # Clean up
            requests.delete(upload_url, headers={
                "Authorization": f"Bearer {service_key}"
            })
            
            return True
        else:
            print(f"❌ Image upload failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Image upload test failed: {e}")
        return False

def check_bucket_size_limits():
    """Check bucket configuration for size limits"""
    
    supabase_url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    print("\n📦 Checking Bucket Configuration...")
    
    try:
        response = requests.get(f"{supabase_url}/storage/v1/bucket/product-images", headers={
            "Authorization": f"Bearer {service_key}"
        })
        
        if response.status_code == 200:
            bucket_info = response.json()
            print(f"Bucket info: {bucket_info}")
            
            file_size_limit = bucket_info.get('file_size_limit')
            if file_size_limit:
                print(f"📏 File size limit: {file_size_limit / (1024*1024):.1f}MB")
            else:
                print("📏 No explicit file size limit found")
                
        else:
            print(f"Could not get bucket info: {response.status_code}")
            
    except Exception as e:
        print(f"Bucket check failed: {e}")

if __name__ == "__main__":
    print("🔧 Updated Supabase Upload Test")
    print("=" * 50)
    
    # Test with tiny files first
    success1 = test_small_upload()
    success2 = test_image_upload()
    
    check_bucket_size_limits()
    
    print("\n" + "=" * 50)
    if success1 and success2:
        print("✅ Upload tests PASSED! Your configuration works with small files.")
        print("\n💡 Recommendation: Limit uploads to < 1MB and compress images")
    else:
        print("❌ Upload tests failed even with tiny files.")
        print("Check your bucket permissions and RLS policies.")