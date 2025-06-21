from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict

# No circular imports - we'll handle the relationship in the model itself

class StoryBase(BaseModel):
    title: str = Field(..., max_length=100)
    date: str
    content: str = Field(..., min_length=10)
    tags: Optional[str] = Field(None, max_length=200)
    emotional_impact: Optional[str] = Field("medium", max_length=20)
    analysis: Optional[str] = None
    owner_id: Optional[int] = None  # Will be set by the API, not by the user

class StoryCreate(StoryBase):
    pass

class StoryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    date: Optional[str] = None
    tags: Optional[str] = None
    emotional_impact: Optional[str] = None
    analysis: Optional[str] = None

class Story(StoryBase):
    """Story schema for API responses.
    
    Includes all story fields that should be exposed via the API.
    The owner relationship is handled separately to avoid circular imports.
    """
    id: int
    created_at: datetime
    updated_at: datetime
    owner_id: int  # Reference to owner's ID instead of User object
    
    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            'datetime': lambda v: v.isoformat()
        }
    )
    
    @classmethod
    def model_validate_story_with_owner(cls, story_obj, owner_data=None):
        """Helper method to create a Story instance with owner data.
        
        This avoids the circular import issue by handling the relationship
        at runtime rather than in the type system.
        """
        story_dict = story_obj.__dict__.copy()
        if owner_data is not None:
            from .auth import User  # Local import to avoid circular import
            story_dict['owner'] = User.model_validate(owner_data)
        return cls.model_validate(story_dict)

class StoryOut(Story):
    pass
