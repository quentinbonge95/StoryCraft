import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .... import models, schemas
from ....crud import user as crud_user
from ....database import get_db
from ....core import security

# Set up logging
logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=List[schemas.User])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_active_superuser),
):
    """
    Retrieve users. Only available to superusers.
    """
    users = crud_user.get_users(db, skip=skip, limit=limit)
    return users

@router.get("/me", response_model=schemas.User)
async def read_user_me(
    current_user: models.User = Depends(security.get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get current user.
    
    Returns the currently authenticated user's information.
    """
    try:
        logger.debug("Fetching data for current user")
        
        # Get fresh user data from the database
        db_user = crud_user.get_user(db, user_id=current_user.id)
        if not db_user:
            logger.warning("User not found in database")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        logger.debug("Successfully fetched user data")
        
        
        # Convert SQLAlchemy model to Pydantic model
        user_schema = schemas.User.from_orm(db_user)
        logger.info(f"User data retrieved for: {db_user.email}")
        
        return user_schema
        
    except HTTPException as http_exc:
        logger.error(f"[ERROR] /users/me - HTTP Error: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        logger.error(f"[ERROR] /users/me - Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while fetching user data: {str(e)}"
        )

@router.put("/me", response_model=schemas.User)
async def update_user_me(
    user_in: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_active_user),
):
    """
    Update own user profile and settings.
    
    - **display_name**: Optional display name for the user
    - **theme**: Preferred theme ('light' or 'dark')
    - **password**: New password (if changing)
    - **full_name**: User's full name
    """
    # Log the update attempt
    logger.info(f"Updating user {current_user.id} with data: {user_in.dict(exclude_unset=True)}")
    
    # Update the user
    user = crud_user.update_user(db, user_id=current_user.id, user_update=user_in)
    
    if not user:
        logger.error(f"Failed to update user {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not update user"
        )
        
    logger.info(f"Successfully updated user {current_user.id}")
    return user
    return user

@router.get("/{user_id}", response_model=schemas.User)
async def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_active_user),
):
    """
    Get a specific user by ID. Only available to superusers.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    user = crud_user.get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.put("/{user_id}", response_model=schemas.User)
async def update_user(
    user_id: int,
    user_in: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_active_superuser),
):
    """
    Update a user. Only available to superusers.
    """
    user = crud_user.get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    user = crud_user.update_user(db, user_id=user_id, user_update=user_in)
    return user

@router.delete("/{user_id}", response_model=schemas.User)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_active_superuser),
):
    """
    Delete a user. Only available to superusers.
    """
    user = crud_user.get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    user = crud_user.delete_user(db, user_id=user_id)
    return user
