from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db, check_database_health, supabase
from app.core.config import settings
from datetime import datetime

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("/")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": settings.app_name
    }

@router.get("/detailed")
async def detailed_health_check(db: AsyncSession = Depends(get_db)):
    """Detailed health check including database connectivity"""
    
    # Check database
    db_healthy = await check_database_health()
    
    # Check Supabase connection
    supabase_healthy = True
    try:
        # Simple test to check if Supabase client is working
        supabase.table("profiles").select("id").limit(1).execute()
    except Exception:
        supabase_healthy = False
    
    health_status = {
        "status": "healthy" if db_healthy and supabase_healthy else "unhealthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": settings.app_name,
        "checks": {
            "database": "healthy" if db_healthy else "unhealthy",
            "supabase": "healthy" if supabase_healthy else "unhealthy"
        }
    }
    
    if not (db_healthy and supabase_healthy):
        raise HTTPException(status_code=503, detail=health_status)
    
    return health_status

@router.get("/db")
async def database_health():
    """Database-specific health check"""
    db_healthy = await check_database_health()
    
    if not db_healthy:
        raise HTTPException(
            status_code=503, 
            detail={
                "status": "unhealthy",
                "component": "database",
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    return {
        "status": "healthy",
        "component": "database",
        "timestamp": datetime.utcnow().isoformat()
    }