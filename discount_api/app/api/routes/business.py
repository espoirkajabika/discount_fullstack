# app/api/routes/business.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List
from datetime import datetime
from app.core.database import supabase
from app.schemas.business import (
    BusinessCreate, BusinessUpdate, BusinessResponse, BusinessListResponse,
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse,
    OfferCreate, OfferUpdate, OfferResponse, OfferListResponse,
    CategoryResponse, MessageResponse, BusinessUserRegistration
)
from app.schemas.user import UserProfile, UserResponse
from app.schemas.user import UserProfile
from app.utils.dependencies import get_current_active_user, get_current_business_user
import uuid

router = APIRouter(prefix="/business", tags=["Business"])

# ============================================================================
# BUSINESS REGISTRATION & MANAGEMENT
# ============================================================================

# Add this RIGHT AFTER the router = APIRouter(...) line and BEFORE the existing @router.post("/register")

@router.post("/register-complete", response_model=UserResponse)
async def register_business_user(registration_data: BusinessUserRegistration):
    """Register user and business in one step"""
    
    try:
        # Step 1: Register user with Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": registration_data.email,
            "password": registration_data.password,
            "options": {
                "data": {
                    "first_name": registration_data.first_name,
                    "last_name": registration_data.last_name,
                    "phone": registration_data.phone
                }
            }
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User registration failed"
            )
        
        user_id = auth_response.user.id
        
        # Step 2: Create/update user profile
        profile_data = {
            "id": user_id,
            "email": registration_data.email,
            "first_name": registration_data.first_name,
            "last_name": registration_data.last_name,
            "phone": registration_data.phone,
            "is_business": True  # Mark as business user
        }
        
        # Check if profile exists (from trigger)
        existing_profile = supabase.table("profiles").select("*").eq("id", user_id).execute()
        
        if existing_profile.data:
            result = supabase.table("profiles").update(profile_data).eq("id", user_id).execute()
            profile = result.data[0] if result.data else existing_profile.data[0]
        else:
            result = supabase.table("profiles").insert(profile_data).execute()
            profile = result.data[0]
        
        # Step 3: Validate category if provided
        if registration_data.category_id:
            category_check = supabase.table("categories").select("id").eq("id", str(registration_data.category_id)).execute()
            if not category_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid category ID"
                )
        
        # Step 4: Create business profile
        business_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "business_name": registration_data.business_name,
            "business_description": registration_data.business_description,
            "business_address": registration_data.business_address,
            "phone_number": registration_data.business_phone,
            "business_website": registration_data.business_website,
            "avatar_url": registration_data.avatar_url,
            "business_hours": registration_data.business_hours,
            "category_id": str(registration_data.category_id) if registration_data.category_id else None
        }
        
        business_result = supabase.table("businesses").insert(business_data).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Business registration failed"
            )
        
        # Return user response with token
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
        
@router.post("/register", response_model=BusinessResponse)
async def register_business(
    business_data: BusinessCreate,
    current_user: UserProfile = Depends(get_current_active_user)
):
    """Register a new business for the current user"""
    
    try:
        # Check if user already has a business
        existing_business = supabase.table("businesses").select("*").eq("user_id", str(current_user.id)).execute()
        
        if existing_business.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has a registered business"
            )
        
        # Validate category exists if provided
        if business_data.category_id:
            category_check = supabase.table("categories").select("id").eq("id", str(business_data.category_id)).execute()
            if not category_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid category ID"
                )
        
        # Create business
        business_dict = business_data.model_dump()
        business_dict["user_id"] = str(current_user.id)
        business_dict["id"] = str(uuid.uuid4())
        
        result = supabase.table("businesses").insert(business_dict).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create business"
            )
        
        # Update user to business role
        supabase.table("profiles").update({"is_business": True}).eq("id", str(current_user.id)).execute()
        
        # Get business with category info
        business_with_category = supabase.table("businesses").select(
            "*, categories(*)"
        ).eq("id", result.data[0]["id"]).execute()
        
        return BusinessResponse(**business_with_category.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Business registration failed: {str(e)}"
        )


@router.get("/me", response_model=BusinessResponse)
async def get_my_business(
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Get current user's business information"""
    
    try:
        result = supabase.table("businesses").select(
            "*, categories(*)"
        ).eq("user_id", str(current_user.id)).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        return BusinessResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve business: {str(e)}"
        )


@router.put("/me", response_model=BusinessResponse)
async def update_my_business(
    business_update: BusinessUpdate,
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Update current user's business information"""
    
    try:
        # Validate category exists if provided
        if business_update.category_id:
            category_check = supabase.table("categories").select("id").eq("id", str(business_update.category_id)).execute()
            if not category_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid category ID"
                )
        
        # Update business
        update_data = business_update.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("businesses").update(update_data).eq("user_id", str(current_user.id)).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        # Get updated business with category info
        business_with_category = supabase.table("businesses").select(
            "*, categories(*)"
        ).eq("id", result.data[0]["id"]).execute()
        
        return BusinessResponse(**business_with_category.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Business update failed: {str(e)}"
        )


@router.get("/", response_model=BusinessListResponse)
async def list_businesses(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    verified_only: bool = Query(False)
):
    """List all businesses with pagination and filters"""
    
    try:
        # Build query
        query = supabase.table("businesses").select("*, categories(*)", count="exact")
        
        # Apply filters
        if category_id:
            query = query.eq("category_id", category_id)
        
        if verified_only:
            query = query.eq("is_verified", True)
        
        if search:
            query = query.ilike("business_name", f"%{search}%")
        
        # Apply pagination
        offset = (page - 1) * size
        query = query.range(offset, offset + size - 1)
        
        result = query.execute()
        
        total = result.count if result.count else 0
        has_next = (page * size) < total
        
        businesses = [BusinessResponse(**business) for business in result.data]
        
        return BusinessListResponse(
            businesses=businesses,
            total=total,
            page=page,
            size=size,
            has_next=has_next
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve businesses: {str(e)}"
        )


@router.get("/{business_id}", response_model=BusinessResponse)
async def get_business(business_id: str):
    """Get a specific business by ID"""
    
    try:
        result = supabase.table("businesses").select(
            "*, categories(*)"
        ).eq("id", business_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        return BusinessResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve business: {str(e)}"
        )


# ============================================================================
# PRODUCT MANAGEMENT
# ============================================================================

@router.post("/products", response_model=ProductResponse)
async def create_product(
    product_data: ProductCreate,
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Create a new product for the current business"""
    
    try:
        # Get user's business
        business_result = supabase.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Validate category exists if provided
        if product_data.category_id:
            category_check = supabase.table("categories").select("id").eq("id", str(product_data.category_id)).execute()
            if not category_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid category ID"
                )
        
        # Create product
        product_dict = product_data.model_dump()
        product_dict["business_id"] = business_id
        product_dict["id"] = str(uuid.uuid4())
        
        result = supabase.table("products").insert(product_dict).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create product"
            )
        
        # Get product with category info
        product_with_category = supabase.table("products").select(
            "*, categories(*)"
        ).eq("id", result.data[0]["id"]).execute()
        
        return ProductResponse(**product_with_category.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Product creation failed: {str(e)}"
        )


@router.get("/products", response_model=ProductListResponse)
async def list_my_products(
    current_user: UserProfile = Depends(get_current_business_user),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    active_only: bool = Query(True)
):
    """List products for the current business"""
    
    try:
        # Get user's business
        business_result = supabase.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Build query
        query = supabase.table("products").select("*, categories(*)", count="exact").eq("business_id", business_id)
        
        if active_only:
            query = query.eq("is_active", True)
        
        # Apply pagination
        offset = (page - 1) * size
        query = query.range(offset, offset + size - 1)
        
        result = query.execute()
        
        total = result.count if result.count else 0
        has_next = (page * size) < total
        
        products = [ProductResponse(**product) for product in result.data]
        
        return ProductListResponse(
            products=products,
            total=total,
            page=page,
            size=size,
            has_next=has_next
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve products: {str(e)}"
        )


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Get a specific product owned by the current business"""
    
    try:
        # Get user's business
        business_result = supabase.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Get product
        result = supabase.table("products").select(
            "*, categories(*)"
        ).eq("id", product_id).eq("business_id", business_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        return ProductResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve product: {str(e)}"
        )


@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Update a product owned by the current business"""
    
    try:
        # Get user's business
        business_result = supabase.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Validate category exists if provided
        if product_update.category_id:
            category_check = supabase.table("categories").select("id").eq("id", str(product_update.category_id)).execute()
            if not category_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid category ID"
                )
        
        # Update product
        update_data = product_update.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("products").update(update_data).eq("id", product_id).eq("business_id", business_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        # Get updated product with category info
        product_with_category = supabase.table("products").select(
            "*, categories(*)"
        ).eq("id", result.data[0]["id"]).execute()
        
        return ProductResponse(**product_with_category.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Product update failed: {str(e)}"
        )


@router.delete("/products/{product_id}", response_model=MessageResponse)
async def delete_product(
    product_id: str,
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Delete a product owned by the current business"""
    
    try:
        # Get user's business
        business_result = supabase.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Delete product
        result = supabase.table("products").delete().eq("id", product_id).eq("business_id", business_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        return MessageResponse(message="Product deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Product deletion failed: {str(e)}"
        )


# ============================================================================
# OFFER MANAGEMENT
# ============================================================================

@router.post("/offers", response_model=OfferResponse)
async def create_offer(
    offer_data: OfferCreate,
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Create a new offer for the current business"""
    
    try:
        # Get user's business
        business_result = supabase.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Validate product exists and belongs to business if provided
        if offer_data.product_id:
            product_check = supabase.table("products").select("id").eq("id", str(offer_data.product_id)).eq("business_id", business_id).execute()
            if not product_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid product ID or product doesn't belong to your business"
                )
        
        # Create offer
        offer_dict = offer_data.model_dump()
        offer_dict["business_id"] = business_id
        offer_dict["id"] = str(uuid.uuid4())
        
        result = supabase.table("offers").insert(offer_dict).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create offer"
            )
        
        # Get offer with product info
        offer_with_product = supabase.table("offers").select(
            "*, products(*, categories(*))"
        ).eq("id", result.data[0]["id"]).execute()
        
        return OfferResponse(**offer_with_product.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Offer creation failed: {str(e)}"
        )


@router.get("/offers", response_model=OfferListResponse)
async def list_my_offers(
    current_user: UserProfile = Depends(get_current_business_user),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    active_only: bool = Query(True),
    product_id: Optional[str] = None
):
    """List offers for the current business"""
    
    try:
        # Get user's business
        business_result = supabase.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Build query
        query = supabase.table("offers").select("*, products(*, categories(*))", count="exact").eq("business_id", business_id)
        
        if active_only:
            query = query.eq("is_active", True)
        
        if product_id:
            query = query.eq("product_id", product_id)
        
        # Apply pagination
        offset = (page - 1) * size
        query = query.range(offset, offset + size - 1)
        
        result = query.execute()
        
        total = result.count if result.count else 0
        has_next = (page * size) < total
        
        offers = [OfferResponse(**offer) for offer in result.data]
        
        return OfferListResponse(
            offers=offers,
            total=total,
            page=page,
            size=size,
            has_next=has_next
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve offers: {str(e)}"
        )


@router.get("/offers/{offer_id}", response_model=OfferResponse)
async def get_offer(
    offer_id: str,
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Get a specific offer owned by the current business"""
    
    try:
        # Get user's business
        business_result = supabase.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Get offer
        result = supabase.table("offers").select(
            "*, products(*, categories(*))"
        ).eq("id", offer_id).eq("business_id", business_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        return OfferResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve offer: {str(e)}"
        )


@router.put("/offers/{offer_id}", response_model=OfferResponse)
async def update_offer(
    offer_id: str,
    offer_update: OfferUpdate,
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Update an offer owned by the current business"""
    
    try:
        # Get user's business
        business_result = supabase.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Validate product exists and belongs to business if provided
        if offer_update.product_id:
            product_check = supabase.table("products").select("id").eq("id", str(offer_update.product_id)).eq("business_id", business_id).execute()
            if not product_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid product ID or product doesn't belong to your business"
                )
        
        # Update offer
        update_data = offer_update.model_dump(exclude_unset=True)
        
        result = supabase.table("offers").update(update_data).eq("id", offer_id).eq("business_id", business_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        # Get updated offer with product info
        offer_with_product = supabase.table("offers").select(
            "*, products(*, categories(*))"
        ).eq("id", result.data[0]["id"]).execute()
        
        return OfferResponse(**offer_with_product.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Offer update failed: {str(e)}"
        )


@router.delete("/offers/{offer_id}", response_model=MessageResponse)
async def delete_offer(
    offer_id: str,
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Delete an offer owned by the current business"""
    
    try:
        # Get user's business
        business_result = supabase.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Delete offer
        result = supabase.table("offers").delete().eq("id", offer_id).eq("business_id", business_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        return MessageResponse(message="Offer deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Offer deletion failed: {str(e)}"
        )


# ============================================================================
# PUBLIC ENDPOINTS
# ============================================================================

@router.get("/public/products", response_model=ProductListResponse)
async def list_public_products(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    category_id: Optional[str] = None,
    business_id: Optional[str] = None,
    search: Optional[str] = None
):
    """List active products publicly"""
    
    try:
        # Build query
        query = supabase.table("products").select("*, categories(*)", count="exact").eq("is_active", True)
        
        # Apply filters
        if category_id:
            query = query.eq("category_id", category_id)
        
        if business_id:
            query = query.eq("business_id", business_id)
        
        if search:
            query = query.ilike("name", f"%{search}%")
        
        # Apply pagination
        offset = (page - 1) * size
        query = query.range(offset, offset + size - 1)
        
        result = query.execute()
        
        total = result.count if result.count else 0
        has_next = (page * size) < total
        
        products = [ProductResponse(**product) for product in result.data]
        
        return ProductListResponse(
            products=products,
            total=total,
            page=page,
            size=size,
            has_next=has_next
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve products: {str(e)}"
        )


@router.get("/public/offers", response_model=OfferListResponse)
async def list_public_offers(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    business_id: Optional[str] = None,
    product_id: Optional[str] = None,
    discount_type: Optional[str] = None
):
    """List active offers publicly"""
    
    try:
        current_time = datetime.utcnow().isoformat()
        
        # Build query - only active offers within date range
        query = supabase.table("offers").select(
            "*, products(*, categories(*))", count="exact"
        ).eq("is_active", True).gte("expiry_date", current_time).lte("start_date", current_time)
        
        # Apply filters
        if business_id:
            query = query.eq("business_id", business_id)
        
        if product_id:
            query = query.eq("product_id", product_id)
        
        if discount_type:
            query = query.eq("discount_type", discount_type)
        
        # Apply pagination
        offset = (page - 1) * size
        query = query.range(offset, offset + size - 1)
        
        result = query.execute()
        
        total = result.count if result.count else 0
        has_next = (page * size) < total
        
        offers = [OfferResponse(**offer) for offer in result.data]
        
        return OfferListResponse(
            offers=offers,
            total=total,
            page=page,
            size=size,
            has_next=has_next
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve offers: {str(e)}"
        )