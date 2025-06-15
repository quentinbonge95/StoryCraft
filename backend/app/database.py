import logging
from typing import Generator, Optional

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings

logger = logging.getLogger(__name__)

# Create the SQLAlchemy engine with connection pooling
engine = create_engine(
    str(settings.SQLALCHEMY_DATABASE_URI),
    pool_pre_ping=True,  # Enable connection health checks
    pool_size=5,  # Maximum number of connections to keep open
    max_overflow=10,  # Maximum number of connections to create beyond pool_size
    pool_timeout=30,  # Seconds to wait before giving up on getting a connection
    pool_recycle=3600,  # Recycle connections after 1 hour
    echo=settings.DEBUG,  # Enable SQL query logging in debug mode
)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,  # Prevent attribute access after commit
)

# Base class for all models
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """Dependency for getting a database session.
    
    Yields:
        Session: A database session
        
    Raises:
        HTTPException: If there's an error connecting to the database
    """
    db: Optional[Session] = None
    try:
        db = SessionLocal()
        yield db
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        if db:
            db.rollback()
        raise
    finally:
        if db:
            db.close()

# Create database tables
def init_db() -> None:
    """Initialize the database by creating all tables."""
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created")

# Export the database URL for Alembic
__all__ = ["SQLALCHEMY_DATABASE_URI", "SessionLocal", "Base", "engine", "get_db", "init_db"]
