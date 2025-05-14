from sqlalchemy.orm import Session
from app import models, schemas

def create_story(db: Session, story: schemas.StoryCreate):
    db_story = models.Story(**story.dict())
    db.add(db_story)
    db.commit()
    db.refresh(db_story)
    return db_story

def get_stories(db: Session):
    return db.query(models.Story).all()

def get_story(db: Session, story_id: int):
    return db.query(models.Story).filter(models.Story.id == story_id).first()

def update_story(db: Session, story_id: int, story: schemas.StoryUpdate):
    db_story = get_story(db, story_id)
    if db_story:
        for key, value in story.dict().items():
            setattr(db_story, key, value)
        db.commit()
        db.refresh(db_story)
    return db_story

def delete_story(db: Session, story_id: int):
    db_story = get_story(db, story_id)
    if db_story:
        db.delete(db_story)
        db.commit()
    return db_story
