# app/api/routes/categories.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from app.core.database import supabase
from app.schemas.business import CategoryCreate, CategoryResponse, MessageResponse
from app.schemas.user import UserProfile
from app.utils.dependencies import get_current_admin_user
import uuid

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("/", response_model=List[CategoryResponse])
async def list_categories():
    """List all categories (public endpoint)"""
    
    try:
        result = supabase.table("categories").select("*").order("name").execute()
        
        return [CategoryResponse(**category) for category in result.data]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve categories: {str(e)}"
        )


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: str):
    """Get a specific category by ID (public endpoint)"""
    
    try:
        result = supabase.table("categories").select("*").eq("id", category_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        
        return CategoryResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve category: {str(e)}"
        )


@router.post("/", response_model=CategoryResponse)
async def create_category(
    category_data: CategoryCreate,
    current_user: UserProfile = Depends(get_current_admin_user)
):
    """Create a new category (admin only)"""
    
    try:
        # Check if category name already exists
        existing_category = supabase.table("categories").select("id").eq("name", category_data.name).execute()
        
        if existing_category.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category with this name already exists"
            )
        
        # Create category
        category_dict = category_data.model_dump()
        category_dict["id"] = str(uuid.uuid4())
        
        result = supabase.table("categories").insert(category_dict).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create category"
            )
        
        return CategoryResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Category creation failed: {str(e)}"
        )


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    category_data: CategoryCreate,
    current_user: UserProfile = Depends(get_current_admin_user)
):
    """Update a category (admin only)"""
    
    try:
        # Check if category exists
        existing_category = supabase.table("categories").select("*").eq("id", category_id).execute()
        
        if not existing_category.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        
        # Check if new name conflicts with another category
        if category_data.name != existing_category.data[0]["name"]:
            name_conflict = supabase.table("categories").select("id").eq("name", category_data.name).execute()
            if name_conflict.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Category with this name already exists"
                )
        
        # Update category
        result = supabase.table("categories").update(category_data.model_dump()).eq("id", category_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update category"
            )
        
        return CategoryResponse(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Category update failed: {str(e)}"
        )


@router.delete("/{category_id}", response_model=MessageResponse)
async def delete_category(
    category_id: str,
    current_user: UserProfile = Depends(get_current_admin_user)
):
    """Delete a category (admin only)"""
    
    try:
        # Check if category is being used by businesses or products
        business_usage = supabase.table("businesses").select("id").eq("category_id", category_id).limit(1).execute()
        product_usage = supabase.table("products").select("id").eq("category_id", category_id).limit(1).execute()
        
        if business_usage.data or product_usage.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete category that is being used by businesses or products"
            )
        
        # Delete category
        result = supabase.table("categories").delete().eq("id", category_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        
        return MessageResponse(message="Category deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Category deletion failed: {str(e)}"
        )