# app/api/routes/customer.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List
from datetime import datetime
from app.core.database import supabase
from app.schemas.business import (
    ProductResponse, ProductListResponse,
    OfferResponse, OfferListResponse,
    BusinessResponse, CategoryResponse,
    MessageResponse
)
from app.schemas.customer import (
    SavedOfferResponse, SavedOfferListResponse,
    ClaimedOfferResponse, ClaimedOfferListResponse,
    OfferSearchResponse, ProductSearchResponse
)
from app.schemas.user import UserProfile
from app.utils.dependencies import get_current_active_user, get_current_user_optional
import uuid

# Add this helper function at the top of your customer.py file (after imports)
async def enrich_offers_with_product_data(offers_data):
    """Fetch product data for offers and merge it"""
    enriched_offers = []
    
    for offer in offers_data:
        # Get the product data if product_id exists
        if offer.get('product_id'):
            try:
                product_result = supabase.table("products").select(
                    "*, categories(*)"
                ).eq("id", offer['product_id']).execute()
                
                if product_result.data:
                    offer['products'] = product_result.data[0]
            except Exception as e:
                print(f"Error fetching product for offer {offer.get('id')}: {e}")
                offer['products'] = None
        
        enriched_offers.append(offer)
    
    return enriched_offers

router = APIRouter(prefix="/customer", tags=["Customer"])

# ============================================================================
# SEARCH & DISCOVERY
# ============================================================================

@router.get("/search/products", response_model=ProductListResponse)
async def search_products(
    q: Optional[str] = Query(None, description="Search query"),
    category_id: Optional[str] = Query(None, description="Filter by category"),
    business_id: Optional[str] = Query(None, description="Filter by business"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price"),
    sort_by: str = Query("name", regex="^(name|price|created_at)$", description="Sort field"),
    sort_order: str = Query("asc", regex="^(asc|desc)$", description="Sort order"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100)
):
    """Search and filter products with advanced options"""
    
    try:
        # Build query - only active products
        query = supabase.table("products").select(
            "*, categories(*), businesses!inner(business_name, is_verified, avatar_url)", 
            count="exact"
        ).eq("is_active", True)
        
        # Apply search
        if q:
            # Search in product name and description
            query = query.or_(f"name.ilike.%{q}%,description.ilike.%{q}%")
        
        # Apply filters
        if category_id:
            query = query.eq("category_id", category_id)
        
        if business_id:
            query = query.eq("business_id", business_id)
        
        if min_price is not None:
            query = query.gte("price", min_price)
        
        if max_price is not None:
            query = query.lte("price", max_price)
        
        # Apply sorting
        sort_direction = "asc" if sort_order == "asc" else "desc"
        query = query.order(sort_by, desc=(sort_direction == "desc"))
        
        # Apply pagination
        offset = (page - 1) * size
        query = query.range(offset, offset + size - 1)
        
        result = query.execute()
        
        total = result.count if result.count else 0
        has_next = (page * size) < total
        
        # Transform data to include business info
        products = []
        for product in result.data:
            product_data = product.copy()
            if 'businesses' in product_data:
                product_data['business'] = product_data['businesses']
                del product_data['businesses']
            products.append(ProductSearchResponse(**product_data))
        
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
            detail=f"Product search failed: {str(e)}"
        )


@router.get("/search/offers", response_model=OfferListResponse)
async def search_offers(
    q: Optional[str] = Query(None, description="Search query"),
    category_id: Optional[str] = Query(None, description="Filter by category"),
    business_id: Optional[str] = Query(None, description="Filter by business"),
    discount_type: Optional[str] = Query(None, regex="^(percentage|fixed)$", description="Discount type"),
    min_discount: Optional[float] = Query(None, ge=0, description="Minimum discount value"),
    max_discount: Optional[float] = Query(None, ge=0, description="Maximum discount value"),
    available_only: bool = Query(True, description="Only show offers with available claims"),
    sort_by: str = Query("discount_value", regex="^(discount_value|expiry_date|created_at)$", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100)
):
    """Search and filter offers with advanced options"""
    
    try:
        current_time = datetime.utcnow().isoformat()
        
        # Build query - only active offers within date range
        query = supabase.table("offers").select(
             "*, products!product_id(*, categories(*)), businesses!inner(business_name, is_verified, avatar_url)",  
            count="exact"
        ).eq("is_active", True).gte("expiry_date", current_time).lte("start_date", current_time)

        
        # Apply search
        if q:
            # Search in offer title and description
            query = query.or_(f"title.ilike.%{q}%,description.ilike.%{q}%")
        
        # Apply filters
        if category_id:
            # Filter by product category or business category
            query = query.or_(f"products.category_id.eq.{category_id},businesses.category_id.eq.{category_id}")
        
        if business_id:
            query = query.eq("business_id", business_id)
        
        if discount_type:
            query = query.eq("discount_type", discount_type)
        
        if min_discount is not None:
            query = query.gte("discount_value", min_discount)
        
        if max_discount is not None:
            query = query.lte("discount_value", max_discount)
        
        if available_only:
            # Only offers that haven't reached max claims
            query = query.or_("max_claims.is.null,current_claims.lt.max_claims")
        
        # Apply sorting
        sort_direction = "asc" if sort_order == "asc" else "desc"
        query = query.order(sort_by, desc=(sort_direction == "desc"))
        
        # Apply pagination
        offset = (page - 1) * size
        query = query.range(offset, offset + size - 1)
        
        result = query.execute()
        
        total = result.count if result.count else 0
        has_next = (page * size) < total
        
        # Transform data to include business info
        offers = []
        for offer in result.data:
            offer_data = offer.copy()
            if 'businesses' in offer_data:
                offer_data['business'] = offer_data['businesses']
                del offer_data['businesses']
            offers.append(OfferSearchResponse(**offer_data))
        
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
            detail=f"Offer search failed: {str(e)}"
        )


@router.get("/offers/trending", response_model=OfferListResponse)
async def get_trending_offers(
    limit: int = Query(10, ge=1, le=50),
    category_id: Optional[str] = None
):
    """Get trending offers based on claims"""
    
    try:
        current_time = datetime.utcnow().isoformat()
        
        # Step 1: Get offers WITHOUT trying to join products
        query = supabase.table("offers").select(
            "*, businesses!inner(business_name, is_verified, avatar_url)", 
            count="exact"
        ).eq("is_active", True).gte("expiry_date", current_time).lte("start_date", current_time)
        
        # Sort by current_claims descending to get most claimed offers
        query = query.order("current_claims", desc=True).limit(limit)
        
        result = query.execute()
        
        # Step 2: Manually fetch product data for each offer
        enriched_offers = []
        for offer in result.data:
            print(f"Processing offer {offer.get('id')} with product_id: {offer.get('product_id')}")
            
            # Get product data if product_id exists
            if offer.get('product_id'):
                try:
                    product_result = supabase.table("products").select(
                        "*, categories(*)"
                    ).eq("id", offer['product_id']).execute()
                    
                    print(f"Product query result: {product_result.data}")
                    
                    if product_result.data:
                        # Use 'products' (plural) to match your frontend
                        offer['products'] = product_result.data[0]
                        print(f"Added product data: {product_result.data[0].get('name')} with image: {product_result.data[0].get('image_url')}")
                    else:
                        offer['products'] = None
                        print(f"No product found for ID: {offer['product_id']}")
                except Exception as e:
                    print(f"Error fetching product for offer {offer.get('id')}: {e}")
                    offer['products'] = None
            else:
                offer['products'] = None
            
            enriched_offers.append(offer)
        
        # Step 3: Transform data
        offers = []
        for offer in enriched_offers:
            offer_data = offer.copy()
            if 'businesses' in offer_data:
                offer_data['business'] = offer_data['businesses']
                del offer_data['businesses']
            
            # Remove the null 'product' field and keep 'products'
            if 'product' in offer_data:
                del offer_data['product']
                
            offers.append(OfferSearchResponse(**offer_data))
        
        return OfferListResponse(
            offers=offers,
            total=len(offers),
            page=1,
            size=limit,
            has_next=False
        )
        
    except Exception as e:
        print(f"Error in get_trending_offers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get trending offers: {str(e)}"
        )

@router.get("/offers/expiring-soon", response_model=OfferListResponse)
async def get_expiring_offers(
    hours: int = Query(24, ge=1, le=168, description="Hours until expiry"),
    limit: int = Query(10, ge=1, le=50)
):
    """Get offers expiring within specified hours"""
    
    try:
        from datetime import timedelta
        
        current_time = datetime.utcnow()
        expiry_threshold = current_time + timedelta(hours=hours)
        
        # Step 1: Get offers WITHOUT product join
        query = supabase.table("offers").select(
            "*, businesses!inner(business_name, is_verified, avatar_url)"
        ).eq("is_active", True).gte("expiry_date", current_time.isoformat()).lte("expiry_date", expiry_threshold.isoformat())
        
        # Sort by expiry date ascending (most urgent first)
        query = query.order("expiry_date", desc=False).limit(limit)
        
        result = query.execute()
        
        # Step 2: Manually fetch product data
        enriched_offers = []
        for offer in result.data:
            if offer.get('product_id'):
                try:
                    product_result = supabase.table("products").select(
                        "*, categories(*)"
                    ).eq("id", offer['product_id']).execute()
                    
                    if product_result.data:
                        offer['products'] = product_result.data[0]
                    else:
                        offer['products'] = None
                except Exception as e:
                    print(f"Error fetching product for offer {offer.get('id')}: {e}")
                    offer['products'] = None
            else:
                offer['products'] = None
            
            enriched_offers.append(offer)
        
        # Step 3: Transform data
        offers = []
        for offer in enriched_offers:
            offer_data = offer.copy()
            if 'businesses' in offer_data:
                offer_data['business'] = offer_data['businesses']
                del offer_data['businesses']
            offers.append(OfferSearchResponse(**offer_data))
        
        return OfferListResponse(
            offers=offers,
            total=len(offers),
            page=1,
            size=limit,
            has_next=False
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get expiring offers: {str(e)}"
        )

# ============================================================================
# SAVED OFFERS (FAVORITES)
# ============================================================================

@router.post("/offers/{offer_id}/save", response_model=SavedOfferResponse)
async def save_offer(
    offer_id: str,
    current_user: UserProfile = Depends(get_current_active_user)
):
    """Save an offer to favorites"""
    
    try:
        # Check if offer exists and is active
        offer_check = supabase.table("offers").select(
            "*, businesses(business_name)"
        ).eq("id", offer_id).eq("is_active", True).execute()
        
        if not offer_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found or not active"
            )
        
        # Check if already saved
        existing_save = supabase.table("saved_offers").select("id").eq("user_id", str(current_user.id)).eq("offer_id", offer_id).execute()
        
        if existing_save.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Offer already saved"
            )
        
        # Save the offer
        save_data = {
            "id": str(uuid.uuid4()),
            "user_id": str(current_user.id),
            "offer_id": offer_id
        }
        
        result = supabase.table("saved_offers").insert(save_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save offer"
            )
        
        # Get saved offer with full offer details
        saved_offer = supabase.table("saved_offers").select(
            "*, offers(*, products(*, categories(*)), businesses(business_name, is_verified, avatar_url))"
        ).eq("id", result.data[0]["id"]).execute()
        
        return SavedOfferResponse(**saved_offer.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save offer: {str(e)}"
        )


@router.delete("/offers/{offer_id}/save", response_model=MessageResponse)
async def unsave_offer(
    offer_id: str,
    current_user: UserProfile = Depends(get_current_active_user)
):
    """Remove an offer from favorites"""
    
    try:
        # Delete the saved offer
        result = supabase.table("saved_offers").delete().eq("user_id", str(current_user.id)).eq("offer_id", offer_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saved offer not found"
            )
        
        return MessageResponse(message="Offer removed from favorites")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unsave offer: {str(e)}"
        )


@router.get("/saved-offers", response_model=SavedOfferListResponse)
async def get_saved_offers(
    current_user: UserProfile = Depends(get_current_active_user),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    active_only: bool = Query(True, description="Only show active offers")
):
    """Get user's saved offers"""
    
    try:
        # Build query
        query = supabase.table("offers").select(
            "*, products!product_id(*, categories(*)), businesses!inner(business_name, is_verified, avatar_url))",
            count="exact"
        ).eq("user_id", str(current_user.id))
        
        if active_only:
            current_time = datetime.utcnow().isoformat()
            query = query.eq("offers.is_active", True).gte("offers.expiry_date", current_time)
        
        # Apply pagination
        offset = (page - 1) * size
        query = query.range(offset, offset + size - 1).order("saved_at", desc=True)
        
        result = query.execute()
        
        total = result.count if result.count else 0
        has_next = (page * size) < total
        
        saved_offers = [SavedOfferResponse(**saved_offer) for saved_offer in result.data]
        
        return SavedOfferListResponse(
            saved_offers=saved_offers,
            total=total,
            page=page,
            size=size,
            has_next=has_next
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve saved offers: {str(e)}"
        )


# ============================================================================
# OFFER CLAIMING
# ============================================================================

@router.post("/offers/{offer_id}/claim", response_model=ClaimedOfferResponse)
async def claim_offer(
    offer_id: str,
    current_user: UserProfile = Depends(get_current_active_user)
):
    """Claim an offer"""
    
    try:
        current_time = datetime.utcnow()
        
        # Check if offer exists and is claimable
        offer_check = supabase.table("offers").select("*").eq("id", offer_id).eq("is_active", True).execute()
        
        if not offer_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found or not active"
            )
        
        offer = offer_check.data[0]
        
        # Check if offer is within valid date range
        start_date = datetime.fromisoformat(offer["start_date"].replace('Z', '+00:00'))
        expiry_date = datetime.fromisoformat(offer["expiry_date"].replace('Z', '+00:00'))
        
        if current_time < start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Offer has not started yet"
            )
        
        if current_time > expiry_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Offer has expired"
            )
        
        # Check if max claims reached
        if offer["max_claims"] and offer["current_claims"] >= offer["max_claims"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Offer has reached maximum claims"
            )
        
        # Check if user already claimed this offer
        existing_claim = supabase.table("claimed_offers").select("id").eq("user_id", str(current_user.id)).eq("offer_id", offer_id).execute()
        
        if existing_claim.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already claimed this offer"
            )
        
        # Claim the offer
        claim_data = {
            "id": str(uuid.uuid4()),
            "user_id": str(current_user.id),
            "offer_id": offer_id
        }
        
        result = supabase.table("claimed_offers").insert(claim_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to claim offer"
            )
        
        # Increment offer claim count
        supabase.table("offers").update({
            "current_claims": offer["current_claims"] + 1
        }).eq("id", offer_id).execute()
        
        # Get claimed offer with full details
        claimed_offer = supabase.table("claimed_offers").select(
            "*, offers(*, products(*, categories(*)), businesses(business_name, is_verified, avatar_url))"
        ).eq("id", result.data[0]["id"]).execute()
        
        return ClaimedOfferResponse(**claimed_offer.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to claim offer: {str(e)}"
        )


@router.get("/claimed-offers", response_model=ClaimedOfferListResponse)
async def get_claimed_offers(
    current_user: UserProfile = Depends(get_current_active_user),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    redeemed_only: Optional[bool] = Query(None, description="Filter by redemption status")
):
    """Get user's claimed offers"""
    
    try:
        # Build query
        query = supabase.table("claimed_offers").select(
            "*, offers(*, products(*, categories(*)), businesses(business_name, is_verified, avatar_url))",
            count="exact"
        ).eq("user_id", str(current_user.id))
        
        if redeemed_only is not None:
            query = query.eq("is_redeemed", redeemed_only)
        
        # Apply pagination
        offset = (page - 1) * size
        query = query.range(offset, offset + size - 1).order("claimed_at", desc=True)
        
        result = query.execute()
        
        total = result.count if result.count else 0
        has_next = (page * size) < total
        
        claimed_offers = [ClaimedOfferResponse(**claimed_offer) for claimed_offer in result.data]
        
        return ClaimedOfferListResponse(
            claimed_offers=claimed_offers,
            total=total,
            page=page,
            size=size,
            has_next=has_next
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve claimed offers: {str(e)}"
        )


@router.get("/offers/{offer_id}/status")
async def get_offer_status(
    offer_id: str,
    current_user: Optional[UserProfile] = Depends(get_current_user_optional)
):
    """Get offer status for current user (saved, claimed, etc.)"""
    
    try:
        # Get basic offer info
        offer_check = supabase.table("offers").select("*").eq("id", offer_id).eq("is_active", True).execute()
        
        if not offer_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        status_info = {
            "offer_id": offer_id,
            "is_available": True,
            "is_saved": False,
            "is_claimed": False,
            "can_claim": True,
            "reason": None
        }
        
        if not current_user:
            return status_info
        
        offer = offer_check.data[0]
        current_time = datetime.utcnow()
        
        # Check availability
        start_date = datetime.fromisoformat(offer["start_date"].replace('Z', '+00:00'))
        expiry_date = datetime.fromisoformat(offer["expiry_date"].replace('Z', '+00:00'))
        
        if current_time < start_date:
            status_info["can_claim"] = False
            status_info["reason"] = "Offer has not started yet"
        elif current_time > expiry_date:
            status_info["is_available"] = False
            status_info["can_claim"] = False
            status_info["reason"] = "Offer has expired"
        elif offer["max_claims"] and offer["current_claims"] >= offer["max_claims"]:
            status_info["can_claim"] = False
            status_info["reason"] = "Maximum claims reached"
        
        # Check if saved
        saved_check = supabase.table("saved_offers").select("id").eq("user_id", str(current_user.id)).eq("offer_id", offer_id).execute()
        status_info["is_saved"] = bool(saved_check.data)
        
        # Check if claimed
        claimed_check = supabase.table("claimed_offers").select("id").eq("user_id", str(current_user.id)).eq("offer_id", offer_id).execute()
        if claimed_check.data:
            status_info["is_claimed"] = True
            status_info["can_claim"] = False
            status_info["reason"] = "Already claimed"
        
        return status_info
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get offer status: {str(e)}"
        )


# ============================================================================
# BUSINESS DISCOVERY
# ============================================================================

@router.get("/businesses", response_model=ProductListResponse)
async def discover_businesses(
    category_id: Optional[str] = None,
    verified_only: bool = Query(True, description="Only show verified businesses"),
    has_active_offers: bool = Query(False, description="Only businesses with active offers"),
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100)
):
    """Discover businesses with filters"""
    
    try:
        # Build query
        query = supabase.table("businesses").select("*, categories(*)", count="exact")
        
        if verified_only:
            query = query.eq("is_verified", True)
        
        if category_id:
            query = query.eq("category_id", category_id)
        
        if search:
            query = query.ilike("business_name", f"%{search}%")
        
        if has_active_offers:
            current_time = datetime.utcnow().isoformat()
            # This would need a join - simplified for now
            query = query.eq("is_verified", True)  # Placeholder logic
        
        # Apply pagination
        offset = (page - 1) * size
        query = query.range(offset, offset + size - 1).order("business_name")
        
        result = query.execute()
        
        total = result.count if result.count else 0
        has_next = (page * size) < total
        
        businesses = [BusinessResponse(**business) for business in result.data]
        
        return {
            "businesses": businesses,
            "total": total,
            "page": page,
            "size": size,
            "has_next": has_next
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to discover businesses: {str(e)}"
        )


# In your discount_api/app/api/routes/business.py or customer.py
def format_product_response(product):
    """Format product response with proper image URL"""
    if hasattr(product, 'image_url') and product.image_url:
        # Ensure image URL is complete
        if not product.image_url.startswith('http'):
            base_url = settings.supabase_url
            product.image_url = f"{base_url}/storage/v1/object/public/product-images/{product.image_url}"
    return product

@router.get("/products/{product_id}")
async def get_product_by_id(product_id: str):
    """Get a single product by ID"""
    
    try:
        result = supabase.table("products").select(
            "*, categories(*), businesses(business_name, is_verified, avatar_url)"
        ).eq("id", product_id).eq("is_active", True).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        product = result.data[0]
        
        # Transform data to include business info
        if 'businesses' in product:
            product['business'] = product['businesses']
            del product['businesses']
            
        return {"product": product}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve product: {str(e)}"
        )