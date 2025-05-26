from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Supabase Configuration
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str  # This should match your .env
    
    # Database Configuration
    database_url: str
    
    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # App Configuration
    app_name: str = "Offers API"
    debug: bool = False
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        # Map environment variables to field names
        env_aliases = {
            'supabase_service_role_key': 'SUPABASE_SERVICE_KEY'  # Map your env var name
        }


settings = Settings()