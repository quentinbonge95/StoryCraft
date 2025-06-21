from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

# Shared properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    display_name: Optional[str] = None
    theme: Optional[str] = 'light'
    is_active: Optional[bool] = True
    is_superuser: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# Properties to receive via API on creation
class UserCreate(UserBase):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    full_name: Optional[str] = None

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = Field(None, min_length=8, max_length=100)
    display_name: Optional[str] = None
    theme: Optional[str] = None

# Properties shared by models stored in DB
class UserInDBBase(UserBase):
    id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

# Additional properties to return via API
class User(UserInDBBase):
    """User schema for API responses.
    
    This includes all user fields that should be exposed via the API.
    The stories relationship is handled separately to avoid circular imports.
    """
    
    class Config:
        orm_mode = True
        json_encoders = {
            'datetime': lambda v: v.isoformat() if v else None
        }
        
    @classmethod
    def model_validate_user(cls, user_obj, stories_data=None):
        """Helper method to create a User instance with stories.
        
        This avoids the circular import issue by handling the relationship
        at runtime rather than in the type system.
        """
        user_dict = {
            'id': user_obj.id,
            'email': user_obj.email,
            'full_name': user_obj.full_name,
            'is_active': user_obj.is_active,
            'is_superuser': user_obj.is_superuser,
            'created_at': user_obj.created_at,
            'updated_at': user_obj.updated_at
        }
        return cls(**user_dict)

# Additional properties stored in DB
class UserInDB(UserInDBBase):
    hashed_password: str

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[int] = None
