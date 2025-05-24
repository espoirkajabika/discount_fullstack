#!/usr/bin/env python3
"""
Test registration functionality
"""
import sys
import asyncio

# Fix for Windows compatibility
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.core.database import supabase
import uuid

async def test_registration():
    print("🧪 Testing registration process...")
    
    # Test data
    test_email = "soyedeji@rrc.ca"
    test_password = "testpassword123"
    
    print(f"📧 Testing with email: {test_email}")
    
    try:
        # Step 1: Test Supabase Auth registration
        print("\n🔐 Step 1: Testing Supabase Auth...")
        auth_response = supabase.auth.sign_up({
            "email": test_email,
            "password": test_password,
            "options": {
                "data": {
                    "first_name": "Test",
                    "last_name": "User",
                    "phone": "1234567890"
                }
            }
        })
        
        print(f"✅ Auth response received")
        print(f"   User ID: {auth_response.user.id if auth_response.user else 'None'}")
        print(f"   Email: {auth_response.user.email if auth_response.user else 'None'}")
        
        if not auth_response.user:
            print("❌ No user returned from auth")
            return
            
        user_id = auth_response.user.id
        
        # Step 2: Check if profile exists
        print(f"\n📊 Step 2: Checking if profile exists for user {user_id}...")
        existing_profile = supabase.table("profiles").select("*").eq("id", user_id).execute()
        
        print(f"   Existing profiles found: {len(existing_profile.data)}")
        if existing_profile.data:
            print(f"   Profile data: {existing_profile.data[0]}")
        
        # Step 3: Try to create/update profile
        print(f"\n💾 Step 3: Creating/updating profile...")
        
        if existing_profile.data:
            # Update existing profile
            profile_data = {
                "first_name": "Test",
                "last_name": "User", 
                "phone": "1234567890"
            }
            
            result = supabase.table("profiles").update(profile_data).eq("id", user_id).execute()
            print(f"✅ Profile updated: {len(result.data)} records")
            if result.data:
                print(f"   Updated profile: {result.data[0]}")
        else:
            # Create new profile
            profile_data = {
                "id": user_id,
                "email": test_email,
                "first_name": "Test",
                "last_name": "User",
                "phone": "1234567890"
            }
            
            result = supabase.table("profiles").insert(profile_data).execute()
            print(f"✅ Profile created: {len(result.data)} records")
            if result.data:
                print(f"   New profile: {result.data[0]}")
        
        print(f"\n🎉 Registration test completed successfully!")
        
        # Cleanup - delete the test user
        print(f"\n🧹 Cleaning up test user...")
        try:
            # Delete profile first
            supabase.table("profiles").delete().eq("id", user_id).execute()
            print("✅ Test profile deleted")
        except Exception as e:
            print(f"⚠️  Profile cleanup warning: {e}")
        
    except Exception as e:
        print(f"❌ Registration test failed: {e}")
        print(f"   Error type: {type(e).__name__}")
        import traceback
        print(f"   Full traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    asyncio.run(test_registration())