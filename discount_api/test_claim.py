#!/usr/bin/env python3
"""
Test script for redemption API endpoints
Run this after setting up the API to verify functionality

Usage: python test_redemption_api.py
"""

import requests
import json
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8001/api/v1"
# You'll need to get these from your auth system
BUSINESS_USER_TOKEN = "eyJhbGciOiJIUzI1NiIsImtpZCI6IktnSm1ScXFPczZ1aU43TmYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2x3d2hzaWFxdmtqdGxxYXhrYWRzLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIzYmUyOTI0Ni05NDQ3LTQ4MjctOGE1NS1mZjk1NThlMmMzNzQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ5NTE1NDgzLCJpYXQiOjE3NDk1MTE4ODMsImVtYWlsIjoib3llZGVqaS5zbXRAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6Im95ZWRlamkuc210QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJzdF9uYW1lIjoiU2FtdWVsIiwibGFzdF9uYW1lIjoiT3llZGVqaSIsInBob25lIjoiMjA0OTUyNjIzOSIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiM2JlMjkyNDYtOTQ0Ny00ODI3LThhNTUtZmY5NTU4ZTJjMzc0In0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NDk1MTE4ODN9XSwic2Vzc2lvbl9pZCI6ImIyYmNkYjIwLTVjZGUtNGQ2NC05ZjU1LWFhNmI1Y2Q0NTk2MyIsImlzX2Fub255bW91cyI6ZmFsc2V9.NIzHu74TGrC_uJh9Kn2eTuoHXB9isfiXhYNSdDYyLpA",
TEST_CLAIM_ID = "AQ51HP87"  # You'll need to create a real claim first

headers = {
    "Authorization": f"Bearer {BUSINESS_USER_TOKEN}",
    "Content-Type": "application/json"
}


def test_verify_claim():
    """Test claim verification endpoint"""
    print("🔍 Testing claim verification...")
    
    url = f"{API_BASE_URL}/business/redeem/verify"
    data = {
        "claim_identifier": TEST_CLAIM_ID,
        "verification_type": "claim_id"
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get("is_valid"):
                print("✅ Claim verification successful!")
                return True
            else:
                print(f"❌ Claim verification failed: {result.get('error_message')}")
                return False
        else:
            print(f"❌ API call failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing verification: {e}")
        return False


def test_verify_qr_code():
    """Test QR code verification"""
    print("\n📱 Testing QR code verification...")
    
    url = f"{API_BASE_URL}/business/redeem/verify"
    # Simulate QR code content
    qr_content = f"https://your-domain.com/verify/{TEST_CLAIM_ID}"
    data = {
        "claim_identifier": qr_content,
        "verification_type": "qr_code"
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get("is_valid"):
                print("✅ QR code verification successful!")
                return True
            else:
                print(f"❌ QR code verification failed: {result.get('error_message')}")
                return False
        else:
            print(f"❌ API call failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing QR verification: {e}")
        return False


def test_complete_redemption():
    """Test completing a redemption"""
    print("\n✅ Testing redemption completion...")
    
    url = f"{API_BASE_URL}/business/redeem/complete"
    data = {
        "claim_id": TEST_CLAIM_ID,
        "redemption_notes": "Test redemption via API"
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("✅ Redemption completion successful!")
                return True
            else:
                print(f"❌ Redemption failed: {result.get('message')}")
                return False
        else:
            print(f"❌ API call failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing redemption: {e}")
        return False


def test_redemption_history():
    """Test getting redemption history"""
    print("\n📊 Testing redemption history...")
    
    url = f"{API_BASE_URL}/business/redeem/history"
    params = {
        "page": 1,
        "limit": 10,
        "redeemed_only": True
    }
    
    try:
        response = requests.get(url, params=params, headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Total redemptions: {result.get('summary', {}).get('total_claims', 0)}")
            print(f"Redemption rate: {result.get('summary', {}).get('redemption_rate', 0)}%")
            print("✅ History retrieval successful!")
            return True
        else:
            print(f"❌ API call failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing history: {e}")
        return False


def test_redemption_stats():
    """Test getting redemption statistics"""
    print("\n📈 Testing redemption statistics...")
    
    url = f"{API_BASE_URL}/business/redeem/stats"
    params = {"days": 30}
    
    try:
        response = requests.get(url, params=params, headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Period: {result.get('period_days')} days")
            print(f"Total claims: {result.get('total_claims', 0)}")
            print(f"Total redemptions: {result.get('total_redemptions', 0)}")
            print(f"Redemption rate: {result.get('redemption_rate', 0)}%")
            print("✅ Stats retrieval successful!")
            return True
        else:
            print(f"❌ API call failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing stats: {e}")
        return False


def test_invalid_claim():
    """Test handling of invalid claims"""
    print("\n🚫 Testing invalid claim handling...")
    
    url = f"{API_BASE_URL}/business/redeem/verify"
    data = {
        "claim_identifier": "INVALID123",
        "verification_type": "claim_id"
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if not result.get("is_valid"):
                print(f"✅ Invalid claim properly rejected: {result.get('error_message')}")
                return True
            else:
                print("❌ Invalid claim was incorrectly accepted")
                return False
        else:
            print(f"❌ API call failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing invalid claim: {e}")
        return False


def main():
    """Run all tests"""
    print("🧪 Testing Redemption API Endpoints")
    print("=" * 50)
    
    if BUSINESS_USER_TOKEN == "your_business_user_jwt_token_here":
        print("❌ Please update BUSINESS_USER_TOKEN with a real JWT token")
        print("💡 You can get this by logging in as a business user and copying the token")
        return
    
    if TEST_CLAIM_ID == "TEST1234":
        print("⚠️  Using default TEST_CLAIM_ID. Update with a real claim ID for better testing")
    
    # Run all tests
    tests = [
        test_invalid_claim,  # Start with invalid claim test
        test_verify_claim,
        test_verify_qr_code,
        test_redemption_history,
        test_redemption_stats,
        # test_complete_redemption,  # Commented out to avoid actually redeeming during testing
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test {test.__name__} failed with exception: {e}")
    
    print("\n" + "=" * 50)
    print(f"🏁 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Redemption API is working correctly.")
    else:
        print(f"⚠️  {total - passed} tests failed. Check the API implementation.")
    
    print("\n💡 Next steps:")
    print("1. Update the frontend to use these endpoints")
    print("2. Test with real claim IDs from your database")
    print("3. Implement QR code scanning in the business dashboard")


if __name__ == "__main__":
    main()