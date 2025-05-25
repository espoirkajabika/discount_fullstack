#!/usr/bin/env python3
"""
Test business endpoints functionality
"""
import asyncio
import sys
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8001/api/v1"
TEST_EMAIL = "business@test.com"
TEST_PASSWORD = "testpassword123"

class BusinessAPITester:
    def __init__(self):
        self.access_token = None
        self.business_id = None
        self.product_id = None
        self.offer_id = None
        self.category_id = None

    def headers(self):
        return {"Authorization": f"Bearer {self.access_token}"} if self.access_token else {}

    def test_user_registration(self):
        """Test user registration"""
        print("🧪 Testing User Registration...")
        
        data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "first_name": "Business",
            "last_name": "Owner"
        }
        
        response = requests.post(f"{BASE_URL}/auth/register", json=data)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 201:
            result = response.json()
            self.access_token = result["access_token"]
            print("✅ User registration successful")
            return True
        else:
            print(f"❌ Registration failed: {response.text}")
            return False

    def test_user_login(self):
        """Test user login"""
        print("\n🔐 Testing User Login...")
        
        data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        response = requests.post(f"{BASE_URL}/auth/login", json=data)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            self.access_token = result["access_token"]
            print("✅ Login successful")
            return True
        else:
            print(f"❌ Login failed: {response.text}")
            return False

    def test_list_categories(self):
        """Test listing categories"""
        print("\n📁 Testing List Categories...")
        
        response = requests.get(f"{BASE_URL}/categories")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            categories = response.json()
            print(f"✅ Found {len(categories)} categories")
            if categories:
                self.category_id = categories[0]["id"]
                print(f"   Using category: {categories[0]['name']}")
            return True
        else:
            print(f"❌ Failed to list categories: {response.text}")
            return False

    def test_business_registration(self):
        """Test business registration"""
        print("\n🏢 Testing Business Registration...")
        
        data = {
            "business_name": "Test Pizza Shop",
            "business_description": "The best pizza in town!",
            "business_address": "123 Main St, Winnipeg, MB",
            "phone_number": "1234567890",
            "business_website": "https://testpizza.com",
            "category_id": self.category_id if self.category_id else None
        }
        
        response = requests.post(f"{BASE_URL}/business/register", json=data, headers=self.headers())
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            self.business_id = result["id"]
            print("✅ Business registration successful")
            print(f"   Business ID: {self.business_id}")
            return True
        else:
            print(f"❌ Business registration failed: {response.text}")
            return False

    def test_get_my_business(self):
        """Test getting business info"""
        print("\n📊 Testing Get My Business...")
        
        response = requests.get(f"{BASE_URL}/business/me", headers=self.headers())
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Business info retrieved successfully")
            print(f"   Business: {result['business_name']}")
            return True
        else:
            print(f"❌ Failed to get business info: {response.text}")
            return False

    def test_create_product(self):
        """Test creating a product"""
        print("\n🍕 Testing Create Product...")
        
        data = {
            "name": "Margherita Pizza",
            "description": "Classic pizza with tomato, mozzarella, and basil",
            "price": 15.99,
            "category_id": self.category_id if self.category_id else None
        }
        
        response = requests.post(f"{BASE_URL}/business/products", json=data, headers=self.headers())
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            self.product_id = result["id"]
            print("✅ Product creation successful")
            print(f"   Product ID: {self.product_id}")
            print(f"   Product: {result['name']} - ${result['price']}")
            return True
        else:
            print(f"❌ Product creation failed: {response.text}")
            return False

    def test_list_my_products(self):
        """Test listing business products"""
        print("\n📦 Testing List My Products...")
        
        response = requests.get(f"{BASE_URL}/business/products", headers=self.headers())
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Products listed successfully")
            print(f"   Total products: {result['total']}")
            for product in result['products']:
                print(f"   - {product['name']}: ${product['price']}")
            return True
        else:
            print(f"❌ Failed to list products: {response.text}")
            return False

    def test_create_offer(self):
        """Test creating an offer"""
        print("\n🎯 Testing Create Offer...")
        
        start_date = datetime.utcnow()
        expiry_date = start_date + timedelta(days=7)
        
        data = {
            "title": "20% Off Margherita Pizza",
            "description": "Get 20% off our delicious Margherita Pizza this week!",
            "discount_type": "percentage",
            "discount_value": 20.00,
            "original_price": 15.99,
            "discounted_price": 12.79,
            "start_date": start_date.isoformat(),
            "expiry_date": expiry_date.isoformat(),
            "max_claims": 50,
            "terms_conditions": "Valid for dine-in and takeout only",
            "product_id": self.product_id if self.product_id else None
        }
        
        response = requests.post(f"{BASE_URL}/business/offers", json=data, headers=self.headers())
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            self.offer_id = result["id"]
            print("✅ Offer creation successful")
            print(f"   Offer ID: {self.offer_id}")
            print(f"   Offer: {result['title']}")
            print(f"   Discount: {result['discount_value']}% off")
            return True
        else:
            print(f"❌ Offer creation failed: {response.text}")
            return False

    def test_list_my_offers(self):
        """Test listing business offers"""
        print("\n🏷️  Testing List My Offers...")
        
        response = requests.get(f"{BASE_URL}/business/offers", headers=self.headers())
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Offers listed successfully")
            print(f"   Total offers: {result['total']}")
            for offer in result['offers']:
                print(f"   - {offer['title']}: {offer['discount_value']}% off")
            return True
        else:
            print(f"❌ Failed to list offers: {response.text}")
            return False

    def test_public_endpoints(self):
        """Test public endpoints"""
        print("\n🌐 Testing Public Endpoints...")
        
        # Test public businesses list
        response = requests.get(f"{BASE_URL}/business/")
        print(f"Public businesses status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Found {result['total']} public businesses")
        
        # Test public products list
        response = requests.get(f"{BASE_URL}/business/public/products")
        print(f"Public products status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Found {result['total']} public products")
        
        # Test public offers list
        response = requests.get(f"{BASE_URL}/business/public/offers")
        print(f"Public offers status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Found {result['total']} public offers")
        
        return True

    def cleanup(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        try:
            # Delete offer
            if self.offer_id:
                response = requests.delete(f"{BASE_URL}/business/offers/{self.offer_id}", headers=self.headers())
                print(f"Delete offer status: {response.status_code}")
            
            # Delete product
            if self.product_id:
                response = requests.delete(f"{BASE_URL}/business/products/{self.product_id}", headers=self.headers())
                print(f"Delete product status: {response.status_code}")
            
            # Note: Business and user cleanup would require additional endpoints
            print("✅ Cleanup completed")
            
        except Exception as e:
            print(f"⚠️  Cleanup warning: {e}")

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Business API Tests...\n")
        
        try:
            # Authentication flow
            if not (self.test_user_registration() or self.test_user_login()):
                print("❌ Authentication failed, stopping tests")
                return
            
            # Core business flow
            tests = [
                self.test_list_categories,
                self.test_business_registration,
                self.test_get_my_business,
                self.test_create_product,
                self.test_list_my_products,
                self.test_create_offer,
                self.test_list_my_offers,
                self.test_public_endpoints
            ]
            
            passed = 0
            for test in tests:
                try:
                    if test():
                        passed += 1
                except Exception as e:
                    print(f"❌ Test failed with exception: {e}")
            
            print(f"\n📊 Test Results: {passed}/{len(tests)} tests passed")
            
            # Cleanup
            self.cleanup()
            
        except KeyboardInterrupt:
            print("\n⚠️  Tests interrupted by user")
            self.cleanup()
        except Exception as e:
            print(f"\n❌ Unexpected error: {e}")
            self.cleanup()


async def main():
    """Main test runner"""
    print("🧪 Business API Test Suite")
    print("=" * 50)
    
    tester = BusinessAPITester()
    tester.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())