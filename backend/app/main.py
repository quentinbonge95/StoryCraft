import logging
import sys
from contextlib import asynccontextmanager
from typing import Any, Dict

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from sqlalchemy.orm import Session

from app import __version__
from app.api.v1.api import api_router
from app.core.config import settings
from app.database import SessionLocal, engine, init_db
from app.models import Base

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handle application startup and shutdown events.
    
    - On startup: Initialize the database and create tables
    - On shutdown: Clean up resources
    """
    # Startup: Initialize database
    logger.info("Starting up...")
    init_db()
    
    # Create first superuser if it doesn't exist
    db = SessionLocal()
    try:
        from app.crud.user import get_user_by_email, create_user
        from app.schemas.auth import UserCreate
        
        user = get_user_by_email(db, email=settings.FIRST_SUPERUSER_EMAIL)
        if not user:
            user_in = UserCreate(
                email=settings.FIRST_SUPERUSER_EMAIL,
                password=settings.FIRST_SUPERUSER_PASSWORD,
                full_name="Admin User",
                is_superuser=True,
            )
            user = create_user(db, user=user_in)
            db.commit()
            logger.info(f"Created first superuser: {user.email}")
    except Exception as e:
        logger.error(f"Error creating first superuser: {e}")
        db.rollback()
    finally:
        db.close()
    
    yield  # The application runs here
    
    # Shutdown: Clean up resources
    logger.info("Shutting down...")
    engine.dispose()

# Create FastAPI app with lifespan events
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
    StoryCraft API - A platform for writing and analyzing stories.
    
    ## Authentication
    Most endpoints require authentication. Use the `/auth/login` endpoint to get a token,
    then include it in the `Authorization` header as `Bearer <token>`.
    """,
    version=__version__,
    docs_url="/docs",  # Enable Swagger UI
    redoc_url="/redoc",  # Enable ReDoc
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Set up CORS with comprehensive local development support
# Allow all localhost variants and common development URLs
allowed_origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
    "http://0.0.0.0",
    "http://0.0.0.0:3000",
    "http://localhost:5173",  # Common Vite dev server port
    "http://127.0.0.1:5173",
]

# Add any additional origins from environment variable if set
if settings.BACKEND_CORS_ORIGINS:
    allowed_origins.extend(str(origin) for origin in settings.BACKEND_CORS_ORIGINS)

# Remove duplicates while preserving order
allowed_origins = list(dict.fromkeys(allowed_origins))

logger.info(f"Allowed CORS origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Database session dependency
def get_db():
    """Get database session.
    
    Yields:
        Session: Database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint.
    
    Returns:
        dict: Status of the API
    """
    return {"status": "ok"}
