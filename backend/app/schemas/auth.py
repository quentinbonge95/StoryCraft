from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# No circular imports needed - we'll handle the relationship in the model itself

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8)

class UserInDB(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class User(UserInDB):
    """User schema for API responses.
    
    This includes all user fields that should be exposed via the API.
    The stories relationship is handled separately to avoid circular imports.
    """
    # Removed stories field to break circular dependency
    # Stories will be added in the response model using a separate schema
    
    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            'datetime': lambda v: v.isoformat()
        }
    )
    
    @classmethod
    def model_validate_user_with_stories(cls, user_obj, stories_data=None):
        """Helper method to create a User instance with stories.
        
        This avoids the circular import issue by handling the relationship
        at runtime rather than in the type system.
        """
        user_dict = user_obj.__dict__.copy()
        if stories_data is not None:
            from .story import Story  # Local import to avoid circular import
            user_dict['stories'] = [
                Story.model_validate(story_obj) 
                for story_obj in stories_data
            ]
        return cls.model_validate(user_dict)

class UserLogin(BaseModel):
    email: EmailStr
    password: str
