import sys
import asyncio

# Fix for Windows compatibility
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy.ext.declarative import declarative_base
from supabase import create_client, Client
from app.core.config import settings

Base = declarative_base()

# Supabase client for auth and database operations
supabase: Client = create_client(
    settings.supabase_url, 
    settings.supabase_anon_key
)

# Service role client for admin operations
supabase_admin: Client = create_client(
    settings.supabase_url, 
    settings.supabase_service_role_key
)

# Simple database health check using Supabase
async def check_database_health() -> bool:
    try:
        # Test connection by querying profiles table
        result = supabase.table("profiles").select("id").limit(1).execute()
        return True
    except Exception:
        return False

# For now, we'll use Supabase client for all database operations
# This avoids the Windows async connection issues
async def get_db():
    """
    Placeholder for database session dependency
    For now returns the supabase client
    """
    return supabase