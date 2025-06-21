from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .... import models, schemas
from ....crud import story as crud_story
from ....services.ai_service import analyze_story_with_ai
from ....database import get_db
from ....core import security

router = APIRouter()

@router.post("/", response_model=schemas.Story, status_code=status.HTTP_201_CREATED)
async def create_story(
    story: schemas.StoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_active_user),
):
    """
    Create a new story for the current user.
    """
    return crud_story.create_story(db=db, story=story, user_id=current_user.id)

@router.get("/", response_model=List[schemas.Story])
async def read_stories(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    sort_by: Optional[str] = 'newest',
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_active_user),
):
    """
    Retrieve stories for the current user, with optional search.
    """
    return crud_story.get_stories(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        search=search,
        sort_by=sort_by,
        status=status,
        date_from=date_from,
        date_to=date_to
    )

@router.get("/{story_id}", response_model=schemas.Story)
async def read_story(
    story_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_active_user),
):
    """
    Get a specific story by id.
    """
    db_story = crud_story.get_story(db, story_id=story_id, user_id=current_user.id)
    if db_story is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found"
        )
    return db_story

@router.put("/{story_id}", response_model=schemas.Story)
async def update_story(
    story_id: int,
    story: schemas.StoryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_active_user),
):
    """
    Update a story.
    """
    db_story = crud_story.update_story(
        db=db,
        story_id=story_id,
        story=story,
        user_id=current_user.id
    )
    if db_story is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found"
        )
    return db_story

@router.delete("/{story_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_story(
    story_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_active_user),
):
    """
    Delete a story.
    """
    db_story = crud_story.delete_story(
        db=db,
        story_id=story_id,
        user_id=current_user.id
    )
    if db_story is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found"
        )
    return None

@router.post("/{story_id}/analyze", response_model=schemas.Story)
async def analyze_story(
    story_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_active_user),
):
    """
    Analyze a story and return insights.
    """
    # First get the story to ensure it exists and user has access
    db_story = crud_story.get_story(
        db=db,
        story_id=story_id,
        user_id=current_user.id
    )
    if db_story is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found"
        )
    
    analysis = await analyze_story_with_ai(story_content=db_story.content, user=current_user, db=db)
    
    if "error" in analysis:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=analysis["error"]
        )
    
    # Update the story with the analysis
    db_story = crud_story.update_story_analysis(
        db=db,
        story_id=story_id,
        analysis=str(analysis),  # Store as string in the database
        user_id=current_user.id
    )
    
    if db_story is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update story with analysis"
        )
    
    return db_story
