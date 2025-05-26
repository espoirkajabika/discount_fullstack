#!/usr/bin/env python3
"""
Test customer endpoints functionality
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
CUSTOMER_EMAIL = "suraj@gmail.com"
CUSTOMER_PASSWORD = "testpassword123"

class CustomerAPITester:
    def __init__(self):
        self.access_token = None
        self.saved_offer_id = None
        self.claimed_offer_id = None

    def headers(self):
        return {"Authorization": f"Bearer {self.access_token}"} if self.access_token else {}

    def test_customer_registration(self):
        """Test customer registration"""
        print("🧪 Testing Customer Registration...")
        
        data = {
            "email": CUSTOMER_EMAIL,
            "password": CUSTOMER_PASSWORD,
            "first_name": "Sanjay",
            "last_name": "Suraj"
        }
        
        response = requests.post(f"{BASE_URL}/auth/register", json=data)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 201:
            result = response.json()
            self.access_token = result["access_token"]
            print("✅ Customer registration successful")
            return True
        else:
            print(f"❌ Registration failed: {response.text}")
            return False

    def test_customer_login(self):
        """Test customer login"""
        print("\n🔐 Testing Customer Login...")
        
        data = {
            "email": CUSTOMER_EMAIL,
            "password": CUSTOMER_PASSWORD
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

    def test_search_products(self):
        """Test product search"""
        print("\n🔍 Testing Product Search...")
        
        # Test basic search
        response = requests.get(f"{BASE_URL}/customer/search/products")
        print(f"Basic search status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Found {result['total']} products")
        
        # Test search with query
        response = requests.get(f"{BASE_URL}/customer/search/products?q=pizza")
        print(f"Search with query status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Found {result['total']} products matching 'pizza'")
        
        # Test search with filters
        response = requests.get(f"{BASE_URL}/customer/search/products?min_price=10&max_price=20&sort_by=price&sort_order=asc")
        print(f"Search with filters status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Found {result['total']} products with price filters")
            for product in result['products'][:3]:
                print(f"   - {product['name']}: ${product['price']}")
        
        return True

    def test_search_offers(self):
        """Test offer search"""
        print("\n🎯 Testing Offer Search...")
        
        # Test basic search
        response = requests.get(f"{BASE_URL}/customer/search/offers")
        print(f"Basic search status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Found {result['total']} offers")
            if result['offers']:
                self.saved_offer_id = result['offers'][0]['id']
                self.claimed_offer_id = result['offers'][0]['id'] if len(result['offers']) > 0 else None
        
        # Test search with query
        response = requests.get(f"{BASE_URL}/customer/search/offers?q=pizza")
        print(f"Search with query status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Found {result['total']} offers matching 'pizza'")
        
        # Test search with filters
        response = requests.get(f"{BASE_URL}/customer/search/offers?discount_type=percentage&min_discount=15&sort_by=discount_value&sort_order=desc")
        print(f"Search with filters status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Found {result['total']} percentage offers >= 15%")
            for offer in result['offers'][:3]:
                print(f"   - {offer['title']}: {offer['discount_value']}% off")
        
        return True

    def test_trending_offers(self):
        """Test trending offers"""
        print("\n📈 Testing Trending Offers...")
        
        response = requests.get(f"{BASE_URL}/customer/offers/trending?limit=5")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Found {result['total']} trending offers")
            for offer in result['offers']:
                print(f"   - {offer['title']}: {offer['current_claims']} claims")
            return True
        else:
            print(f"❌ Failed: {response.text}")
            return False

    def test_expiring_offers(self):
        """Test expiring offers"""
        print("\n⏰ Testing Expiring Offers...")
        
        response = requests.get(f"{BASE_URL}/customer/offers/expiring-soon?hours=48&limit=5")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Found {result['total']} offers expiring in 48 hours")
            for offer in result['offers']:
                expiry = datetime.fromisoformat(offer['expiry_date'].replace('Z', '+00:00'))
                hours_left = (expiry - datetime.now(expiry.tzinfo)).total_seconds() / 3600
                print(f"   - {offer['title']}: {hours_left:.1f} hours left")
            return True
        else:
            print(f"❌ Failed: {response.text}")
            return False

    def test_save_offer(self):
        """Test saving an offer"""
        print("\n💾 Testing Save Offer...")
        
        if not self.saved_offer_id:
            print("⚠️  No offer ID available for testing")
            return False
        
        response = requests.post(f"{BASE_URL}/customer/offers/{self.saved_offer_id}/save", headers=self.headers())
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Offer saved successfully")
            print(f"   Saved: {result['offers']['title']}")
            return True
        elif response.status_code == 400 and "already saved" in response.text:
            print("✅ Offer already saved (expected on retry)")
            return True
        else:
            print(f"❌ Failed to save offer: {response.text}")
            return False

    def test_get_saved_offers(self):
        """Test getting saved offers"""
        print("\n📋 Testing Get Saved Offers...")
        
        response = requests.get(f"{BASE_URL}/customer/saved-offers", headers=self.headers())
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Found {result['total']} saved offers")
            for saved_offer in result['saved_offers'][:3]:
                print(f"   - {saved_offer['offers']['title']}")
            return True
        else:
            print(f"❌ Failed: {response.text}")
            return False

    def test_claim_offer(self):
        """Test claiming an offer"""
        print("\n🎁 Testing Claim Offer...")
        
        if not self.claimed_offer_id:
            print("⚠️  No offer ID available for testing")
            return False
        
        response = requests.post(f"{BASE_URL}/customer/offers/{self.claimed_offer_id}/claim", headers=self.headers())
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Offer claimed successfully")
            print(f"   Claimed: {result['offers']['title']}")
            print(f"   Claimed at: {result['claimed_at']}")
            return True
        elif response.status_code == 400 and "already claimed" in response.text:
            print("✅ Offer already claimed (expected on retry)")
            return True
        else:
            print(f"❌ Failed to claim offer: {response.text}")
            return False

    def test_get_claimed_offers(self):
        """Test getting claimed offers"""
        print("\n🎫 Testing Get Claimed Offers...")
        
        response = requests.get(f"{BASE_URL}/customer/claimed-offers", headers=self.headers())
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Found {result['total']} claimed offers")
            for claimed_offer in result['claimed_offers'][:3]:
                print(f"   - {claimed_offer['offers']['title']} (Redeemed: {claimed_offer['is_redeemed']})")
            return True
        else:
            print(f"❌ Failed: {response.text}")
            return False

    def test_offer_status(self):
        """Test getting offer status"""
        print("\n📊 Testing Offer Status...")
        
        if not self.saved_offer_id:
            print("⚠️  No offer ID available for testing")
            return False
        
        # Test authenticated status
        response = requests.get(f"{BASE_URL}/customer/offers/{self.saved_offer_id}/status", headers=self.headers())
        print(f"Authenticated status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Offer status retrieved")
            print(f"   Available: {result['is_available']}")
            print(f"   Saved: {result['is_saved']}")
            print(f"   Claimed: {result['is_claimed']}")
            print(f"   Can claim: {result['can_claim']}")
            if result['reason']:
                print(f"   Reason: {result['reason']}")
        
        # Test anonymous status
        response = requests.get(f"{BASE_URL}/customer/offers/{self.saved_offer_id}/status")
        print(f"Anonymous status: {response.status_code}")
        
        return True

    def test_unsave_offer(self):
        """Test unsaving an offer"""
        print("\n🗑️  Testing Unsave Offer...")
        
        if not self.saved_offer_id:
            print("⚠️  No offer ID available for testing")
            return False
        
        response = requests.delete(f"{BASE_URL}/customer/offers/{self.saved_offer_id}/save", headers=self.headers())
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Offer unsaved successfully")
            print(f"   Message: {result['message']}")
            return True
        elif response.status_code == 404:
            print("✅ Offer not found in saved list (expected if not saved)")
            return True
        else:
            print(f"❌ Failed to unsave offer: {response.text}")
            return False

    def test_discover_businesses(self):
        """Test business discovery"""
        print("\n🏢 Testing Business Discovery...")
        
        response = requests.get(f"{BASE_URL}/customer/businesses?verified_only=true&size=5")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Found {result['total']} businesses")
            for business in result['businesses'][:3]:
                print(f"   - {business['business_name']} (Verified: {business['is_verified']})")
            return True
        else:
            print(f"❌ Failed: {response.text}")
            return False

    def run_all_tests(self):
        """Run all customer tests in sequence"""
        print("🚀 Starting Customer API Tests...\n")
        
        try:
            # Authentication flow
            if not (self.test_customer_registration() or self.test_customer_login()):
                print("❌ Authentication failed, stopping tests")
                return
            
            # Core customer functionality tests
            tests = [
                self.test_search_products,
                self.test_search_offers,
                self.test_trending_offers,
                self.test_expiring_offers,
                self.test_save_offer,
                self.test_get_saved_offers,
                self.test_claim_offer,
                self.test_get_claimed_offers,
                self.test_offer_status,
                self.test_discover_businesses,
                self.test_unsave_offer,  # Run last to clean up
            ]
            
            passed = 0
            for test in tests:
                try:
                    if test():
                        passed += 1
                except Exception as e:
                    print(f"❌ Test failed with exception: {e}")
            
            print(f"\n📊 Test Results: {passed}/{len(tests)} tests passed")
            
        except KeyboardInterrupt:
            print("\n⚠️  Tests interrupted by user")
        except Exception as e:
            print(f"\n❌ Unexpected error: {e}")


async def main():
    """Main test runner"""
    print("🧪 Customer API Test Suite")
    print("=" * 50)
    
    tester = CustomerAPITester()
    tester.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())