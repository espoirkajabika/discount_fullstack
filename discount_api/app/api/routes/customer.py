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
    OfferSearchResponse, ProductSearchResponse,
    ClaimOfferRequest, ClaimInfo,  # Add these new imports
    EnhancedClaimedOfferResponse, QRCodeResponse  # Add these new imports
)
from app.schemas.user import UserProfile
from app.utils.dependencies import get_current_active_user, get_current_user_optional
import uuid
from datetime import datetime, timezone
from app.core.database import supabase, supabase_admin


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

@router.post("/offers/{offer_id}/claim", response_model=dict)
async def claim_offer(
    offer_id: str,
    claim_data: ClaimOfferRequest,
    current_user: UserProfile = Depends(get_current_active_user)
):
    """Enhanced claim offer with support for online and in-store claims"""
    
    try:
        # Use timezone-aware datetime for consistent comparisons
        current_time = datetime.now(timezone.utc)
        
        print(f"Processing claim for user: {current_user.id}, offer: {offer_id}")
        print(f"Claim type: {claim_data.claim_type}")
        
        # Check if offer exists and is claimable
        offer_check = supabase.table("offers").select("*").eq("id", offer_id).eq("is_active", True).execute()
        
        if not offer_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found or not active"
            )
        
        offer = offer_check.data[0]
        print(f"Found offer: {offer.get('title', 'No title')}")
        
        # Parse dates from database - handle both formats
        try:
            start_date_str = offer["start_date"]
            expiry_date_str = offer["expiry_date"]
            
            # Remove 'Z' and add proper timezone info if needed
            if start_date_str.endswith('Z'):
                start_date_str = start_date_str[:-1] + '+00:00'
            if expiry_date_str.endswith('Z'):
                expiry_date_str = expiry_date_str[:-1] + '+00:00'
            
            start_date = datetime.fromisoformat(start_date_str)
            expiry_date = datetime.fromisoformat(expiry_date_str)
            
            # Ensure dates are timezone-aware
            if start_date.tzinfo is None:
                start_date = start_date.replace(tzinfo=timezone.utc)
            if expiry_date.tzinfo is None:
                expiry_date = expiry_date.replace(tzinfo=timezone.utc)
                
        except (ValueError, KeyError) as e:
            print(f"Error parsing offer dates: {e}")
            print(f"Start date: {offer.get('start_date')}")
            print(f"Expiry date: {offer.get('expiry_date')}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Invalid offer date format"
            )
        
        # Check if offer is within valid date range
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
        
        # Check if user already claimed this offer (using admin client for reliability)
        existing_claim = supabase_admin.table("claimed_offers").select("id").eq("user_id", str(current_user.id)).eq("offer_id", offer_id).execute()
        
        if existing_claim.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already claimed this offer"
            )
        
        # Import claim utilities
        try:
            from app.utils.claim_utils import ensure_unique_claim_id, generate_qr_code, get_claim_display_info
        except ImportError as e:
            print(f"Import error for claim utilities: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Claim utilities not available"
            )
        
        # Generate unique claim ID for all claims (using admin client for checking)
        unique_claim_id = ensure_unique_claim_id(supabase_admin)
        print(f"Generated unique claim ID: {unique_claim_id}")
        
        # Prepare claim data based on claim type
        claim_record = {
            "id": str(uuid.uuid4()),
            "user_id": str(current_user.id),
            "offer_id": offer_id,
            "claim_type": claim_data.claim_type,
            "unique_claim_id": unique_claim_id,
            "claimed_at": current_time.isoformat()
        }
        
        print(f"Prepared claim record: {claim_record}")
        
        # Generate QR code and verification URL for in-store claims
        qr_code_data_url = None
        verification_url = None
        
        if claim_data.claim_type == "in_store":
            try:
                qr_code_data_url, verification_url = generate_qr_code(unique_claim_id)
                claim_record["qr_code_url"] = qr_code_data_url
                print(f"Generated QR code and verification URL")
            except Exception as e:
                print(f"QR code generation failed: {e}")
                # Continue without QR code - user can still use manual claim ID
                claim_record["qr_code_url"] = None
        
        elif claim_data.claim_type == "online":
            # For online claims, use the provided redirect URL or the offer's business website
            redirect_url = getattr(claim_data, 'redirect_url', None)
            if not redirect_url:
                # Get business website from the offer's business
                business_check = supabase_admin.table("businesses").select("business_website").eq("id", offer["business_id"]).execute()
                if business_check.data and business_check.data[0]["business_website"]:
                    redirect_url = business_check.data[0]["business_website"]
                else:
                    # Default dead link as mentioned
                    redirect_url = "https://merchant-website-placeholder.com"
            
            claim_record["merchant_redirect_url"] = redirect_url
            print(f"Set redirect URL: {redirect_url}")
        
        # Insert the claim record using ADMIN CLIENT to bypass RLS
        print("Inserting claim record using admin client...")
        result = supabase_admin.table("claimed_offers").insert(claim_record).execute()
        
        if not result.data:
            print("Failed to insert claim record")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to claim offer"
            )
        
        print(f"Successfully inserted claim: {result.data[0]['id']}")
        
        # Increment offer claim count using admin client
        update_result = supabase_admin.table("offers").update({
            "current_claims": offer["current_claims"] + 1
        }).eq("id", offer_id).execute()
        
        print(f"Updated offer claim count: {update_result.data}")
        
        # Get claimed offer with full details using admin client
        claimed_offer_result = supabase_admin.table("claimed_offers").select(
            "*, offers(*, products(*, categories(*)), businesses(business_name, is_verified, avatar_url))"
        ).eq("id", result.data[0]["id"]).execute()
        
        if not claimed_offer_result.data:
            print("Failed to retrieve claimed offer details")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve claimed offer details"
            )
        
        claimed_offer_data = claimed_offer_result.data[0]
        print(f"Retrieved claimed offer data successfully")
        
        # Generate claim display information
        try:
            claim_display_info = get_claim_display_info(
                claim_data.claim_type,
                unique_claim_id,
                qr_code_data_url
            )
        except Exception as e:
            print(f"Error generating claim display info: {e}")
            claim_display_info = {
                "claim_id": unique_claim_id,
                "claim_type": claim_data.claim_type,
                "instructions": "Claim processed successfully"
            }
        
        # Prepare response based on claim type
        response_data = {
            "success": True,
            "claim_type": claim_data.claim_type,
            "claim_id": unique_claim_id,
            "claimed_at": current_time.isoformat(),
            "offer": claimed_offer_data["offers"],
            "claim_display": claim_display_info
        }
        
        # Add type-specific data
        if claim_data.claim_type == "in_store":
            response_data.update({
                "qr_code": qr_code_data_url,
                "verification_url": verification_url,
                "message": "Offer claimed successfully! Show the QR code or claim ID to the merchant for redemption."
            })
        
        elif claim_data.claim_type == "online":
            response_data.update({
                "redirect_url": claim_record["merchant_redirect_url"],
                "message": "Offer claimed successfully! You will be redirected to the merchant's website."
            })
        
        print(f"Returning successful response for claim: {unique_claim_id}")
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error claiming offer: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to claim offer: {str(e)}"
        )



# Add new endpoint to get QR code for existing claims
@router.get("/claimed-offers/{claim_id}/qr", response_model=dict)
async def get_claim_qr_code(
    claim_id: str,
    current_user: UserProfile = Depends(get_current_active_user)
):
    """Get QR code for an existing in-store claim"""
    
    try:
        # Get the claimed offer using admin client
        claimed_offer = supabase_admin.table("claimed_offers").select(
            "*, offers(title, business_id)"
        ).eq("unique_claim_id", claim_id).eq("user_id", str(current_user.id)).execute()
        
        if not claimed_offer.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Claim not found"
            )
        
        claim_data = claimed_offer.data[0]
        
        # Check if it's an in-store claim
        if claim_data.get("claim_type") != "in_store":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="QR code is only available for in-store claims"
            )
        
        # Check if already redeemed
        if claim_data.get("is_redeemed"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This claim has already been redeemed"
            )
        
        # Get or generate QR code
        qr_code_url = claim_data.get("qr_code_url")
        
        if not qr_code_url:
            # Generate QR code if it doesn't exist
            try:
                from app.utils.claim_utils import generate_qr_code
                qr_code_data_url, verification_url = generate_qr_code(claim_id)
                
                # Update the record with the generated QR code using admin client
                supabase_admin.table("claimed_offers").update({
                    "qr_code_url": qr_code_data_url
                }).eq("id", claim_data["id"]).execute()
                
                qr_code_url = qr_code_data_url
                
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to generate QR code: {str(e)}"
                )
        
        # Generate display information
        from app.utils.claim_utils import get_claim_display_info
        display_info = get_claim_display_info("in_store", claim_id, qr_code_url)
        
        return {
            "claim_id": claim_id,
            "offer_title": claim_data["offers"]["title"],
            "qr_code": qr_code_url,
            "verification_url": display_info.get("verification_url"),
            "instructions": display_info.get("instructions"),
            "manual_entry_text": display_info.get("manual_entry_text"),
            "is_redeemed": claim_data.get("is_redeemed", False),
            "claimed_at": claim_data.get("claimed_at")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve QR code: {str(e)}"
        )


@router.get("/claimed-offers", response_model=dict)
async def get_claimed_offers(
    current_user: UserProfile = Depends(get_current_active_user),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    redeemed_only: Optional[bool] = Query(None, description="Filter by redemption status"),
    claim_type: Optional[str] = Query(None, regex="^(online|in_store)$", description="Filter by claim type")
):
    """Get user's claimed offers with enhanced claim information"""
    
    try:
        # Build query
        query = supabase.table("claimed_offers").select(
            "*, offers(*, products(*, categories(*)), businesses(business_name, is_verified, avatar_url))",
            count="exact"
        ).eq("user_id", str(current_user.id))
        
        if redeemed_only is not None:
            query = query.eq("is_redeemed", redeemed_only)
        
        if claim_type:
            query = query.eq("claim_type", claim_type)
        
        # Apply pagination
        offset = (page - 1) * size
        query = query.range(offset, offset + size - 1).order("claimed_at", desc=True)
        
        result = query.execute()
        
        total = result.count if result.count else 0
        has_next = (page * size) < total
        
        # Process claimed offers with display information
        enhanced_claimed_offers = []
        
        for claimed_offer in result.data:
            # Generate claim display info
            try:
                from app.utils.claim_utils import get_claim_display_info
                
                claim_display = get_claim_display_info(
                    claimed_offer.get("claim_type", "in_store"),
                    claimed_offer.get("unique_claim_id"),
                    claimed_offer.get("qr_code_url")
                )
                
                # Create enhanced response
                enhanced_offer = {
                    "id": claimed_offer["id"],
                    "user_id": claimed_offer["user_id"],
                    "offer_id": claimed_offer["offer_id"],
                    "claimed_at": claimed_offer["claimed_at"],
                    "is_redeemed": claimed_offer.get("is_redeemed", False),
                    "redeemed_at": claimed_offer.get("redeemed_at"),
                    "redemption_notes": claimed_offer.get("redemption_notes"),
                    "claim_type": claimed_offer.get("claim_type", "in_store"),
                    "unique_claim_id": claimed_offer.get("unique_claim_id"),
                    "qr_code_url": claimed_offer.get("qr_code_url"),
                    "merchant_redirect_url": claimed_offer.get("merchant_redirect_url"),
                    "offer": claimed_offer["offers"],
                    "claim_display": claim_display
                }
                
                enhanced_claimed_offers.append(enhanced_offer)
                
            except Exception as e:
                print(f"Error processing claimed offer {claimed_offer['id']}: {e}")
                # Include without display info if processing fails
                enhanced_claimed_offers.append(claimed_offer)
        
        return {
            "claimed_offers": enhanced_claimed_offers,
            "total": total,
            "page": page,
            "size": size,
            "has_next": has_next,
            "summary": {
                "total_claims": total,
                "in_store_claims": len([c for c in enhanced_claimed_offers if c.get("claim_type") == "in_store"]),
                "online_claims": len([c for c in enhanced_claimed_offers if c.get("claim_type") == "online"]),
                "redeemed_claims": len([c for c in enhanced_claimed_offers if c.get("is_redeemed")]),
                "pending_claims": len([c for c in enhanced_claimed_offers if not c.get("is_redeemed")])
            }
        }
        
    except Exception as e:
        print(f"Error retrieving claimed offers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve claimed offers: {str(e)}"
        )


@router.get("/offers/{offer_id}/status")
async def get_offer_status(
    offer_id: str,
    current_user: Optional[UserProfile] = Depends(get_current_user_optional)
):
    """Get offer status for current user with enhanced claim information"""
    
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
            "reason": None,
            "claimed_info": None
        }
        
        if not current_user:
            return status_info
        
        offer = offer_check.data[0]
        current_time = datetime.now(timezone.utc)
        
        # Check availability with proper timezone handling
        try:
            start_date_str = offer["start_date"]
            expiry_date_str = offer["expiry_date"]
            
            # Remove 'Z' and add proper timezone info if needed
            if start_date_str.endswith('Z'):
                start_date_str = start_date_str[:-1] + '+00:00'
            if expiry_date_str.endswith('Z'):
                expiry_date_str = expiry_date_str[:-1] + '+00:00'
            
            start_date = datetime.fromisoformat(start_date_str)
            expiry_date = datetime.fromisoformat(expiry_date_str)
            
            # Ensure dates are timezone-aware
            if start_date.tzinfo is None:
                start_date = start_date.replace(tzinfo=timezone.utc)
            if expiry_date.tzinfo is None:
                expiry_date = expiry_date.replace(tzinfo=timezone.utc)
                
        except (ValueError, KeyError) as e:
            print(f"Error parsing offer dates in status check: {e}")
            # If date parsing fails, assume offer is available
            start_date = current_time
            expiry_date = current_time
        
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
        
        # Check if claimed and get claim info
        claimed_check = supabase.table("claimed_offers").select("*").eq("user_id", str(current_user.id)).eq("offer_id", offer_id).execute()
        if claimed_check.data:
            claim = claimed_check.data[0]
            status_info["is_claimed"] = True
            status_info["can_claim"] = False
            status_info["reason"] = "Already claimed"
            
            # Include claim display information
            try:
                from app.utils.claim_utils import get_claim_display_info
                
                claim_display = get_claim_display_info(
                    claim.get("claim_type", "in_store"),
                    claim.get("unique_claim_id"),
                    claim.get("qr_code_url")
                )
                
                status_info["claimed_info"] = claim_display
                status_info["claimed_info"]["is_redeemed"] = claim.get("is_redeemed", False)
                status_info["claimed_info"]["claimed_at"] = claim.get("claimed_at")
                
            except Exception as e:
                print(f"Error generating claim display info: {e}")
        
        return status_info
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting offer status: {e}")
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


# offers nearby
# In discount_api/app/api/routes/customer.py (or add to existing customer routes)
from fastapi import APIRouter, Query, HTTPException, status
from typing import Optional
from app.core.database import supabase_admin
from app.utils.dependencies import get_current_active_user
from app.schemas.user import UserProfile
from decimal import Decimal

router = APIRouter(prefix="/customer", tags=["Customer"])

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

@router.get("/offers/nearby", response_model=dict)
async def get_offers_nearby(
    lat: float = Query(..., description="User latitude", ge=-90, le=90),
    lng: float = Query(..., description="User longitude", ge=-180, le=180),
    radius: float = Query(10.0, description="Search radius in kilometers", gt=0, le=50),
    limit: int = Query(20, description="Maximum results", gt=0, le=100),
    category_id: Optional[str] = Query(None, description="Filter by category")
):
    """Find offers near a location"""
    try:
        print(f"Searching offers near: {lat}, {lng} within {radius}km")
        
        # Call the database function
        result = supabase_admin.rpc('get_nearby_offers', {
            'user_lat': lat,
            'user_lng': lng,
            'search_radius': radius,
            'result_limit': limit
        }).execute()
        
        offers = result.data or []
        
        # Filter by category if specified
        if category_id and offers:
            # Get businesses in this category
            category_businesses = supabase_admin.table("businesses").select("id").eq("category_id", category_id).execute()
            business_ids = [b["id"] for b in category_businesses.data] if category_businesses.data else []
            
            # Filter offers
            offers = [offer for offer in offers if offer["business_id"] in business_ids]
        
        # Convert decimals to floats for JSON serialization
        offers = convert_decimals_to_float(offers)
        
        # Add additional computed fields
        for offer in offers:
            # Calculate savings
            if offer["discount_type"] == "percentage":
                savings = (offer["original_price"] or 0) * (offer["discount_value"] or 0) / 100
                offer["savings_amount"] = round(savings, 2)
                offer["discount_text"] = f"{offer['discount_value']}% off"
            else:
                offer["savings_amount"] = offer["discount_value"] or 0
                offer["discount_text"] = f"${offer['discount_value']} off"
            
            # Calculate remaining claims
            if offer["max_claims"]:
                offer["remaining_claims"] = max(0, offer["max_claims"] - (offer["current_claims"] or 0))
                offer["claim_percentage"] = (offer["current_claims"] or 0) / offer["max_claims"] * 100
            else:
                offer["remaining_claims"] = None
                offer["claim_percentage"] = 0
            
            # Round distance
            offer["distance_km"] = round(offer["distance_km"], 2)
        
        return {
            "offers": offers,
            "search_location": {
                "latitude": lat,
                "longitude": lng
            },
            "search_radius_km": radius,
            "total_found": len(offers),
            "message": f"Found {len(offers)} offers within {radius}km"
        }
        
    except Exception as e:
        print(f"Error searching offers: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search offers: {str(e)}"
        )

@router.post("/offers/search-by-address", response_model=dict)
async def search_offers_by_address(
    search_data: dict,
    radius: float = Query(10.0, description="Search radius in kilometers", gt=0, le=50),
    limit: int = Query(20, description="Maximum results", gt=0, le=100)
):
    """Search offers by address (geocode address first)"""
    try:
        address = search_data.get("address", "").strip()
        if not address:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Address is required"
            )
        
        # Import geocoding utility (you'll need to create this)
        from app.utils.geocoding import geocode_address
        
        # Geocode the address
        location = await geocode_address(address)
        if not location:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not find location for the provided address"
            )
        
        # Search offers using the geocoded coordinates
        result = supabase_admin.rpc('get_nearby_offers', {
            'user_lat': location["latitude"],
            'user_lng': location["longitude"],
            'search_radius': radius,
            'result_limit': limit
        }).execute()
        
        offers = convert_decimals_to_float(result.data or [])
        
        return {
            "offers": offers,
            "search_address": address,
            "geocoded_location": location,
            "search_radius_km": radius,
            "total_found": len(offers),
            "message": f"Found {len(offers)} offers near {address}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error searching by address: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search by address: {str(e)}"
        )

@router.get("/offers/categories", response_model=dict)
async def get_offer_categories():
    """Get all categories that have active offers"""
    try:
        # Get categories with active offers
        result = supabase_admin.rpc('get_categories_with_offers').execute()
        
        if not result.data:
            # Fallback: get all categories
            categories_result = supabase_admin.table("categories").select("*").order("name").execute()
            categories = categories_result.data or []
        else:
            categories = result.data
        
        return {
            "categories": categories,
            "total": len(categories)
        }
        
    except Exception as e:
        print(f"Error getting categories: {e}")
        # Fallback to simple category list
        categories_result = supabase_admin.table("categories").select("*").order("name").execute()
        return {
            "categories": categories_result.data or [],
            "total": len(categories_result.data or [])
        }
    

# app/api/routes/customer.py - Updated routes for new offer types
from fastapi import APIRouter, Query, HTTPException, status, Depends
from typing import Optional, Dict, Any
from datetime import datetime

from app.core.database import supabase, supabase_admin
from app.schemas.user import UserProfile
from app.utils.dependencies import get_current_active_user
from app.utils.offer_calculations import OfferCalculator

router = APIRouter(prefix="/customer", tags=["Customer"])

@router.get("/offers/search", response_model=dict)
async def search_offers(
    q: Optional[str] = Query(None, description="Search query"),
    category_id: Optional[str] = Query(None, description="Filter by category"),
    business_id: Optional[str] = Query(None, description="Filter by business"),
    discount_type: Optional[str] = Query(None, regex="^(percentage|fixed|minimum_purchase|quantity_discount|bogo)$", description="Discount type"),
    min_discount: Optional[float] = Query(None, ge=0, description="Minimum discount value"),
    max_discount: Optional[float] = Query(None, ge=0, description="Maximum discount value"),
    available_only: bool = Query(True, description="Only show offers with available claims"),
    sort_by: str = Query("discount_value", regex="^(discount_value|expiry_date|created_at)$", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100)
):
    """Search and filter offers with support for all discount types"""
    
    try:
        current_time = datetime.utcnow().isoformat()
        
        # Build query - only active offers within date range
        query = supabase.table("offers").select(
            "*, products!product_id(*, categories(*)), businesses!inner(business_name, is_verified, avatar_url)",  
            count="exact"
        ).eq("is_active", True).gte("expiry_date", current_time).lte("start_date", current_time)

        # Apply search
        if q:
            query = query.or_(f"title.ilike.%{q}%,description.ilike.%{q}%")
        
        # Apply filters
        if category_id:
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
            # Only show offers that still have claims available
            query = query.or_("max_claims.is.null,current_claims.lt.max_claims")
        
        # Apply sorting
        desc_order = sort_order == "desc"
        query = query.order(sort_by, desc=desc_order)
        
        # Apply pagination
        offset = (page - 1) * size
        query = query.range(offset, offset + size - 1)
        
        result = query.execute()
        
        total = result.count if result.count else 0
        total_pages = (total + size - 1) // size
        
        # Process offers and add display information
        enhanced_offers = []
        for offer in result.data:
            offer_data = convert_decimals_to_float(offer)
            
            # Fix structure for frontend
            if 'products' in offer_data:
                offer_data['product'] = offer_data['products']
                del offer_data['products']
            if 'businesses' in offer_data:
                offer_data['business'] = offer_data['businesses']
                del offer_data['businesses']
            
            # Add display information
            offer_data['display_text'] = OfferCalculator.get_offer_display_text(offer_data)
            offer_data['conditions_text'] = get_offer_conditions_text(offer_data)
            
            enhanced_offers.append(offer_data)
        
        return {
            "offers": enhanced_offers,
            "pagination": {
                "page": page,
                "size": size,
                "total": total,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            },
            "filters_applied": {
                "search": q,
                "category_id": category_id,
                "business_id": business_id,
                "discount_type": discount_type,
                "min_discount": min_discount,
                "max_discount": max_discount
            }
        }
        
    except Exception as e:
        print(f"Error searching offers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search offers: {str(e)}"
        )


@router.get("/offers/{offer_id}", response_model=dict)
async def get_offer_details(
    offer_id: str,
    current_user: Optional[UserProfile] = Depends(get_current_active_user)
):
    """Get detailed offer information with calculation examples"""
    
    try:
        # Get offer with all related data
        result = supabase.table("offers").select(
            "*, products(*, categories(*)), businesses(business_name, is_verified, avatar_url, business_address)"
        ).eq("id", offer_id).eq("is_active", True).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found or inactive"
            )
        
        offer_data = convert_decimals_to_float(result.data[0])
        
        # Fix structure for frontend
        if 'products' in offer_data:
            offer_data['product'] = offer_data['products']
            del offer_data['products']
        if 'businesses' in offer_data:
            offer_data['business'] = offer_data['businesses']
            del offer_data['businesses']
        
        # Add enhanced display information
        offer_data['display_text'] = OfferCalculator.get_offer_display_text(offer_data)
        offer_data['conditions_text'] = get_offer_conditions_text(offer_data)
        
        # Add calculation examples for different quantities
        item_price = float(offer_data['product']['price']) if offer_data['product']['price'] else 0
        calculation_examples = []
        
        # Generate examples based on offer type
        if offer_data['discount_type'] in ['percentage', 'fixed']:
            quantities = [1, 2, 5]
        elif offer_data['discount_type'] == 'quantity_discount':
            min_qty = offer_data.get('minimum_quantity', 1)
            quantities = [min_qty - 1, min_qty, min_qty + 2] if min_qty > 1 else [1, 3, 5]
        elif offer_data['discount_type'] == 'bogo':
            buy_qty = offer_data.get('buy_quantity', 1)
            quantities = [buy_qty - 1, buy_qty, buy_qty * 2] if buy_qty > 1 else [1, 2, 4]
        else:
            quantities = [1, 2, 5]
        
        for qty in quantities:
            if qty > 0:
                calc_result = OfferCalculator.calculate_discount(
                    offer_data=offer_data,
                    quantity=qty,
                    cart_total=item_price * qty,  # Simple cart total for examples
                    item_price=item_price
                )
                calculation_examples.append({
                    'quantity': qty,
                    'calculation': calc_result
                })
        
        offer_data['calculation_examples'] = calculation_examples
        
        # Check if user has saved or claimed this offer
        if current_user:
            # Check if saved
            saved_check = supabase.table("saved_offers").select("id").eq("user_id", str(current_user.id)).eq("offer_id", offer_id).execute()
            offer_data['is_saved'] = len(saved_check.data) > 0
            
            # Check if claimed
            claimed_check = supabase.table("claimed_offers").select("id, is_redeemed").eq("user_id", str(current_user.id)).eq("offer_id", offer_id).execute()
            offer_data['is_claimed'] = len(claimed_check.data) > 0
            if offer_data['is_claimed']:
                offer_data['is_redeemed'] = claimed_check.data[0]['is_redeemed']
        else:
            offer_data['is_saved'] = False
            offer_data['is_claimed'] = False
            offer_data['is_redeemed'] = False
        
        # Check if offer is still available for claiming
        max_claims = offer_data.get('max_claims')
        current_claims = offer_data.get('current_claims', 0)
        offer_data['can_claim'] = max_claims is None or current_claims < max_claims
        offer_data['claims_remaining'] = None if max_claims is None else max_claims - current_claims
        
        return {"offer": offer_data}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting offer details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve offer: {str(e)}"
        )


@router.post("/offers/{offer_id}/calculate", response_model=dict)
async def calculate_customer_discount(
    offer_id: str,
    calculation_request: Dict[str, Any]
):
    """Calculate discount for a customer's specific purchase scenario"""
    
    try:
        quantity = calculation_request.get("quantity", 1)
        cart_total = calculation_request.get("cart_total")
        
        # Get offer data
        result = supabase.table("offers").select(
            "*, products(price)"
        ).eq("id", offer_id).eq("is_active", True).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found or inactive"
            )
        
        offer_data = result.data[0]
        item_price = float(offer_data["products"]["price"]) if offer_data["products"]["price"] else 0
        
        # Calculate discount
        calculation_result = OfferCalculator.calculate_discount(
            offer_data=offer_data,
            quantity=quantity,
            cart_total=cart_total,
            item_price=item_price
        )
        
        return {
            "calculation": calculation_result,
            "offer_display_text": OfferCalculator.get_offer_display_text(offer_data),
            "item_price": item_price,
            "quantity": quantity
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error calculating customer discount: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Calculation failed: {str(e)}"
        )


def get_offer_conditions_text(offer_data: Dict[str, Any]) -> Optional[str]:
    """Generate human-readable conditions text for an offer"""
    discount_type = offer_data.get('discount_type')
    conditions = []
    
    if discount_type == 'minimum_purchase':
        min_purchase = offer_data.get('minimum_purchase_amount', 0)
        conditions.append(f"Minimum purchase of ${min_purchase:.2f} required")
    
    elif discount_type == 'quantity_discount':
        min_qty = offer_data.get('minimum_quantity', 0)
        conditions.append(f"Must purchase {min_qty} or more items")
    
    elif discount_type == 'bogo':
        buy_qty = offer_data.get('buy_quantity', 1)
        conditions.append(f"Must purchase at least {buy_qty} items to qualify")
    
    # Add general conditions
    max_claims = offer_data.get('max_claims')
    if max_claims:
        current_claims = offer_data.get('current_claims', 0)
        remaining = max_claims - current_claims
        if remaining > 0:
            conditions.append(f"Limited offer - {remaining} claims remaining")
        else:
            conditions.append("Offer no longer available")
    
    # Add expiry info
    expiry_date = offer_data.get('expiry_date')
    if expiry_date:
        if isinstance(expiry_date, str):
            expiry_dt = datetime.fromisoformat(expiry_date.replace('Z', '+00:00'))
        else:
            expiry_dt = expiry_date
        
        now = datetime.utcnow()
        if expiry_dt > now:
            days_remaining = (expiry_dt - now).days
            if days_remaining == 0:
                conditions.append("Expires today")
            elif days_remaining == 1:
                conditions.append("Expires tomorrow")
            else:
                conditions.append(f"Expires in {days_remaining} days")
        else:
            conditions.append("Expired")
    
    return " • ".join(conditions) if conditions else None


def convert_decimals_to_float(data):
    """Convert Decimal fields to float in a dictionary or list"""
    from decimal import Decimal
    if isinstance(data, dict):
        return {key: convert_decimals_to_float(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_decimals_to_float(item) for item in data]
    elif isinstance(data, Decimal):
        return float(data)
    else:
        return data