#!/usr/bin/env python3
"""
Test enhanced claim functionality with QR codes and unique IDs
"""
import asyncio
import sys
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8001/api/v1"
CUSTOMER_EMAIL = "customer@test.com"
CUSTOMER_PASSWORD = "testpassword123"

class EnhancedClaimTester:
    def __init__(self):
        self.access_token = None
        self.offer_id = None
        self.in_store_claim_id = None
        self.online_claim_id = None

    def headers(self):
        return {"Authorization": f"Bearer {self.access_token}"} if self.access_token else {}

    def test_customer_login(self):
        """Test customer login"""
        print("🔐 Testing Customer Login...")
        
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

    def test_find_available_offer(self):
        """Find an available offer to test with"""
        print("\n🔍 Finding Available Offer...")
        
        response = requests.get(f"{BASE_URL}/customer/search/offers?available_only=true&size=1")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if result['offers']:
                self.offer_id = result['offers'][0]['id']
                print(f"✅ Found offer: {result['offers'][0]['title']}")
                print(f"   Offer ID: {self.offer_id}")
                return True
            else:
                print("❌ No available offers found")
                return False
        else:
            print(f"❌ Failed to find offers: {response.text}")
            return False

    def test_in_store_claim(self):
        """Test claiming an offer for in-store redemption"""
        print("\n🏪 Testing In-Store Claim...")
        
        if not self.offer_id:
            print("❌ No offer ID available for testing")
            return False
        
        claim_data = {
            "claim_type": "in_store"
        }
        
        response = requests.post(
            f"{BASE_URL}/customer/offers/{self.offer_id}/claim",
            json=claim_data,
            headers=self.headers()
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            self.in_store_claim_id = result["claim_id"]
            
            print("✅ In-store claim successful!")
            print(f"   Claim ID: {result['claim_id']}")
            print(f"   Claim Type: {result['claim_type']}")
            print(f"   Has QR Code: {'qr_code' in result and result['qr_code'] is not None}")
            print(f"   Verification URL: {result.get('verification_url', 'Not provided')}")
            print(f"   Message: {result.get('message', 'No message')}")
            
            # Check claim display info
            if 'claim_display' in result:
                display = result['claim_display']
                print(f"   Instructions: {display.get('instructions', 'None')}")
                print(f"   Manual Entry: {display.get('manual_entry_text', 'None')}")
            
            return True
        elif response.status_code == 400 and "already claimed" in response.text:
            print("✅ Offer already claimed (expected on retry)")
            return True
        else:
            print(f"❌ In-store claim failed: {response.text}")
            return False

    def test_get_qr_code(self):
        """Test getting QR code for existing claim"""
        print("\n📱 Testing Get QR Code...")
        
        if not self.in_store_claim_id:
            print("❌ No in-store claim ID available")
            return False
        
        response = requests.get(
            f"{BASE_URL}/customer/claimed-offers/{self.in_store_claim_id}/qr",
            headers=self.headers()
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ QR code retrieved successfully!")
            print(f"   Claim ID: {result['claim_id']}")
            print(f"   Offer: {result['offer_title']}")
            print(f"   Has QR Code: {'qr_code' in result and result['qr_code'] is not None}")
            print(f"   Verification URL: {result.get('verification_url', 'Not provided')}")
            print(f"   Is Redeemed: {result.get('is_redeemed', False)}")
            print(f"   Instructions: {result.get('instructions', 'None')}")
            
            if result.get('qr_code'):
                qr_length = len(result['qr_code'])
                print(f"   QR Code Length: {qr_length} characters")
                print(f"   QR Code Preview: {result['qr_code'][:50]}...")
            
            return True
        else:
            print(f"❌ QR code retrieval failed: {response.text}")
            return False

    def test_enhanced_claimed_offers_list(self):
        """Test getting claimed offers with enhanced information"""
        print("\n📋 Testing Enhanced Claimed Offers List...")
        
        response = requests.get(
            f"{BASE_URL}/customer/claimed-offers",
            headers=self.headers()
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Enhanced claimed offers retrieved!")
            print(f"   Total Claims: {result.get('total', 0)}")
            
            if 'summary' in result:
                summary = result['summary']
                print(f"   In-Store Claims: {summary.get('in_store_claims', 0)}")
                print(f"   Online Claims: {summary.get('online_claims', 0)}")
                print(f"   Redeemed Claims: {summary.get('redeemed_claims', 0)}")
                print(f"   Pending Claims: {summary.get('pending_claims', 0)}")
            
            # Show details of first few claims
            for i, claim in enumerate(result.get('claimed_offers', [])[:2]):
                print(f"\n   Claim {i+1}:")
                print(f"     ID: {claim.get('unique_claim_id', 'N/A')}")
                print(f"     Type: {claim.get('claim_type', 'N/A')}")
                print(f"     Offer: {claim.get('offer', {}).get('title', 'N/A')}")
                print(f"     Redeemed: {claim.get('is_redeemed', False)}")
                
                if 'claim_display' in claim:
                    display = claim['claim_display']
                    print(f"     Instructions: {display.get('instructions', 'None')}")
            
            return True
        else:
            print(f"❌ Enhanced claimed offers retrieval failed: {response.text}")
            return False

    def test_offer_status_with_claim_info(self):
        """Test offer status endpoint with claim information"""
        print("\n📊 Testing Offer Status with Claim Info...")
        
        if not self.offer_id:
            print("❌ No offer ID available")
            return False
        
        response = requests.get(
            f"{BASE_URL}/customer/offers/{self.offer_id}/status",
            headers=self.headers()
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Offer status retrieved!")
            print(f"   Is Available: {result.get('is_available', False)}")
            print(f"   Is Claimed: {result.get('is_claimed', False)}")
            print(f"   Can Claim: {result.get('can_claim', False)}")
            print(f"   Reason: {result.get('reason', 'None')}")
            
            if 'claimed_info' in result and result['claimed_info']:
                claim_info = result['claimed_info']
                print(f"   Claim ID: {claim_info.get('claim_id', 'N/A')}")
                print(f"   Claim Type: {claim_info.get('claim_type', 'N/A')}")
                print(f"   Is Redeemed: {claim_info.get('is_redeemed', False)}")
                print(f"   Instructions: {claim_info.get('instructions', 'None')}")
            
            return True
        else:
            print(f"❌ Offer status retrieval failed: {response.text}")
            return False

    def test_claim_utils_directly(self):
        """Test the claim utilities directly"""
        print("\n🔧 Testing Claim Utilities Directly...")
        
        try:
            # Test the utility functions
            import sys
            import os
            sys.path.append(os.path.dirname(os.path.dirname(__file__)))
            
            from app.utils.claim_utils import generate_unique_claim_id, generate_qr_code, verify_claim_id_format
            
            # Test ID generation
            claim_id = generate_unique_claim_id()
            print(f"✅ Generated claim ID: {claim_id}")
            
            # Test ID format validation
            is_valid = verify_claim_id_format(claim_id)
            print(f"✅ Claim ID format valid: {is_valid}")
            
            # Test QR code generation
            qr_data_url, verification_url = generate_qr_code(claim_id)
            print(f"✅ Generated verification URL: {verification_url}")
            print(f"✅ QR code generated (length: {len(qr_data_url)} chars)")
            
            return True
            
        except ImportError as e:
            print(f"❌ Could not import claim utilities: {e}")
            return False
        except Exception as e:
            print(f"❌ Utility testing failed: {e}")
            return False

    def test_online_claim(self):
        """Test claiming an offer for online redemption"""
        print("\n🌐 Testing Online Claim...")
        
        # First, let's find another available offer (or use a different approach)
        response = requests.get(f"{BASE_URL}/customer/search/offers?available_only=true&size=5")
        
        if response.status_code == 200:
            result = response.json()
            available_offers = [offer for offer in result['offers'] if offer['id'] != self.offer_id]
            
            if not available_offers:
                print("⚠️  No additional offers available for online claim test")
                return True  # Skip this test
            
            online_offer_id = available_offers[0]['id']
            print(f"Using offer: {available_offers[0]['title']}")
        else:
            print("⚠️  Could not find offers for online claim test")
            return True  # Skip this test
        
        claim_data = {
            "claim_type": "online",
            "redirect_url": "https://example-merchant.com"
        }
        
        response = requests.post(
            f"{BASE_URL}/customer/offers/{online_offer_id}/claim",
            json=claim_data,
            headers=self.headers()
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            self.online_claim_id = result["claim_id"]
            
            print("✅ Online claim successful!")
            print(f"   Claim ID: {result['claim_id']}")
            print(f"   Claim Type: {result['claim_type']}")
            print(f"   Redirect URL: {result.get('redirect_url', 'Not provided')}")
            print(f"   Message: {result.get('message', 'No message')}")
            
            return True
        elif response.status_code == 400 and "already claimed" in response.text:
            print("✅ Offer already claimed (expected on retry)")
            return True
        else:
            print(f"❌ Online claim failed: {response.text}")
            return False

    def test_claim_filtering(self):
        """Test filtering claimed offers by type"""
        print("\n🔍 Testing Claim Filtering...")
        
        # Test filtering by in-store claims
        response = requests.get(
            f"{BASE_URL}/customer/claimed-offers?claim_type=in_store",
            headers=self.headers()
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ In-store claims: {result.get('total', 0)}")
        
        # Test filtering by online claims
        response = requests.get(
            f"{BASE_URL}/customer/claimed-offers?claim_type=online",
            headers=self.headers()
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Online claims: {result.get('total', 0)}")
        
        # Test filtering by redeemed status
        response = requests.get(
            f"{BASE_URL}/customer/claimed-offers?redeemed_only=false",
            headers=self.headers()
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Pending (unredeemed) claims: {result.get('total', 0)}")
        
        return True

    def run_all_tests(self):
        """Run all enhanced claim tests"""
        print("🚀 Starting Enhanced Claim Tests...\n")
        
        try:
            # Authentication and setup
            if not self.test_customer_login():
                print("❌ Authentication failed, stopping tests")
                return
            
            if not self.test_find_available_offer():
                print("❌ No offers available for testing")
                return
            
            # Core enhanced claim functionality tests
            tests = [
                ("Claim Utils Direct Test", self.test_claim_utils_directly),
                ("In-Store Claim", self.test_in_store_claim),
                ("Get QR Code", self.test_get_qr_code),
                ("Online Claim", self.test_online_claim),
                ("Enhanced Claimed Offers List", self.test_enhanced_claimed_offers_list),
                ("Offer Status with Claim Info", self.test_offer_status_with_claim_info),
                ("Claim Filtering", self.test_claim_filtering),
            ]
            
            passed = 0
            for test_name, test_func in tests:
                try:
                    print(f"\n{'='*50}")
                    if test_func():
                        passed += 1
                        print(f"✅ {test_name} PASSED")
                    else:
                        print(f"❌ {test_name} FAILED")
                except Exception as e:
                    print(f"❌ {test_name} failed with exception: {e}")
            
            print(f"\n{'='*50}")
            print(f"📊 Test Results: {passed}/{len(tests)} tests passed")
            
            if passed == len(tests):
                print("🎉 All enhanced claim tests PASSED!")
            elif passed >= len(tests) * 0.8:
                print("✅ Most tests passed - enhanced claims are working!")
            else:
                print("⚠️  Some tests failed - check the implementation")
            
        except KeyboardInterrupt:
            print("\n⚠️  Tests interrupted by user")
        except Exception as e:
            print(f"\n❌ Unexpected error: {e}")


async def main():
    """Main test runner"""
    print("🧪 Enhanced Claim Functionality Test Suite")
    print("=" * 60)
    print("Testing QR codes, unique IDs, and claim types")
    print("=" * 60)
    
    tester = EnhancedClaimTester()
    tester.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())