# app/api/routes/business.py
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from typing import Optional, List
from datetime import datetime
import uuid
import os
from pathlib import Path
from decimal import Decimal
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


def convert_decimals_to_float(data):
    """Convert Decimal fields to float in a dictionary or list"""
    if isinstance(data, dict):
        return {key: convert_decimals_to_float(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_decimals_to_float(item) for item in data]
    elif isinstance(data, Decimal):
        return float(data)
    else:
        return data


def prepare_data_for_supabase(data):
    """Convert UUID and Decimal objects to JSON-serializable types"""
    if isinstance(data, dict):
        return {key: prepare_data_for_supabase(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [prepare_data_for_supabase(item) for item in data]
    elif isinstance(data, uuid.UUID):
        return str(data)
    elif isinstance(data, Decimal):
        return float(data)
    else:
        return data

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
        business_result = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Build query
        query = supabase_admin.table("products").select("*, categories(*)", count="exact").eq("business_id", business_id)
        
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
        
        # Convert any Decimal fields to float
        products_data = convert_decimals_to_float(result.data)
        products = [ProductResponse(**product) for product in products_data]
        
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
        print(f"Creating product for user: {current_user.id}")
        print(f"Product data: {product_data}")
        
        # Get user's business
        business_result = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found. Please register your business first."
            )
        
        business_id = business_result.data[0]["id"]
        print(f"Business ID: {business_id}")
        
        # Validate category exists if provided
        if product_data.category_id:
            category_check = supabase_admin.table("categories").select("id").eq("id", str(product_data.category_id)).execute()
            if not category_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid category ID"
                )
        
        # Create product
        product_dict = product_data.model_dump(exclude_none=True)
        product_dict["business_id"] = business_id
        product_dict["id"] = str(uuid.uuid4())
        
        # Ensure required fields have defaults
        if "is_active" not in product_dict:
            product_dict["is_active"] = True
        
        # Convert price to float to avoid Decimal serialization issues
        if "price" in product_dict and product_dict["price"] is not None:
            product_dict["price"] = float(product_dict["price"])
        
        # Convert UUID objects to strings for Supabase
        product_dict = prepare_data_for_supabase(product_dict)
        
        print(f"Inserting product: {product_dict}")
        
        # Use admin client to bypass RLS for business operations
        result = supabase_admin.table("products").insert(product_dict).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create product"
            )
        
        print(f"Product created: {result.data[0]}")
        
        # Get product with category info and convert any Decimal fields
        product_with_category = supabase_admin.table("products").select(
            "*, categories(*)"
        ).eq("id", result.data[0]["id"]).execute()
        
        # Convert Decimal fields to float for JSON serialization
        product_data = convert_decimals_to_float(product_with_category.data[0])
        
        return {"product": ProductResponse(**product_data)}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating product: {e}")
        import traceback
        traceback.print_exc()
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
        business_result = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Get product
        result = supabase_admin.table("products").select(
            "*, categories(*)"
        ).eq("id", product_id).eq("business_id", business_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        # Convert Decimal fields to float for JSON serialization
        product_data = convert_decimals_to_float(result.data[0])
        
        return {"product": ProductResponse(**product_data)}
        
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
        business_result = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Update product
        update_data = product_update.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Convert UUID objects to strings for Supabase
        update_data = prepare_data_for_supabase(update_data)
        
        result = supabase_admin.table("products").update(update_data).eq("id", product_id).eq("business_id", business_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        # Get updated product with category info
        product_with_category = supabase_admin.table("products").select(
            "*, categories(*)"
        ).eq("id", result.data[0]["id"]).execute()
        
        # Convert Decimal fields to float for JSON serialization
        product_data = convert_decimals_to_float(product_with_category.data[0])
        
        return {"product": ProductResponse(**product_data)}
        
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
        business_result = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Delete product
        result = supabase_admin.table("products").delete().eq("id", product_id).eq("business_id", business_id).execute()
        
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
# IMAGE UPLOAD WITH PROPER ERROR HANDLING
# ============================================================================

@router.post("/products/upload-image", response_model=dict)
async def upload_product_image(
    image: UploadFile = File(...),
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Upload product image with automatic compression and validation"""
    
    try:
        print(f"Starting image upload for user: {current_user.id}")
        print(f"File: {image.filename}, Content-Type: {image.content_type}, Size: {image.size if hasattr(image, 'size') else 'unknown'}")
        
        # Validate file type at upload level
        allowed_content_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if image.content_type not in allowed_content_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed."
            )
        
        # Read file content
        original_data = await image.read()
        print(f"Read {len(original_data)} bytes from uploaded file")
        
        # Import image utilities
        try:
            from app.utils.image_utils import validate_image_file, compress_image, get_image_info
        except ImportError as e:
            print(f"Failed to import image utilities: {e}")
            # Fallback: proceed without compression
            file_content = original_data
            compression_info = {"message": "Image utilities not available, using original"}
        else:
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
        file_extension = ".jpg" if compression_info.get("compression_ratio", 0) > 0 else os.path.splitext(image.filename)[1].lower()
        if not file_extension:
            file_extension = ".jpg"
            
        unique_filename = f"businesses/{str(current_user.id)}/{uuid.uuid4()}{file_extension}"
        
        print(f"Uploading: {unique_filename} ({len(file_content)} bytes)")
        
        # Upload using requests library for better error handling
        try:
            import requests
            
            upload_url = f"{settings.supabase_url}/storage/v1/object/product-images/{unique_filename}"
            
            headers = {
                "Authorization": f"Bearer {settings.supabase_service_role_key}",
                "Content-Type": image.content_type,
                "Cache-Control": "3600"
            }
            
            print(f"Making upload request to: {upload_url}")
            response = requests.post(upload_url, data=file_content, headers=headers, timeout=30)
            
            print(f"Upload response: {response.status_code}")
            if response.status_code not in [200, 201]:
                print(f"Upload failed with response: {response.text}")
                raise Exception(f"Upload failed: {response.status_code} - {response.text}")
            
            print("✅ Upload successful!")
            
        except requests.RequestException as e:
            print(f"❌ Upload request failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Upload failed: {str(e)}"
            )
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
            "message": "Image uploaded successfully"
        }
        
        # Include compression info if available
        if compression_info:
            response_data["compression_info"] = compression_info
            if compression_info.get("compression_ratio", 0) > 0:
                response_data["compression_applied"] = True
                response_data["size_reduction"] = f"{compression_info['compression_ratio']:.1f}%"
            else:
                response_data["compression_applied"] = False
        
        print(f"Returning response: {response_data}")
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in image upload: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image upload failed: {str(e)}"
        )


# ============================================================================
# BUSINESS REGISTRATION/MANAGEMENT
# ============================================================================

@router.get("/profile", response_model=dict)
async def get_business_profile(
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Get current business profile"""
    
    try:
        # Get business profile
        result = supabase_admin.table("businesses").select(
            "*, categories(*)"
        ).eq("user_id", str(current_user.id)).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business profile not found"
            )
        
        # Convert any problematic fields
        business_data = convert_decimals_to_float(result.data[0])
        
        return {"business": BusinessResponse(**business_data)}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve business profile: {str(e)}"
        )


@router.post("/register", response_model=dict)
async def register_business(
    business_data: BusinessCreate,
    current_user: UserProfile = Depends(get_current_active_user)
):
    """Register a business for the current user"""
    
    try:
        # Check if user already has a business
        existing_business = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if existing_business.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has a registered business"
            )
        
        # Validate category exists if provided
        if business_data.category_id:
            category_check = supabase_admin.table("categories").select("id").eq("id", str(business_data.category_id)).execute()
            if not category_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid category ID"
                )
        
        # Create business
        business_dict = business_data.model_dump(exclude_none=True)
        business_dict["user_id"] = str(current_user.id)
        business_dict["id"] = str(uuid.uuid4())
        
        # Convert UUID objects to strings for Supabase
        business_dict = prepare_data_for_supabase(business_dict)
        
        result = supabase_admin.table("businesses").insert(business_dict).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to register business"
            )
        
        # Update user to be a business user
        supabase_admin.table("profiles").update({"is_business": True}).eq("id", str(current_user.id)).execute()
        
        # Get business with category info
        business_with_category = supabase_admin.table("businesses").select(
            "*, categories(*)"
        ).eq("id", result.data[0]["id"]).execute()
        
        # Convert any problematic fields
        business_data = convert_decimals_to_float(business_with_category.data[0])
        
        return {"business": BusinessResponse(**business_data)}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Business registration failed: {str(e)}"
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
        business_result = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Verify product belongs to business
        product_check = supabase_admin.table("products").select("id").eq("id", product_id).eq("business_id", business_id).execute()
        if not product_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        # Get offers for this product
        result = supabase_admin.table("offers").select("*").eq("product_id", product_id).eq("business_id", business_id).execute()
        
        return {"offers": result.data}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve product offers: {str(e)}"
        )


# app/api/routes/business.py - Add these offer endpoints to the existing file

# ============================================================================
# OFFER MANAGEMENT WITH PAGINATION AND SEARCH
# ============================================================================

@router.get("/offers", response_model=dict)
async def list_my_offers(
    current_user: UserProfile = Depends(get_current_business_user),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None, regex="^(active|inactive|expired|upcoming)$"),
    product_id: Optional[str] = Query(None),
    sortBy: str = Query("created_at", regex="^(created_at|expiry_date|discount_percentage|current_claims)$"),
    sortOrder: str = Query("desc", regex="^(asc|desc)$")
):
    """List offers for the current business with pagination and search"""
    
    try:
        # Get user's business
        business_result = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        current_time = datetime.utcnow().isoformat()
        
        # Build query
        query = supabase_admin.table("offers").select(
            "*, products(*, categories(*)), businesses(business_name)", 
            count="exact"
        ).eq("business_id", business_id)
        
        # Apply search filter
        if search:
            query = query.or_(f"title.ilike.%{search}%,description.ilike.%{search}%")
        
        # Apply status filter
        if status:
            if status == "active":
                query = query.eq("is_active", True).lte("start_date", current_time).gte("expiry_date", current_time)
            elif status == "inactive":
                query = query.eq("is_active", False)
            elif status == "expired":
                query = query.lt("expiry_date", current_time)
            elif status == "upcoming":
                query = query.gt("start_date", current_time)
        
        # Apply product filter
        if product_id:
            query = query.eq("product_id", product_id)
        
        # Apply sorting
        desc_order = sortOrder == "desc"
        query = query.order(sortBy, desc=desc_order)
        
        # Apply pagination
        offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1)
        
        result = query.execute()
        
        total = result.count if result.count else 0
        total_pages = (total + limit - 1) // limit
        
        # Convert any Decimal fields to float and fix structure
        offers_data = []
        for offer in result.data:
            offer_data = convert_decimals_to_float(offer)
            # Rename 'products' to 'product' for frontend consistency
            if 'products' in offer_data:
                offer_data['product'] = offer_data['products']
                del offer_data['products']
            offers_data.append(offer_data)
        
        return {
            "offers": offers_data,
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
        print(f"Error listing offers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve offers: {str(e)}"
        )


@router.post("/offers", response_model=dict)
async def create_offer(
    offer_data: dict,  # Use dict to handle the frontend data structure
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Create a new offer for the current business"""
    
    try:
        print(f"Creating offer for user: {current_user.id}")
        print(f"Offer data: {offer_data}")
        
        # Get user's business
        business_result = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found. Please register your business first."
            )
        
        business_id = business_result.data[0]["id"]
        
        # Validate product exists and belongs to business
        if offer_data.get("product_id"):
            product_check = supabase_admin.table("products").select("id, name, price").eq("id", offer_data["product_id"]).eq("business_id", business_id).execute()
            if not product_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid product ID or product doesn't belong to your business"
                )
            product = product_check.data[0]
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product ID is required"
            )
        
        # Generate offer title if not provided
        if not offer_data.get("title"):
            offer_data["title"] = f"{offer_data['discount_percentage']}% Off {product['name']}"
        
        # Calculate prices
        original_price = float(product["price"]) if product["price"] else 0
        discount_percentage = float(offer_data["discount_percentage"])
        discount_amount = original_price * (discount_percentage / 100)
        discounted_price = original_price - discount_amount
        
        # Create offer record
        offer_dict = {
            "id": str(uuid.uuid4()),
            "business_id": business_id,
            "product_id": offer_data["product_id"],
            "title": offer_data["title"],
            "description": offer_data.get("description"),
            "discount_type": "percentage",
            "discount_value": discount_percentage,
            "original_price": original_price,
            "discounted_price": discounted_price,
            "start_date": offer_data["start_date"],
            "expiry_date": offer_data["expiry_date"],
            "max_claims": int(offer_data["max_claims"]) if offer_data.get("max_claims") else None,
            "current_claims": 0,
            "is_active": offer_data.get("is_active", True),
            "terms_conditions": offer_data.get("terms_conditions")
        }
        
        # Convert data for Supabase
        offer_dict = prepare_data_for_supabase(offer_dict)
        
        print(f"Inserting offer: {offer_dict}")
        
        # Insert offer
        result = supabase_admin.table("offers").insert(offer_dict).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create offer"
            )
        
        # Get offer with product info
        offer_with_product = supabase_admin.table("offers").select(
            "*, products(*, categories(*)), businesses(business_name)"
        ).eq("id", result.data[0]["id"]).execute()
        
        # Convert and fix structure
        offer_response = convert_decimals_to_float(offer_with_product.data[0])
        if 'products' in offer_response:
            offer_response['product'] = offer_response['products']
            del offer_response['products']
        
        return {"offer": offer_response}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating offer: {e}")
        import traceback
        traceback.print_exc()
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
        business_result = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Get offer
        result = supabase_admin.table("offers").select(
            "*, products(*, categories(*)), businesses(business_name)"
        ).eq("id", offer_id).eq("business_id", business_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        # Convert and fix structure
        offer_data = convert_decimals_to_float(result.data[0])
        if 'products' in offer_data:
            offer_data['product'] = offer_data['products']
            del offer_data['products']
        
        return {"offer": offer_data}
        
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
    offer_update: dict,  # Use dict to handle frontend data structure
    current_user: UserProfile = Depends(get_current_business_user)
):
    """Update an offer owned by the current business"""
    
    try:
        # Get user's business
        business_result = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Get current offer
        current_offer = supabase_admin.table("offers").select("*, products(price)").eq("id", offer_id).eq("business_id", business_id).execute()
        
        if not current_offer.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        current_data = current_offer.data[0]
        
        # Prepare update data
        update_data = {}
        
        # Update fields that are provided
        if "discount_percentage" in offer_update:
            discount_percentage = float(offer_update["discount_percentage"])
            update_data["discount_value"] = discount_percentage
            
            # Recalculate prices if discount changed
            original_price = float(current_data["products"]["price"]) if current_data["products"]["price"] else 0
            discount_amount = original_price * (discount_percentage / 100)
            discounted_price = original_price - discount_amount
            update_data["discounted_price"] = discounted_price
        
        # Map frontend fields to database fields
        field_mapping = {
            "discount_code": "discount_code",
            "start_date": "start_date",
            "expiry_date": "expiry_date",
            "is_active": "is_active",
            "max_claims": "max_claims"
        }
        
        for frontend_field, db_field in field_mapping.items():
            if frontend_field in offer_update:
                update_data[db_field] = offer_update[frontend_field]
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields to update"
            )
        
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Convert data for Supabase
        update_data = prepare_data_for_supabase(update_data)
        
        # Update offer
        result = supabase_admin.table("offers").update(update_data).eq("id", offer_id).eq("business_id", business_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        # Get updated offer with product info
        offer_with_product = supabase_admin.table("offers").select(
            "*, products(*, categories(*)), businesses(business_name)"
        ).eq("id", result.data[0]["id"]).execute()
        
        # Convert and fix structure
        offer_response = convert_decimals_to_float(offer_with_product.data[0])
        if 'products' in offer_response:
            offer_response['product'] = offer_response['products']
            del offer_response['products']
        
        return {"offer": offer_response}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating offer: {e}")
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
    """Update offer status (activate/deactivate)"""
    
    try:
        # Get user's business
        business_result = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Update offer status
        update_data = {
            "is_active": status_data.get("is_active", True),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase_admin.table("offers").update(update_data).eq("id", offer_id).eq("business_id", business_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        # Get updated offer with product info
        offer_with_product = supabase_admin.table("offers").select(
            "*, products(*, categories(*)), businesses(business_name)"
        ).eq("id", result.data[0]["id"]).execute()
        
        # Convert and fix structure
        offer_response = convert_decimals_to_float(offer_with_product.data[0])
        if 'products' in offer_response:
            offer_response['product'] = offer_response['products']
            del offer_response['products']
        
        return {"offer": offer_response}
        
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
        business_result = supabase_admin.table("businesses").select("id").eq("user_id", str(current_user.id)).execute()
        
        if not business_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business_id = business_result.data[0]["id"]
        
        # Delete offer
        result = supabase_admin.table("offers").delete().eq("id", offer_id).eq("business_id", business_id).execute()
        
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