from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional

from .. import models
from ..schemas.story import StoryCreate, StoryUpdate

def get_story(db: Session, story_id: int, user_id: int) -> Optional[models.Story]:
    """Get a single story by ID, ensuring it belongs to the user."""
    return db.query(models.Story).filter(
        models.Story.id == story_id,
        models.Story.owner_id == user_id
    ).first()

def get_stories(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None
) -> List[models.Story]:
    """Get multiple stories for a specific user, with optional search."""
    query = db.query(models.Story).filter(models.Story.owner_id == user_id)

    if search:
        search_filter = or_(
            models.Story.title.ilike(f"%{search}%"),
            models.Story.content.ilike(f"%{search}%"),
            models.Story.tags.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)

    return query.offset(skip).limit(limit).all()

def create_story(
    db: Session,
    story: StoryCreate,
    user_id: int
) -> models.Story:
    """Create a new story for a specific user."""
    # Create a dict from the story data, excluding unset values and owner_id
    story_data = story.model_dump(exclude_unset=True, exclude={"owner_id"})
    
    # Create the story with the user_id as owner_id
    db_story = models.Story(
        **story_data,
        owner_id=user_id
    )
    db.add(db_story)
    db.commit()
    db.refresh(db_story)
    return db_story

def update_story(
    db: Session,
    story_id: int,
    story: StoryUpdate,
    user_id: int
) -> Optional[models.Story]:
    """Update a story, ensuring it belongs to the user."""
    db_story = get_story(db, story_id=story_id, user_id=user_id)
    if db_story is None:
        return None

    update_data = story.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_story, field, value)

    db.add(db_story)
    db.commit()
    db.refresh(db_story)
    return db_story

def update_story_analysis(
    db: Session,
    story_id: int,
    analysis: str,
    user_id: int
) -> Optional[models.Story]:
    """Update a story's analysis, ensuring it belongs to the user."""
    db_story = get_story(db, story_id=story_id, user_id=user_id)
    if db_story is None:
        return None

    db_story.analysis = analysis
    db.add(db_story)
    db.commit()
    db.refresh(db_story)
    return db_story

def delete_story(db: Session, story_id: int, user_id: int) -> bool:
    """Delete a story, ensuring it belongs to the user."""
    db_story = get_story(db, story_id=story_id, user_id=user_id)
    if db_story is None:
        return False

    db.delete(db_story)
    db.commit()
    return True
