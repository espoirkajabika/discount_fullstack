#!/usr/bin/env python3
"""
Simple database connection test without SQLAlchemy
"""
import asyncio
import psycopg
from app.core.config import settings

async def test_simple_connection():
    print("🔍 Testing simple psycopg connection...")
    
    # Extract connection details from DATABASE_URL
    db_url = settings.database_url
    print(f"Using URL: {db_url[:50]}...")
    
    try:
        # Test with psycopg directly
        conn = await psycopg.AsyncConnection.connect(db_url)
        print("✅ Direct psycopg connection: SUCCESS")
        
        # Test a simple query
        async with conn.cursor() as cur:
            await cur.execute("SELECT version()")
            result = await cur.fetchone()
            print(f"✅ Database version: {result[0][:50]}...")
            
        await conn.close()
        print("✅ Connection closed successfully")
        
    except Exception as e:
        print(f"❌ Direct connection failed: {e}")
        print(f"   Error type: {type(e).__name__}")
        
        # Try to diagnose common issues
        if "authentication failed" in str(e).lower():
            print("   💡 Suggestion: Check your database password")
        elif "could not connect" in str(e).lower():
            print("   💡 Suggestion: Check your database URL and network")
        elif "timeout" in str(e).lower():
            print("   💡 Suggestion: Database might be sleeping or network issue")

if __name__ == "__main__":
    asyncio.run(test_simple_connection())