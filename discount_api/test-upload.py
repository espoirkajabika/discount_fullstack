#!/usr/bin/env python3
"""
Test image upload functionality
"""
import requests
import io
from PIL import Image

# Configuration
BASE_URL = "http://localhost:8001/api/v1"
BUSINESS_EMAIL = "oyedeji.smt@gmail.com"
BUSINESS_PASSWORD = "asdf1234"

def create_test_image():
    """Create a simple test image"""
    # Create a simple 200x200 red square image
    img = Image.new('RGB', (200, 200), color='red')
    
    # Add some text
    try:
        from PIL import ImageDraw, ImageFont
        draw = ImageDraw.Draw(img)
        draw.text((50, 90), "TEST IMAGE", fill='white')
    except:
        pass  # Skip text if font not available
    
    # Convert to bytes
    img_buffer = io.BytesIO()
    img.save(img_buffer, format='PNG')
    img_buffer.seek(0)
    
    return img_buffer.getvalue()

def test_image_upload():
    """Test the complete image upload flow"""
    print("🧪 Testing Image Upload...")
    
    # Step 1: Login as business user
    print("\n1. Logging in as business user...")
    login_data = {
        "email": BUSINESS_EMAIL,
        "password": BUSINESS_PASSWORD
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"❌ Login failed: {response.text}")
        return False
    
    access_token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    print("✅ Login successful")
    
    # Step 2: Create test image
    print("\n2. Creating test image...")
    image_data = create_test_image()
    print(f"✅ Created test image ({len(image_data)} bytes)")
    
    # Step 3: Upload image
    print("\n3. Uploading image...")
    files = {
        'image': ('test_image.png', image_data, 'image/png')
    }
    
    response = requests.post(
        f"{BASE_URL}/business/products/upload-image",
        files=files,
        headers=headers
    )
    
    print(f"Upload status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Image upload successful!")
        print(f"   Storage path: {result['path']}")
        print(f"   Public URL: {result['url']}")
        
        # Step 4: Verify image is accessible
        print("\n4. Verifying image accessibility...")
        img_response = requests.get(result['url'])
        if img_response.status_code == 200:
            print("✅ Image is publicly accessible")
            print(f"   Image size: {len(img_response.content)} bytes")
        else:
            print(f"❌ Image not accessible: {img_response.status_code}")
        
        return True
    else:
        print(f"❌ Upload failed: {response.text}")
        return False

def test_image_upload_validation():
    """Test upload validation (file size, type, etc.)"""
    print("\n🔍 Testing Upload Validation...")
    
    # Login first
    login_data = {"email": BUSINESS_EMAIL, "password": BUSINESS_PASSWORD}
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        print("❌ Login required for validation tests")
        return False
    
    headers = {"Authorization": f"Bearer {response.json()['access_token']}"}
    
    # Test 1: Invalid file type
    print("\nTesting invalid file type...")
    files = {'image': ('test.txt', b'This is not an image', 'text/plain')}
    response = requests.post(f"{BASE_URL}/business/products/upload-image", files=files, headers=headers)
    
    if response.status_code == 400 and "Invalid file type" in response.text:
        print("✅ Invalid file type correctly rejected")
    else:
        print(f"❌ File type validation failed: {response.status_code} - {response.text}")
    
    # Test 2: File too large (simulate with a large buffer)
    print("\nTesting file size limit...")
    large_data = b'0' * (6 * 1024 * 1024)  # 6MB
    files = {'image': ('large.png', large_data, 'image/png')}
    response = requests.post(f"{BASE_URL}/business/products/upload-image", files=files, headers=headers)
    
    if response.status_code == 400 and "too large" in response.text:
        print("✅ Large file correctly rejected")
    else:
        print(f"❌ File size validation failed: {response.status_code} - {response.text}")
    
    return True

if __name__ == "__main__":
    print("🧪 Image Upload Test Suite")
    print("=" * 50)
    
    # Run tests
    success = test_image_upload()
    if success:
        test_image_upload_validation()
    
    print("\n" + "=" * 50)
    print("✅ Testing complete!" if success else "❌ Tests failed!")