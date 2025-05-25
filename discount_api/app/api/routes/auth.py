from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import supabase, supabase_admin
from app.schemas.user import (
    UserRegister, 
    UserLogin, 
    UserResponse, 
    UserProfile, 
    UserUpdate,
    TokenResponse,
    MessageResponse
)
from app.utils.dependencies import get_current_active_user
import uuid
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
async def register_user(user_data: UserRegister):
    """Register a new user"""
    
    try:
        # Register user with Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "first_name": user_data.first_name,
                    "last_name": user_data.last_name,
                    "phone": user_data.phone
                }
            }
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed"
            )
        
        user_id = auth_response.user.id
        
        # Check if profile already exists (created by trigger)
        existing_profile = supabase.table("profiles").select("*").eq("id", user_id).execute()
        
        if existing_profile.data:
            # Update existing profile with additional data
            profile_data = {
                "first_name": user_data.first_name,
                "last_name": user_data.last_name,
                "phone": user_data.phone,
                "updated_at": datetime.utcnow().isoformat()
            }
            
            result = supabase.table("profiles").update(profile_data).eq("id", user_id).execute()
            profile = result.data[0] if result.data else existing_profile.data[0]
        else:
            # Create profile manually if trigger didn't work
            profile_data = {
                "id": user_id,
                "email": user_data.email,
                "first_name": user_data.first_name,
                "last_name": user_data.last_name,
                "phone": user_data.phone
            }
            
            result = supabase.table("profiles").insert(profile_data).execute()
            profile = result.data[0]
        
        return UserResponse(
            user=UserProfile(**profile),
            access_token=auth_response.session.access_token,
            token_type="bearer",
            expires_in=auth_response.session.expires_in or 3600
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=UserResponse)
async def login_user(login_data: UserLogin):
    """Login user"""
    
    try:
        # Authenticate with Supabase
        auth_response = supabase.auth.sign_in_with_password({
            "email": login_data.email,
            "password": login_data.password
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        user_id = auth_response.user.id
        
        # Get user profile from database
        result = supabase.table("profiles").select("*").eq("id", user_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        profile = result.data[0]
        
        if not profile.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account is deactivated"
            )
        
        return UserResponse(
            user=UserProfile(**profile),
            access_token=auth_response.session.access_token,
            token_type="bearer",
            expires_in=auth_response.session.expires_in or 3600
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/logout", response_model=MessageResponse)
async def logout_user(current_user: UserProfile = Depends(get_current_active_user)):
    """Logout user (invalidate session)"""
    
    try:
        supabase.auth.sign_out()
        return MessageResponse(message="Successfully logged out")
    except Exception:
        return MessageResponse(message="Successfully logged out")

@router.get("/me", response_model=UserProfile)
async def get_current_user_info(
    current_user: UserProfile = Depends(get_current_active_user)
):
    """Get current user profile"""
    return current_user

@router.put("/me", response_model=UserProfile)
async def update_current_user(
    user_update: UserUpdate,
    current_user: UserProfile = Depends(get_current_active_user)
):
    """Update current user profile"""
    
    try:
        # Update fields
        update_data = user_update.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("profiles").update(update_data).eq("id", str(current_user.id)).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        return UserProfile(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Update failed: {str(e)}"
        )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(current_user: UserProfile = Depends(get_current_active_user)):
    """Refresh access token"""
    
    try:
        # Refresh token with Supabase
        session = supabase.auth.refresh_session()
        
        if not session.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not refresh token"
            )
        
        return TokenResponse(
            access_token=session.session.access_token,
            token_type="bearer",
            expires_in=session.session.expires_in or 3600
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh failed: {str(e)}"
        )