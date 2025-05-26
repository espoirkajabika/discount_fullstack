# app/api/routes/business.py
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from typing import Optional, List
from datetime import datetime
import uuid
import os
from pathlib import Path
from app.core.database import supabase, supabase_admin
from app.core.config import settings 
from app.schemas.business import (
    BusinessCreate, BusinessUpdate, BusinessResponse, BusinessListResponse,
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse,
    OfferCreate, OfferUpdate, OfferResponse, OfferListResponse,
    CategoryResponse, MessageResponse, BusinessUserRegistration
)
from app.schemas.user import UserProfile, UserResponse
from app.utils.dependencies import get_current_active_user, get_current_business_user

router = APIRouter(prefix="/business", tags=["Business"])

# ============================================================================
# PRODUCT MANAGEMENT WITH PAGINATION AND SEARCH
# ============================================================================

@router.get("/products", response_model=dict)
async def list_my_products(
    current_user: UserProfile = Depends(get_current_business_user),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    sortBy: str = Query("created_at", regex="^(created_at|name|price|updated_at)$"),
    sortOrder: str = Query("desc", regex="^(asc|desc)$")
):
    """List products for the current business with pagination and search"""
    
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
        
        # Apply search filter
        if search:
            query = query.or_(f"name.ilike.%{search}%,description.ilike.%{search}%")
        
        # Apply sorting
        desc_order = sortOrder == "desc"
        query = query.order(sortBy, desc=desc_order)
        
        # Apply pagination
        offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1)
        
        result = query.execute()
        
        total = result.count if result.count else 0
        total_pages = (total + limit - 1) // limit
        
        products = [ProductResponse(**product) for product in result.data]
        
        return {
            "products": products,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "totalPages": total_pages
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve products: {str(e)}"
        )


@router.post("/products", response_model=dict)
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
        
        return {"product": ProductResponse(**product_with_category.data[0])}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Product creation failed: {str(e)}"
        )


@router.get("/products/{product_id}", response_model=dict)
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
        
        return {"product": ProductResponse(**result.data[0])}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve product: {str(e)}"
        )


@router.patch("/products/{product_id}", response_model=dict)
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
        
        return {"product": ProductResponse(**product_with_category.data[0])}
        
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


# Image upload endpoint
# Updated upload endpoint in app/api/routes/business.py

from app.utils.image_utils import compress_image, get_image_info, validate_image_file, create_thumbnail

@router.post("/products/upload-image", response_model=dict)
async def upload_product_image(
    image: UploadFile = File(...),
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Upload product image with automatic compression and validation"""
    
    try:
        # Validate file type at upload level
        allowed_content_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if image.content_type not in allowed_content_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed."
            )
        
        # Read file content
        original_data = await image.read()
        
        # Validate the actual image data
        is_valid, validation_message = validate_image_file(original_data)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid image: {validation_message}"
            )
        
        # Get original image info
        original_info = get_image_info(original_data)
        print(f"Original image info: {original_info}")
        
        # Set size limit for Supabase (5MB max, but compress to 2MB for better performance)
        max_size = 2 * 1024 * 1024  # 2MB
        
        # Compress image if necessary
        if len(original_data) > max_size or original_info.get('width', 0) > 1920:
            print(f"Compressing image from {len(original_data)} bytes...")
            file_content, compression_info = compress_image(
                original_data, 
                max_size_bytes=max_size,
                quality=85,
                max_dimension=1920
            )
            print(f"Compression info: {compression_info}")
        else:
            file_content = original_data
            compression_info = {
                "original_size": len(original_data),
                "compressed_size": len(original_data),
                "compression_ratio": 0,
                "message": "No compression needed"
            }
        
        # Final size check
        if len(file_content) > 5 * 1024 * 1024:  # Supabase hard limit
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image too large even after compression. Please use a smaller image."
            )
        
        # Generate unique filename (always .jpg after compression)
        unique_filename = f"businesses/{str(current_user.id)}/{uuid.uuid4()}.jpg"
        
        print(f"Uploading: {unique_filename} ({len(file_content)} bytes)")
        
        # Upload using direct HTTP request
        try:
            import requests
            
            upload_url = f"{settings.supabase_url}/storage/v1/object/product-images/{unique_filename}"
            
            headers = {
                "Authorization": f"Bearer {settings.supabase_service_role_key}",
                "Content-Type": "image/jpeg",
                "Cache-Control": "3600"
            }
            
            response = requests.post(upload_url, data=file_content, headers=headers)
            
            if response.status_code not in [200, 201]:
                raise Exception(f"Upload failed: {response.status_code} - {response.text}")
            
            print("✅ Upload successful!")
            
        except Exception as upload_error:
            print(f"❌ Upload failed: {upload_error}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Upload failed: {str(upload_error)}"
            )
        
        # Generate public URL
        public_url = f"{settings.supabase_url}/storage/v1/object/public/product-images/{unique_filename}"
        
        # Create response with detailed info
        response_data = {
            "path": unique_filename,
            "url": public_url,
            "message": "Image uploaded successfully",
            "original_info": original_info,
            "compression_info": compression_info
        }
        
        # Only include compression details if compression was applied
        if compression_info.get("compression_ratio", 0) > 0:
            response_data["compression_applied"] = True
            response_data["size_reduction"] = f"{compression_info['compression_ratio']:.1f}%"
        else:
            response_data["compression_applied"] = False
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image upload failed: {str(e)}"
        )


# Optional: Add thumbnail generation endpoint
@router.post("/products/upload-image-with-thumbnail", response_model=dict)
async def upload_product_image_with_thumbnail(
    image: UploadFile = File(...),
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Upload product image and create thumbnail"""
    
    try:
        # ... (same validation and compression as above)
        original_data = await image.read()
        
        # Validate and compress main image
        is_valid, validation_message = validate_image_file(original_data)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid image: {validation_message}"
            )
        
        max_size = 2 * 1024 * 1024  # 2MB
        file_content, compression_info = compress_image(original_data, max_size)
        
        # Create thumbnail
        thumbnail_data = create_thumbnail(original_data, size=(300, 300))
        
        # Generate filenames
        base_filename = f"businesses/{str(current_user.id)}/{uuid.uuid4()}"
        main_filename = f"{base_filename}.jpg"
        thumb_filename = f"{base_filename}_thumb.jpg"
        
        # Upload both files
        import requests
        
        upload_results = {}
        
        # Upload main image
        main_url = f"{settings.supabase_url}/storage/v1/object/product-images/{main_filename}"
        main_response = requests.post(main_url, data=file_content, headers={
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "Content-Type": "image/jpeg"
        })
        
        if main_response.status_code in [200, 201]:
            upload_results["main_image"] = {
                "path": main_filename,
                "url": f"{settings.supabase_url}/storage/v1/object/public/product-images/{main_filename}"
            }
        
        # Upload thumbnail
        thumb_url = f"{settings.supabase_url}/storage/v1/object/product-images/{thumb_filename}"
        thumb_response = requests.post(thumb_url, data=thumbnail_data, headers={
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "Content-Type": "image/jpeg"
        })
        
        if thumb_response.status_code in [200, 201]:
            upload_results["thumbnail"] = {
                "path": thumb_filename,
                "url": f"{settings.supabase_url}/storage/v1/object/public/product-images/{thumb_filename}"
            }
        
        return {
            "message": "Images uploaded successfully",
            "uploads": upload_results,
            "compression_info": compression_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )


# ============================================================================
# OFFER MANAGEMENT WITH PAGINATION AND SEARCH
# ============================================================================

# Update the existing offers schema for frontend compatibility
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal

class OfferCreateRequest(BaseModel):
    product_id: str
    discount_percentage: int
    discount_code: Optional[str] = None
    start_date: datetime
    expiry_date: datetime
    is_active: bool = True
    max_claims: Optional[int] = None


class OfferUpdateRequest(BaseModel):
    discount_percentage: Optional[int] = None
    discount_code: Optional[str] = None
    start_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    is_active: Optional[bool] = None
    max_claims: Optional[int] = None


@router.get("/offers", response_model=dict)
async def list_my_offers(
    current_user: UserProfile = Depends(get_current_business_user),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None, regex="^(active|upcoming|expired|inactive)$"),
    sortBy: str = Query("created_at", regex="^(created_at|expiry_date|discount_percentage|current_claims)$"),
    sortOrder: str = Query("desc", regex="^(asc|desc)$")
):
    """List offers for the current business with pagination and filters"""
    
    try:
        # Get user's business
        business_result = supabase.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        current_time = datetime.utcnow().isoformat()
        
        # Build base query with product info
        query = supabase.table("offers").select(
            "*, products(*, categories(*))", 
            count="exact"
        ).eq("business_id", business_id)
        
        # Apply search filter (search in product name)
        if search:
            query = query.or_(f"products.name.ilike.%{search}%,discount_code.ilike.%{search}%")
        
        # Apply status filter
        if status == "active":
            query = query.eq("is_active", True).gte("expiry_date", current_time).lte("start_date", current_time)
        elif status == "upcoming":
            query = query.gt("start_date", current_time)
        elif status == "expired":
            query = query.lt("expiry_date", current_time)
        elif status == "inactive":
            query = query.eq("is_active", False)
        
        # Apply sorting
        desc_order = sortOrder == "desc"
        query = query.order(sortBy, desc=desc_order)
        
        # Apply pagination
        offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1)
        
        result = query.execute()
        
        total = result.count if result.count else 0
        total_pages = (total + limit - 1) // limit
        
        # Transform offers to match frontend expectations
        offers = []
        for offer in result.data:
            offer_dict = offer.copy()
            # Ensure products data is available
            if not offer_dict.get('products'):
                offer_dict['products'] = None
            offers.append(offer_dict)
        
        return {
            "offers": offers,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "totalPages": total_pages
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve offers: {str(e)}"
        )


@router.post("/offers", response_model=dict)
async def create_offer(
    offer_data: OfferCreateRequest,
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
        
        # Validate product exists and belongs to business
        product_check = supabase.table("products").select("id, price").eq("id", offer_data.product_id).eq("business_id", business_id).execute()
        if not product_check.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid product ID or product doesn't belong to your business"
            )
        
        product_price = float(product_check.data[0]["price"])
        
        # Calculate discounted price
        discount_amount = product_price * (offer_data.discount_percentage / 100)
        discounted_price = product_price - discount_amount
        
        # Create offer with FastAPI-compatible structure
        offer_dict = {
            "id": str(uuid.uuid4()),
            "business_id": business_id,
            "product_id": offer_data.product_id,
            "title": f"{offer_data.discount_percentage}% Off",
            "discount_type": "percentage",
            "discount_value": offer_data.discount_percentage,
            "original_price": product_price,
            "discounted_price": discounted_price,
            "start_date": offer_data.start_date.isoformat(),
            "expiry_date": offer_data.expiry_date.isoformat(),
            "is_active": offer_data.is_active,
            "max_claims": offer_data.max_claims,
            "current_claims": 0,
            "discount_code": offer_data.discount_code
        }
        
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
        
        return {"offer": offer_with_product.data[0]}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Offer creation failed: {str(e)}"
        )


@router.get("/offers/{offer_id}", response_model=dict)
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
        
        return {"offer": result.data[0]}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve offer: {str(e)}"
        )


@router.patch("/offers/{offer_id}", response_model=dict)
async def update_offer(
    offer_id: str,
    offer_update: OfferUpdateRequest,
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
        
        # Get existing offer
        existing_offer = supabase.table("offers").select("*, products(price)").eq("id", offer_id).eq("business_id", business_id).execute()
        
        if not existing_offer.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        # Prepare update data
        update_data = offer_update.model_dump(exclude_unset=True)
        
        # Recalculate prices if discount percentage changed
        if offer_update.discount_percentage is not None:
            product_price = float(existing_offer.data[0]["products"]["price"])
            discount_amount = product_price * (offer_update.discount_percentage / 100)
            update_data["discount_value"] = offer_update.discount_percentage
            update_data["discounted_price"] = product_price - discount_amount
            update_data["title"] = f"{offer_update.discount_percentage}% Off"
        
        # Convert datetime objects to strings
        if "start_date" in update_data:
            update_data["start_date"] = update_data["start_date"].isoformat()
        if "expiry_date" in update_data:
            update_data["expiry_date"] = update_data["expiry_date"].isoformat()
        
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
        
        return {"offer": offer_with_product.data[0]}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Offer update failed: {str(e)}"
        )


@router.patch("/offers/{offer_id}/status", response_model=dict)
async def update_offer_status(
    offer_id: str,
    status_data: dict,
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Update offer active status"""
    
    try:
        # Get user's business
        business_result = supabase.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Update offer status
        is_active = status_data.get("is_active", False)
        result = supabase.table("offers").update({"is_active": is_active}).eq("id", offer_id).eq("business_id", business_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        # Get updated offer with product info
        offer_with_product = supabase.table("offers").select(
            "*, products(*, categories(*))"
        ).eq("id", result.data[0]["id"]).execute()
        
        return {"offer": offer_with_product.data[0]}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Status update failed: {str(e)}"
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
# PRODUCT-OFFER RELATIONSHIP
# ============================================================================

@router.get("/products/{product_id}/offers", response_model=dict)
async def get_product_offers(
    product_id: str,
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Get all offers for a specific product"""
    
    try:
        # Get user's business
        business_result = supabase.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Verify product belongs to business
        product_check = supabase.table("products").select("id").eq("id", product_id).eq("business_id", business_id).execute()
        if not product_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        # Get offers for this product
        result = supabase.table("offers").select("*").eq("product_id", product_id).eq("business_id", business_id).execute()
        
        return {"offers": result.data}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve product offers: {str(e)}"
        )