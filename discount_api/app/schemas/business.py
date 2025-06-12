# app/schemas/business.py
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from decimal import Decimal
import uuid


# ============================================================================
# CATEGORY SCHEMAS
# ============================================================================

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    created_at: datetime


# ============================================================================
# BUSINESS SCHEMAS
# ============================================================================

class BusinessBase(BaseModel):
    business_name: str = Field(..., min_length=2, max_length=200, description="Business name")
    business_description: Optional[str] = Field(None, max_length=1000)
    business_address: Optional[str] = Field(None, max_length=500)
    phone_number: Optional[str] = Field(None, min_length=10, max_length=20)
    business_website: Optional[str] = None
    avatar_url: Optional[str] = None
    business_hours: Optional[Dict[str, Any]] = None
    category_id: Optional[uuid.UUID] = None


class BusinessCreate(BusinessBase):
    @field_validator('business_website')
    @classmethod
    def validate_website(cls, v):
        if v and not v.startswith(('http://', 'https://')):
            raise ValueError('Website must start with http:// or https://')
        return v


class BusinessUpdate(BaseModel):
    business_name: Optional[str] = Field(None, min_length=2, max_length=200)
    business_description: Optional[str] = Field(None, max_length=1000)
    business_address: Optional[str] = Field(None, max_length=500)
    phone_number: Optional[str] = Field(None, min_length=10, max_length=20)
    business_website: Optional[str] = None
    avatar_url: Optional[str] = None
    business_hours: Optional[Dict[str, Any]] = None
    category_id: Optional[uuid.UUID] = None

    @field_validator('business_website')
    @classmethod
    def validate_website(cls, v):
        if v and not v.startswith(('http://', 'https://')):
            raise ValueError('Website must start with http:// or https://')
        return v


class BusinessResponse(BusinessBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    user_id: uuid.UUID
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None


# ============================================================================
# PRODUCT SCHEMAS
# ============================================================================

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    price: Optional[float] = Field(None, ge=0)  # Changed from Decimal to float
    image_url: Optional[str] = None
    category_id: Optional[uuid.UUID] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    price: Optional[float] = Field(None, ge=0)  # Changed from Decimal to float
    image_url: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    business_id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None
    
    @field_validator('price', mode='before')
    @classmethod
    def convert_decimal_to_float(cls, v):
        """Convert Decimal to float for JSON serialization"""
        if isinstance(v, Decimal):
            return float(v)
        return v


# ============================================================================
# OFFER SCHEMAS
# ============================================================================

class OfferBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    discount_type: str = Field(..., pattern="^(percentage|fixed)$")
    discount_value: float = Field(..., gt=0)  # Changed from Decimal to float
    original_price: Optional[float] = Field(None, ge=0)  # Changed from Decimal to float
    discounted_price: Optional[float] = Field(None, ge=0)  # Changed from Decimal to float
    start_date: datetime
    expiry_date: datetime
    max_claims: Optional[int] = Field(None, gt=0)
    terms_conditions: Optional[str] = Field(None, max_length=2000)
    product_id: Optional[uuid.UUID] = None

    @field_validator('discount_value')
    @classmethod
    def validate_discount_value(cls, v, info):
        if info.data.get('discount_type') == 'percentage' and v > 100:
            raise ValueError('Percentage discount cannot exceed 100%')
        return v

    @field_validator('expiry_date')
    @classmethod
    def validate_dates(cls, v, info):
        if 'start_date' in info.data and v <= info.data['start_date']:
            raise ValueError('Expiry date must be after start date')
        return v

    @field_validator('discounted_price')
    @classmethod
    def validate_discounted_price(cls, v, info):
        original_price = info.data.get('original_price')
        if v is not None and original_price is not None and v >= original_price:
            raise ValueError('Discounted price must be less than original price')
        return v


class OfferCreate(OfferBase):
    pass


class OfferUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    discount_type: Optional[str] = Field(None, pattern="^(percentage|fixed)$")
    discount_value: Optional[float] = Field(None, gt=0)  # Changed from Decimal to float
    original_price: Optional[float] = Field(None, ge=0)  # Changed from Decimal to float
    discounted_price: Optional[float] = Field(None, ge=0)  # Changed from Decimal to float
    start_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    max_claims: Optional[int] = Field(None, gt=0)
    terms_conditions: Optional[str] = Field(None, max_length=2000)
    product_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None


class OfferResponse(OfferBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    business_id: uuid.UUID
    current_claims: int
    is_active: bool
    created_at: datetime
    product: Optional[ProductResponse] = None
    
    @field_validator('discount_value', 'original_price', 'discounted_price', mode='before')
    @classmethod
    def convert_decimal_to_float(cls, v):
        """Convert Decimal to float for JSON serialization"""
        if isinstance(v, Decimal):
            return float(v)
        return v


# ============================================================================
# LIST RESPONSES
# ============================================================================

class BusinessListResponse(BaseModel):
    businesses: List[BusinessResponse]
    total: int
    page: int
    size: int
    has_next: bool


class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    total: int
    page: int
    size: int
    has_next: bool


class OfferListResponse(BaseModel):
    offers: List[OfferResponse]
    total: int
    page: int
    size: int
    has_next: bool


# ============================================================================
# BUSINESS USER REGISTRATION
# ============================================================================

class BusinessUserRegistration(BaseModel):
    """Combined user + business registration"""
    # User fields
    email: str = Field(..., description="User email")
    password: str = Field(..., min_length=6, description="User password")
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    
    # Business fields
    business_name: str = Field(..., min_length=2, max_length=200)
    business_description: Optional[str] = Field(None, max_length=1000)
    business_address: Optional[str] = Field(None, max_length=500)
    business_phone: Optional[str] = Field(None, min_length=10, max_length=20)
    business_website: Optional[str] = None
    avatar_url: Optional[str] = None
    business_hours: Optional[Dict[str, Any]] = None
    category_id: Optional[uuid.UUID] = None

    @field_validator('business_website')
    @classmethod
    def validate_website(cls, v):
        if v and not v.startswith(('http://', 'https://')):
            raise ValueError('Website must start with http:// or https://')
        return v


# ============================================================================
# GENERIC RESPONSES
# ============================================================================

class MessageResponse(BaseModel):
    message: str
    success: bool = True


# Add these schemas to your existing discount_api/app/schemas/business.py file

# ============================================================================
# REDEMPTION SCHEMAS
# ============================================================================

class ClaimVerificationRequest(BaseModel):
    """Request to verify a claim for redemption"""
    claim_identifier: str = Field(..., min_length=1, description="Claim ID or QR code content")
    verification_type: str = Field("claim_id", pattern="^(claim_id|qr_code)$", description="Type of identifier")


class CustomerInfo(BaseModel):
    """Customer information for redemption"""
    name: str
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class DiscountInfo(BaseModel):
    """Discount information for display"""
    discount_type: str
    discount_value: float
    discount_text: str
    original_price: Optional[float] = None
    discounted_price: Optional[float] = None
    savings_amount: float


class ClaimDetails(BaseModel):
    """Detailed information about a claim"""
    id: uuid.UUID
    claim_id: str
    claim_type: str
    claimed_at: datetime
    customer: CustomerInfo
    offer: Dict[str, Any]  # Simplified offer info
    discount_info: DiscountInfo


class ClaimVerificationResponse(BaseModel):
    """Response for claim verification"""
    is_valid: bool
    claim_id: Optional[str] = None
    claim_details: Optional[ClaimDetails] = None
    error_message: Optional[str] = None
    error_code: Optional[str] = None
    redeemed_at: Optional[datetime] = None
    redemption_notes: Optional[str] = None


class RedemptionRequest(BaseModel):
    """Request to complete a redemption"""
    claim_id: str = Field(..., min_length=1)
    redemption_notes: Optional[str] = Field(None, max_length=500)


class RedemptionDetails(BaseModel):
    """Details about a completed redemption"""
    claim_id: str
    redeemed_at: datetime
    customer_name: str
    customer_email: Optional[str] = None
    offer_title: str
    business_name: str
    redemption_notes: Optional[str] = None


class RedemptionResponse(BaseModel):
    """Response for redemption completion"""
    success: bool
    message: str
    redemption_details: Optional[RedemptionDetails] = None
    error_code: Optional[str] = None


class RedemptionHistoryItem(BaseModel):
    """Single item in redemption history"""
    id: uuid.UUID
    claim_id: Optional[str] = None
    claim_type: str
    customer: CustomerInfo
    offer: Dict[str, Any]
    claimed_at: datetime
    is_redeemed: bool
    redeemed_at: Optional[datetime] = None
    redemption_notes: Optional[str] = None


class RedemptionSummary(BaseModel):
    """Summary statistics for redemptions"""
    total_claims: int
    redeemed_claims: int
    pending_claims: int
    total_savings_provided: float
    redemption_rate: float


class RedemptionPagination(BaseModel):
    """Pagination info for redemption history"""
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool
    has_prev: bool


class RedemptionHistoryResponse(BaseModel):
    """Response for redemption history"""
    redemptions: List[RedemptionHistoryItem]
    pagination: RedemptionPagination
    summary: RedemptionSummary


class DailyRedemptionStats(BaseModel):
    """Daily statistics for chart display"""
    date: str
    claims: int
    redemptions: int


class ClaimTypeStats(BaseModel):
    """Statistics by claim type"""
    in_store: int = 0
    online: int = 0


class RedemptionStatsResponse(BaseModel):
    """Comprehensive redemption statistics"""
    period_days: int
    date_range: Dict[str, str]
    total_claims: int
    total_redemptions: int
    pending_redemptions: int
    redemption_rate: float
    total_savings_provided: float
    daily_breakdown: List[DailyRedemptionStats]
    claim_types: ClaimTypeStats


# ============================================================================
# QR CODE AND VERIFICATION SCHEMAS
# ============================================================================

class QRCodeGenerationRequest(BaseModel):
    """Request to generate QR code for a claim"""
    claim_id: str = Field(..., min_length=1)
    base_url: Optional[str] = None


class QRCodeResponse(BaseModel):
    """Response with QR code data"""
    claim_id: str
    qr_code_data_url: str
    verification_url: str
    instructions: str
    manual_entry_text: str


class ClaimStatusInfo(BaseModel):
    """Status information for a claim"""
    status: str  # active, redeemed, expired, expiring_soon
    status_text: str
    status_color: str
    action_available: bool
    is_redeemed: bool
    claimed_at: datetime
    redeemed_at: Optional[datetime] = None
    hours_since_claim: float
    time_until_expiry: Optional[float] = None
    redemption_notes: Optional[str] = None


# ============================================================================
# RECEIPT AND AUDIT SCHEMAS
# ============================================================================

class RedemptionReceipt(BaseModel):
    """Receipt data for a redemption"""
    receipt_id: str
    redemption_date: datetime
    business: Dict[str, Any]
    customer: CustomerInfo
    offer: Dict[str, Any]
    discount: DiscountInfo
    claim: Dict[str, Any]
    generated_at: datetime


class RedemptionAuditLog(BaseModel):
    """Audit log entry for redemption tracking"""
    id: uuid.UUID
    action: str  # verify, redeem, error
    claim_id: str
    business_id: uuid.UUID
    user_id: uuid.UUID  # Business user who performed action
    details: Dict[str, Any]
    timestamp: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


# ============================================================================
# BULK OPERATIONS SCHEMAS (Future Use)
# ============================================================================

class BulkRedemptionRequest(BaseModel):
    """Request for bulk redemption operations"""
    claim_ids: List[str] = Field(..., min_items=1, max_items=50)
    redemption_notes: Optional[str] = None


class BulkRedemptionResult(BaseModel):
    """Result for a single claim in bulk operation"""
    claim_id: str
    success: bool
    message: str
    error_code: Optional[str] = None


class BulkRedemptionResponse(BaseModel):
    """Response for bulk redemption operations"""
    total_processed: int
    successful_redemptions: int
    failed_redemptions: int
    results: List[BulkRedemptionResult]


# ============================================================================
# ERROR RESPONSE SCHEMAS
# ============================================================================

class RedemptionErrorResponse(BaseModel):
    """Standardized error response for redemption operations"""
    error: bool = True
    error_code: str
    error_message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.now)
    request_id: Optional[str] = None


# ============================================================================
# WEBHOOK SCHEMAS (Future Use)
# ============================================================================

class RedemptionWebhookPayload(BaseModel):
    """Webhook payload for redemption events"""
    event_type: str  # claim.redeemed, claim.verified, claim.expired
    event_id: uuid.UUID
    timestamp: datetime
    business_id: uuid.UUID
    claim_id: str
    offer_id: uuid.UUID
    customer_id: uuid.UUID
    data: Dict[str, Any]


# ============================================================================
# ANALYTICS SCHEMAS (Future Use)
# ============================================================================

class RedemptionTrends(BaseModel):
    """Trends analysis for redemptions"""
    period: str  # daily, weekly, monthly
    current_period: Dict[str, Any]
    previous_period: Dict[str, Any]
    growth_rate: float
    trend_direction: str  # up, down, stable


class PopularOffers(BaseModel):
    """Most popular offers by redemption"""
    offer_id: uuid.UUID
    offer_title: str
    total_claims: int
    total_redemptions: int
    redemption_rate: float
    rank: int


class CustomerSegments(BaseModel):
    """Customer segments based on redemption behavior"""
    segment_name: str
    customer_count: int
    avg_redemptions_per_customer: float
    total_savings_provided: float
    characteristics: List[str]