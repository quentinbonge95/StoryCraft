"""Minimal settings module for database migrations.

This module provides just enough configuration to run database migrations
without loading the full application settings.
"""

class Settings:
    # Database configuration
    SQLALCHEMY_DATABASE_URI: str
    
    # Required by SQLAlchemy but not used in migrations
    POSTGRES_SERVER: str = "db"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "storycraft"
    
    # Required by Pydantic but not used in migrations
    PROJECT_NAME: str = "StoryCraft"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False
    SECRET_KEY: str = "dummy-secret-key-for-migrations"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    FIRST_SUPERUSER_EMAIL: str = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "dummy-password"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

# Create a settings instance
settings = Settings()
