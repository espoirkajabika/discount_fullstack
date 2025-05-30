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

result = supabase.table("offers").select(
    "*, products!product_id(*, categories(*)), businesses!inner(business_name, is_verified, avatar_url)"
).eq("is_active", True).limit(1).execute()

print(result.data)