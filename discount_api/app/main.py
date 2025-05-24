# app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from decouple import config
import logging

from app.database import init_db
from app.routers import auth
# We'll add other routers as we create them
# from app.routers import businesses, products, offers, users, categories

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Discount Offers API",
    description="API for managing business discount offers and customer interactions",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware configuration
frontend_url = config("FRONTEND_URL", default="http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    logger.info("🚀 Starting Discount Offers API...")
    db_connected = await init_db()
    if not db_connected:
        logger.error("❌ Failed to connect to database")
        raise RuntimeError("Database connection failed")
    logger.info("✅ API startup completed successfully")

# Include routers (start with auth, add others as we create them)
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
# app.include_router(users.router, prefix="/api/users", tags=["Users"])
# app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
# app.include_router(businesses.router, prefix="/api/businesses", tags=["Businesses"])
# app.include_router(products.router, prefix="/api/products", tags=["Products"])
# app.include_router(offers.router, prefix="/api/offers", tags=["Offers"])

# Root endpoints
@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "Discount Offers API is running!",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "healthy"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Quick database check
        from app.database import get_supabase
        supabase = get_supabase()
        response = supabase.table("categories").select("id").limit(1).execute()
        
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": "2025-01-01T00:00:00Z"  # You can add actual timestamp
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unavailable")

# Add error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Global exception: {exc}")
    return HTTPException(
        status_code=500,
        detail="Internal server error"
    )