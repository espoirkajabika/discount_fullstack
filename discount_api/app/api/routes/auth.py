from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db, supabase
from app.models.user import Profile
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

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
async def register_user(
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db)
):
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
        
        user_id = uuid.UUID(auth_response.user.id)
        
        # Check if profile already exists (created by trigger)
        result = await db.execute(
            select(Profile).where(Profile.id == user_id)
        )
        existing_profile = result.scalar_one_or_none()
        
        if existing_profile:
            # Update existing profile with additional data
            if user_data.first_name:
                existing_profile.first_name = user_data.first_name
            if user_data.last_name:
                existing_profile.last_name = user_data.last_name
            if user_data.phone:
                existing_profile.phone = user_data.phone
            
            await db.commit()
            await db.refresh(existing_profile)
            profile = existing_profile
        else:
            # Create profile manually if trigger didn't work
            profile = Profile(
                id=user_id,
                email=user_data.email,
                first_name=user_data.first_name,
                last_name=user_data.last_name,
                phone=user_data.phone
            )
            db.add(profile)
            await db.commit()
            await db.refresh(profile)
        
        return UserResponse(
            user=UserProfile.model_validate(profile),
            access_token=auth_response.session.access_token,
            token_type="bearer",
            expires_in=auth_response.session.expires_in or 3600
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=UserResponse)
async def login_user(
    login_data: UserLogin,
    db: AsyncSession = Depends(get_db)
):
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
        
        user_id = uuid.UUID(auth_response.user.id)
        
        # Get user profile from database
        result = await db.execute(
            select(Profile).where(Profile.id == user_id)
        )
        profile = result.scalar_one_or_none()
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        if not profile.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account is deactivated"
            )
        
        return UserResponse(
            user=UserProfile.model_validate(profile),
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
        # Even if Supabase logout fails, we can still return success
        # since the client will discard the token
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
    current_user: UserProfile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user profile"""
    
    try:
        # Get user from database
        result = await db.execute(
            select(Profile).where(Profile.id == current_user.id)
        )
        profile = result.scalar_one_or_none()
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        # Update fields
        update_data = user_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(profile, field, value)
        
        await db.commit()
        await db.refresh(profile)
        
        return UserProfile.model_validate(profile)
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
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