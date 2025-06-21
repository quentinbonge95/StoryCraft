from typing import List, Optional, Any, Dict, Union

from pydantic import AnyHttpUrl, EmailStr, Field, HttpUrl, PostgresDsn, validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Allow extra env vars that may be present in .env or Docker
    DATABASE_URL: Optional[str] = None
    SECURE_HSTS_SECONDS: Optional[str] = None
    SECURE_SSL_REDIRECT: Optional[str] = None
    SESSION_COOKIE_SECURE: Optional[str] = None
    CSRF_COOKIE_SECURE: Optional[str] = None
    SECURE_PROXY_SSL_HEADER: Optional[str] = None

    # Project metadata
    PROJECT_NAME: str = "StoryCraft"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Debug mode
    DEBUG: bool = Field(False, description="Enable debug mode")
    
    # Security
    SECRET_KEY: str = Field(..., min_length=32, max_length=255, description="Secret key for JWT token generation")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Server
    SERVER_NAME: str = "storycraft-api"
    SERVER_HOST: str = "http://localhost:8000"
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = ["http://localhost:3000"]
    
    # Database
    POSTGRES_SERVER: str = Field(..., description="Database server hostname or IP")
    POSTGRES_USER: str = Field(..., description="Database username")
    POSTGRES_PASSWORD: str = Field(..., description="Database password")
    POSTGRES_DB: str = Field(..., description="Database name")
    SQLALCHEMY_DATABASE_URI: Optional[PostgresDsn] = None
    
    # Email
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = None
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[EmailStr] = None
    EMAILS_FROM_NAME: Optional[str] = None
    
    # First superuser
    FIRST_SUPERUSER_EMAIL: EmailStr = Field(..., description="Email of the first superuser")
    FIRST_SUPERUSER_PASSWORD: str = Field(..., min_length=8, description="Password for the first superuser")
    
    # API Documentation
    OPENAPI_URL: Optional[str] = "/openapi.json"
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore extra env vars instead of raising validation errors
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    @validator("SQLALCHEMY_DATABASE_URI", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        if isinstance(v, str):
            return v
        
        return PostgresDsn.build(
            scheme="postgresql",
            username=values.get("POSTGRES_USER"),
            password=values.get("POSTGRES_PASSWORD"),
            host=values.get("POSTGRES_SERVER"),
            path=f"/{values.get('POSTGRES_DB') or ''}",
        )
    
    @validator("EMAILS_FROM_NAME")
    def get_project_name(cls, v: Optional[str], values: Dict[str, Any]) -> str:
        if not v:
            return values["PROJECT_NAME"]
        return v

settings = Settings()
