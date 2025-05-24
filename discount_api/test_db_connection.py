#!/usr/bin/env python3
"""
Test database connection
"""
import sys
import asyncio

# Fix for Windows psycopg3 compatibility
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

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
        print(f"   Error type: {type(e).__name__}")
        
    # Test raw connection
    print("\n🔧 Testing Supabase-based operations...")
    try:
        from app.core.database import supabase
        
        # Test a simple table operation
        result = supabase.table("profiles").select("*").limit(1).execute()
        print(f"✅ Supabase operations: SUCCESS - Found {len(result.data)} profiles")
        
        # Test if we can query other tables (like categories)
        try:
            categories_result = supabase.table("categories").select("*").limit(3).execute()
            print(f"✅ Categories table: SUCCESS - Found {len(categories_result.data)} categories")
        except Exception as e:
            print(f"ℹ️  Categories table: {e}")
            
    except Exception as e:
        print(f"❌ Supabase operations: ERROR - {e}")
        print(f"   Error type: {type(e).__name__}")
    
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