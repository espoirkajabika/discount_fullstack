from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import check_database_health
from app.api.routes import auth, health

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print(f"Starting {settings.app_name}...")
    
    # Check database connection
    db_healthy = await check_database_health()
    if not db_healthy:
        print("⚠️  Warning: Database connection failed")
    else:
        print("✅ Database connection successful")
    
    yield
    
    # Shutdown
    print(f"Shutting down {settings.app_name}...")

# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="API for offers and deals management platform",
    version="1.0.0",
    debug=settings.debug,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health"
    }

@app.get("/api/v1")
async def api_info():
    """API information"""
    return {
        "message": f"{settings.app_name} API v1",
        "endpoints": {
            "health": "/api/v1/health",
            "auth": "/api/v1/auth",
        },
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )