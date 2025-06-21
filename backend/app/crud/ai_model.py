from __future__ import annotations

from sqlalchemy.orm import Session
from typing import Optional

from .. import models, schemas
from ..core.security import encrypt_api_key, decrypt_api_key

def get_ai_model(db: Session, user_id: int) -> Optional[models.AIModel]:
    """Get AI model settings for a specific user."""
    return db.query(models.AIModel).filter(models.AIModel.user_id == user_id).first()

def create_or_update_ai_model(
    db: Session, 
    ai_model: schemas.AIModelCreate, 
    user_id: int
) -> models.AIModel:
    """Create or update AI model settings for a user."""
    db_ai_model = get_ai_model(db, user_id=user_id)
    
    encrypted_api_key = None
    if ai_model.api_key:
        encrypted_api_key = encrypt_api_key(ai_model.api_key)

    if db_ai_model:
        # Update existing settings
        db_ai_model.provider = ai_model.provider
        db_ai_model.model_name = ai_model.model_name
        db_ai_model.api_key = encrypted_api_key
    else:
        # Create new settings
        db_ai_model = models.AIModel(
            user_id=user_id,
            provider=ai_model.provider,
            model_name=ai_model.model_name,
            api_key=encrypted_api_key
        )
        db.add(db_ai_model)
    
    db.commit()
    db.refresh(db_ai_model)
    return db_ai_model
