# app/routers/auth.py
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging
from typing import Optional

from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse
from app.database import get_supabase, get_supabase_admin
from supabase import AuthError

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Security scheme
security = HTTPBearer()

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserRegister):
    """
    Register a new user
    
    This endpoint:
    1. Creates a new user in Supabase Auth
    2. Updates the user profile with additional information
    3. Returns authentication token and user data
    """
    try:
        logger.info(f"Attempting to register user: {user_data.email}")
        
        # Get Supabase client
        supabase = get_supabase()
        
        # Create user with Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password
        })
        
        # Check if user was created successfully
        if not auth_response.user:
            logger.error(f"Failed to create user: {user_data.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user account"
            )
        
        logger.info(f"User created in auth: {auth_response.user.id}")
        
        # Update profile with additional information
        # Note: Profile is automatically created via trigger, we just update it
        profile_data = {
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "phone": user_data.phone,
            "is_business": user_data.is_business,
        }
        
        # Remove None values
        profile_data = {k: v for k, v in profile_data.items() if v is not None}
        
        if profile_data:  # Only update if we have data to update
            profile_response = supabase.table("profiles").update(
                profile_data
            ).eq("id", auth_response.user.id).execute()
            
            logger.info(f"Profile updated for user: {auth_response.user.id}")
        
        # Get the complete user profile
        user_profile = supabase.table("profiles").select("*").eq(
            "id", auth_response.user.id
        ).single().execute()
        
        if not user_profile.data:
            logger.error(f"Profile not found after creation: {auth_response.user.id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Profile creation failed"
            )
        
        # Return token and user data
        return Token(
            access_token=auth_response.session.access_token,
            token_type="bearer",
            expires_in=3600,  # 1 hour
            user=UserResponse(**user_profile.data)
        )
        
    except AuthError as e:
        logger.error(f"Supabase auth error during registration: {e}")
        
        # Handle specific auth errors
        error_message = "Registration failed"
        if "already registered" in str(e).lower():
            error_message = "Email already registered"
        elif "invalid email" in str(e).lower():
            error_message = "Invalid email format"
        elif "weak password" in str(e).lower():
            error_message = "Password is too weak"
            
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
        
    except Exception as e:
        logger.error(f"Unexpected error during registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed due to server error"
        )

@router.post("/login", response_model=Token)
async def login_user(user_data: UserLogin):
    """
    Login user
    
    This endpoint:
    1. Authenticates user with Supabase Auth
    2. Returns authentication token and user profile data
    """
    try:
        logger.info(f"Attempting login for user: {user_data.email}")
        
        # Get Supabase client
        supabase = get_supabase()
        
        # Authenticate with Supabase
        auth_response = supabase.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password
        })
        
        # Check authentication success
        if not auth_response.user or not auth_response.session:
            logger.error(f"Authentication failed for: {user_data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        logger.info(f"User authenticated: {auth_response.user.id}")
        
        # Get user profile
        profile_response = supabase.table("profiles").select("*").eq(
            "id", auth_response.user.id
        ).single().execute()
        
        if not profile_response.data:
            logger.error(f"Profile not found for user: {auth_response.user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        # Check if user is active
        if not profile_response.data.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated"
            )
        
        # Return token and user data
        return Token(
            access_token=auth_response.session.access_token,
            token_type="bearer",
            expires_in=3600,  # 1 hour
            user=UserResponse(**profile_response.data)
        )
        
    except AuthError as e:
        logger.error(f"Supabase auth error during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
        
    except Exception as e:
        logger.error(f"Unexpected error during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed due to server error"
        )

@router.post("/logout")
async def logout_user():
    """
    Logout user
    
    This endpoint signs out the current user session
    """
    try:
        logger.info("User logout requested")
        
        # Get Supabase client
        supabase = get_supabase()
        
        # Sign out user
        supabase.auth.sign_out()
        
        return {"message": "Successfully logged out"}
        
    except Exception as e:
        logger.error(f"Error during logout: {e}")
        # Even if logout fails, we return success
        # since the client should clear the token anyway
        return {"message": "Logged out"}

# We'll add the /me endpoint and auth middleware in the next step