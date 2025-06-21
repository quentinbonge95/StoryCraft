from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from .... import models, schemas
from ....crud import ai_model as crud_ai_model
from ....database import get_db
from ....core.security import get_current_active_user, decrypt_api_key
from ....services.ai_service import list_available_models

router = APIRouter()

@router.get("/", response_model=schemas.AIModel)
async def read_ai_model(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Get the current user's AI model settings.
    """
    db_ai_model = crud_ai_model.get_ai_model(db, user_id=current_user.id)
    if db_ai_model is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AI model settings not found")
    
    # The response_model will handle serialization, including omitting the api_key
    return db_ai_model

@router.put("/", response_model=schemas.AIModel)
async def create_or_update_ai_model(
    ai_model: schemas.AIModelCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Create or update the current user's AI model settings.
    """
    return crud_ai_model.create_or_update_ai_model(db=db, ai_model=ai_model, user_id=current_user.id)


@router.get("/available-models", response_model=List[Dict[str, Any]])
async def get_available_models(
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Get a list of available Ollama models.
    """
    models = await list_available_models()
    
    # If there's an error in the first item, return an error response
    if models and "error" in models[0]:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=models[0]["error"]
        )
    
    return models
