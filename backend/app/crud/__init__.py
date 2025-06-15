from .user import get_user, get_user_by_email, get_users, create_user, update_user
from .story import create_story, get_stories, get_story, update_story, delete_story, update_story_analysis

# Re-export all CRUD operations for backward compatibility
__all__ = [
    # User operations
    'get_user',
    'get_user_by_email',
    'get_users',
    'create_user',
    'update_user',
    
    # Story operations
    'create_story',
    'get_stories',
    'get_story',
    'update_story',
    'delete_story',
    'update_story_analysis',
]
