# app/database.py
from supabase import create_client, Client
from decouple import config
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_URL = config("SUPABASE_URL")
SUPABASE_ANON_KEY = config("SUPABASE_ANON_KEY") 
SUPABASE_SERVICE_KEY = config("SUPABASE_SERVICE_KEY")

# Validate configuration
if not all([SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY]):
    raise ValueError("Missing required Supabase configuration. Check your .env file.")

# Initialize Supabase clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async def init_db():
    """Initialize database connection and verify tables exist"""
    try:
        # Test connection by checking if profiles table exists
        response = supabase.table("profiles").select("id").limit(1).execute()
        logger.info("✅ Database connection successful")
        
        # Check if sample categories exist
        categories_response = supabase.table("categories").select("*").execute()
        logger.info(f"✅ Found {len(categories_response.data)} categories")
        
        return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False

def get_supabase() -> Client:
    """Get Supabase client for regular operations"""
    return supabase

def get_supabase_admin() -> Client:
    """Get Supabase admin client for privileged operations"""
    return supabase_admin