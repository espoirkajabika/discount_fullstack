# app/schemas/business.py
from pydantic import BaseModel, Field, ConfigDict, validator
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
    @validator('business_website')
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

    @validator('business_website')
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
    price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    image_url: Optional[str] = None
    category_id: Optional[uuid.UUID] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
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


# ============================================================================
# OFFER SCHEMAS
# ============================================================================

class OfferBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    discount_type: str = Field(..., pattern="^(percentage|fixed)$")
    discount_value: Decimal = Field(..., gt=0, decimal_places=2)
    original_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    discounted_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    start_date: datetime
    expiry_date: datetime
    max_claims: Optional[int] = Field(None, gt=0)
    terms_conditions: Optional[str] = Field(None, max_length=2000)
    product_id: Optional[uuid.UUID] = None

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
    price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    image_url: Optional[str] = None
    category_id: Optional[uuid.UUID] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
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


# ============================================================================
# OFFER SCHEMAS
# ============================================================================

class OfferBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    discount_type: str = Field(..., pattern="^(percentage|fixed)$")
    discount_value: Decimal = Field(..., gt=0, decimal_places=2)
    original_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    discounted_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
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
    discount_value: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    original_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    discounted_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
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
# GENERIC RESPONSES
# ============================================================================

class MessageResponse(BaseModel):
    message: str
    success: bool = True


class OfferCreate(OfferBase):
    pass


class OfferUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    discount_type: Optional[str] = Field(None, pattern="^(percentage|fixed)$")
    discount_value: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    original_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    discounted_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
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

# Add this at the end of app/schemas/business.py, before the final comment block

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