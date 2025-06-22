from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from typing import Optional

from .. import models, schemas
from ..core import security

# Password hashing
pwd_context = security.pwd_context

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> list[models.User]:
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate) -> Optional[models.User]:
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(db_user)
    try:
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError:
        db.rollback()
        return None

def update_user(
    db: Session, 
    user_id: int, 
    user_update: schemas.UserUpdate
) -> Optional[models.User]:
    """Update a user's information.
    
    Args:
        db: Database session
        user_id: ID of the user to update
        user_update: UserUpdate schema with fields to update
        
    Returns:
        Updated user object if successful, None if user not found
    """
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    # Convert the update data to a dictionary, excluding unset fields
    update_data = user_update.model_dump(exclude_unset=True)
    
    # Handle password update if provided
    if "password" in update_data and update_data["password"]:
        hashed_password = get_password_hash(update_data["password"])
        del update_data["password"]
        update_data["hashed_password"] = hashed_password
    
    # Update only the fields that were provided in the update data
    for field, value in update_data.items():
        if hasattr(db_user, field):
            setattr(db_user, field, value)
    
    # Always update the updated_at timestamp
    db_user.updated_at = datetime.utcnow()
    
    # Commit the changes to the database
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str) -> Optional[models.User]:
    user = get_user_by_email(db, email=email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
