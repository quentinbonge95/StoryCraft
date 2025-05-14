from sqlalchemy.orm import Session
from . import models, schemas

def create_story(db: Session, story: schemas.StoryCreate):
    db_s = models.Story(**story.dict())
    db.add(db_s)
    db.commit()
    db.refresh(db_s)
    return db_s

def get_stories(db: Session):
    return db.query(models.Story).all()

def get_story(db: Session, story_id: int):
    return db.query(models.Story).filter(models.Story.id == story_id).first()

def update_story(db: Session, story_id: int, story: schemas.StoryUpdate):
    db_s = get_story(db, story_id)
    if not db_s:
        return None
    for k, v in story.dict().items():
        setattr(db_s, k, v)
    db.commit()
    db.refresh(db_s)
    return db_s

def delete_story(db: Session, story_id: int):
    db_s = get_story(db, story_id)
    if db_s:
        db.delete(db_s)
        db.commit()
    return db_s
