# app/schemas/customer.py
from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
import uuid

from app.schemas.business import (
    ProductResponse, OfferResponse, BusinessResponse, CategoryResponse
)

# ============================================================================
# ENHANCED SEARCH RESPONSES
# ============================================================================

class BusinessSummary(BaseModel):
    """Simplified business info for search results"""
    business_name: str
    is_verified: bool
    avatar_url: Optional[str] = None


class ProductSearchResponse(ProductResponse):
    """Product response with business info for search"""
    business: Optional[BusinessSummary] = None


class OfferSearchResponse(OfferResponse):
    """Offer response with business info for search"""
    business: Optional[BusinessSummary] = None


# ============================================================================
# SAVED OFFERS SCHEMAS
# ============================================================================

class SavedOfferBase(BaseModel):
    user_id: uuid.UUID
    offer_id: uuid.UUID
    saved_at: datetime


class SavedOfferResponse(SavedOfferBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    offers: OfferResponse  # Full offer details


class SavedOfferListResponse(BaseModel):
    saved_offers: List[SavedOfferResponse]
    total: int
    page: int
    size: int
    has_next: bool


# ============================================================================
# CLAIMED OFFERS SCHEMAS
# ============================================================================

class ClaimedOfferBase(BaseModel):
    user_id: uuid.UUID
    offer_id: uuid.UUID
    claimed_at: datetime
    is_redeemed: bool = False
    redeemed_at: Optional[datetime] = None
    redemption_notes: Optional[str] = None


class ClaimedOfferResponse(ClaimedOfferBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    offers: OfferResponse  # Full offer details


class ClaimedOfferListResponse(BaseModel):
    claimed_offers: List[ClaimedOfferResponse]
    total: int
    page: int
    size: int
    has_next: bool


# ============================================================================
# OFFER STATUS SCHEMA
# ============================================================================

class OfferStatus(BaseModel):
    offer_id: str
    is_available: bool
    is_saved: bool
    is_claimed: bool
    can_claim: bool
    reason: Optional[str] = None


# ============================================================================
# SEARCH FILTERS SCHEMA
# ============================================================================

class ProductFilter(BaseModel):
    category_id: Optional[str] = None
    business_id: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    search_query: Optional[str] = None


class OfferFilter(BaseModel):
    category_id: Optional[str] = None
    business_id: Optional[str] = None
    discount_type: Optional[str] = None
    min_discount: Optional[float] = None
    max_discount: Optional[float] = None
    search_query: Optional[str] = None


# ============================================================================
# ANALYTICS/STATS SCHEMAS (Future Use)
# ============================================================================

class CustomerStats(BaseModel):
    """Customer activity statistics"""
    total_saved_offers: int
    total_claimed_offers: int
    total_redeemed_offers: int
    total_savings: Decimal
    favorite_categories: List[str]
    recent_activity_count: int


class OfferStats(BaseModel):
    """Offer popularity statistics"""
    total_views: int = 0
    total_saves: int = 0
    total_claims: int = 0
    save_to_claim_ratio: float = 0.0
    popularity_score: float = 0.0


# ============================================================================
# RECOMMENDATION SCHEMAS (Future Use)
# ============================================================================

class RecommendationReason(BaseModel):
    type: str  # "category_preference", "business_preference", "similar_users", etc.
    description: str
    confidence_score: float


class RecommendedOffer(BaseModel):
    offer: OfferResponse
    reasons: List[RecommendationReason]
    relevance_score: float


class RecommendationResponse(BaseModel):
    recommended_offers: List[RecommendedOffer]
    total: int
    recommendation_type: str  # "personalized", "trending", "category_based", etc.


# ============================================================================
# DISCOVERY SCHEMAS
# ============================================================================

class TrendingOffer(BaseModel):
    """Trending offer with popularity metrics"""
    offer: OfferResponse
    claim_count: int
    trend_score: float
    days_active: int


class ExpiringOffer(BaseModel):
    """Offer expiring soon with urgency info"""
    offer: OfferResponse
    hours_remaining: float
    urgency_level: str  # "low", "medium", "high", "critical"


class NearbyBusiness(BaseModel):
    """Business with location context"""
    business: BusinessResponse
    distance_km: Optional[float] = None
    estimated_travel_time: Optional[str] = None


# ============================================================================
# USER PREFERENCES SCHEMAS (Future Use)
# ============================================================================

class CategoryPreference(BaseModel):
    category_id: uuid.UUID
    category_name: str
    preference_score: float  # 0.0 to 1.0
    interaction_count: int


class UserPreferences(BaseModel):
    user_id: uuid.UUID
    preferred_categories: List[CategoryPreference]
    preferred_discount_types: List[str]
    min_discount_threshold: float
    max_travel_distance: Optional[float] = None
    notification_preferences: Dict[str, bool] = {}
    updated_at: datetime


# ============================================================================
# NOTIFICATION SCHEMAS (Future Use)
# ============================================================================

class NotificationSettings(BaseModel):
    new_offers_in_categories: bool = True
    offers_expiring_soon: bool = True
    price_drops: bool = True
    nearby_businesses: bool = False
    weekly_digest: bool = True


class Notification(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    type: str  # "new_offer", "expiring_soon", "price_drop", etc.
    title: str
    message: str
    data: Dict[str, Any] = {}  # Additional context data
    is_read: bool = False
    created_at: datetime


# ============================================================================
# INTERACTION TRACKING SCHEMAS (Future Use)
# ============================================================================

class OfferInteraction(BaseModel):
    """Track user interactions with offers"""
    user_id: uuid.UUID
    offer_id: uuid.UUID
    interaction_type: str  # "view", "save", "unsave", "claim", "share"
    created_at: datetime
    context: Optional[Dict[str, Any]] = None  # Search query, source page, etc.


class SearchAnalytics(BaseModel):
    """Track search behavior"""
    user_id: Optional[uuid.UUID] = None  # None for anonymous users
    search_query: str
    filters_applied: Dict[str, Any]
    results_count: int
    clicked_results: List[str] = []  # IDs of offers/products clicked
    search_session_id: str
    created_at: datetime