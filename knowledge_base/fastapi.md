# SaverSpot FastAPI Project Setup

## Directory Structure
Create the following directory structure:
```
savespot-api/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Configuration settings
│   ├── database.py             # Database connection handling
│   │
│   ├── api/                    # API routes
│   │   ├── __init__.py
│   │   ├── endpoints/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py         # Authentication endpoints
│   │   │   ├── offers.py       # Offers endpoints
│   │   │   ├── businesses.py   # Business endpoints
│   │   │   ├── products.py     # Products endpoints
│   │   │   ├── categories.py   # Categories endpoints
│   │   │   └── users.py        # User endpoints
│   │   │
│   │   └── dependencies.py     # Shared API dependencies
│   │
│   ├── core/                   # Core functionality
│   │   ├── __init__.py
│   │   ├── auth.py             # Authentication logic
│   │   ├── security.py         # Security utilities
│   │   └── config.py           # Core configuration
│   │
│   ├── models/                 # Pydantic models for request/response
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── business.py
│   │   ├── offer.py
│   │   ├── product.py
│   │   └── category.py
│   │
│   └── services/               # Business logic
│       ├── __init__.py
│       ├── user_service.py
│       ├── business_service.py
│       ├── offer_service.py
│       ├── product_service.py
│       └── category_service.py
│
├── tests/                      # Test suite
├── .env                        # Environment variables (gitignored)
├── .env.example                # Example environment variables
├── requirements.txt            # Python dependencies
└── README.md                   # Project documentation
```

## Key Dependencies
Create requirements.txt with the following dependencies:

```
fastapi>=0.100.0
uvicorn>=0.22.0
pydantic>=2.1.1
pydantic-settings>=2.0.1
supabase>=1.0.3
python-jose>=3.3.0
passlib>=1.7.4
python-multipart>=0.0.6
python-dotenv>=1.0.0
httpx>=0.24.1
pytest>=7.4.0
```

## Environment Variables
Create a .env.example file with:

```
# FastAPI Settings
API_PORT=8000
DEBUG=True

# Supabase Settings
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key

# Security Settings
SECRET_KEY=your-secret-key-for-jwt
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Frontend URLs
CUSTOMER_APP_URL=http://localhost:3000
BUSINESS_APP_URL=http://localhost:3001
```

## Initial Setup Commands

```bash
# Create a new virtual environment
python -m venv venv

# Activate the virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create necessary directories
mkdir -p app/api/endpoints app/core app/models app/services tests

# Start the development server
uvicorn app.main:app --reload --port 8000
```

## Next Steps

1. Implement the config.py file based on the .env variables
2. Create database.py for Supabase connection
3. Set up authentication in the core/auth.py file
4. Implement the main.py FastAPI application
5. Begin implementing the API endpoints, starting with authentication