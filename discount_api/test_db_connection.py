#!/usr/bin/env python3
"""
Test database connection
"""
import asyncio
from app.core.config import settings
from app.core.database import check_database_health, supabase

async def test_connections():
    print("🔍 Testing database connections...")
    print(f"Database URL: {settings.database_url[:50]}...")
    print(f"Supabase URL: {settings.supabase_url}")
    
    # Test direct database connection
    print("\n📊 Testing direct database connection...")
    try:
        db_healthy = await check_database_health()
        if db_healthy:
            print("✅ Direct database connection: SUCCESS")
        else:
            print("❌ Direct database connection: FAILED")
    except Exception as e:
        print(f"❌ Direct database connection: ERROR - {e}")
    
    # Test Supabase connection
    print("\n🔐 Testing Supabase connection...")
    try:
        result = supabase.table("profiles").select("id").limit(1).execute()
        print("✅ Supabase connection: SUCCESS")
        print(f"   Found {len(result.data)} profiles in test query")
    except Exception as e:
        print(f"❌ Supabase connection: ERROR - {e}")

if __name__ == "__main__":
    asyncio.run(test_connections())