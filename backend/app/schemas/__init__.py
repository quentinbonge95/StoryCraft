# Export all schemas
# Import auth schemas first
from .auth import (
    Token,
    TokenData,
    TokenPayload,
    UserBase,
    UserCreate,
    UserUpdate,
    UserInDB,
    UserLogin,
    User
)

# Import AI model schemas
from .ai_model import (
    AIModelBase,
    AIModelCreate,
    AIModelUpdate,
    AIModel
)

# Then import story schemas
from .story import (
    StoryBase,
    StoryCreate,
    StoryUpdate,
    Story,
    StoryOut
)

# Define exports
__all__ = [
    # Auth schemas
    'Token',
    'TokenData',
    'UserBase',
    'UserCreate',
    'UserUpdate',
    'UserInDB',
    'UserLogin',
    'User',
    # Story schemas
    'StoryBase',
    'StoryCreate',
    'StoryUpdate',
    'Story',
    'StoryOut'
]

# After all schemas are defined, we can now set up the relationships
# This avoids circular imports by setting up the relationships at runtime
try:
    # Import the models to set up relationships
    from ..models import User as UserModel, Story as StoryModel
    
    # Set up relationship properties
    if hasattr(UserModel, 'stories'):
        UserModel.stories = UserModel.stories
    
    if hasattr(StoryModel, 'owner'):
        StoryModel.owner = StoryModel.owner
        
except ImportError:
    # This might fail during static analysis or documentation generation
    pass
