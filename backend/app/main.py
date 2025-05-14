from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas, crud, database, ai

from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/stories/", response_model=schemas.StoryOut)
def create_story(story: schemas.StoryCreate, db: Session = Depends(get_db)):
    return crud.create_story(db, story)

@app.get("/stories/", response_model=list[schemas.StoryOut])
def read_stories(db: Session = Depends(get_db)):
    return crud.get_stories(db)

@app.get("/stories/{story_id}", response_model=schemas.StoryOut)
def read_story(story_id: int, db: Session = Depends(get_db)):
    db_story = crud.get_story(db, story_id)
    if db_story is None:
        raise HTTPException(status_code=404, detail="Story not found")
    return db_story

@app.put("/stories/{story_id}", response_model=schemas.StoryOut)
def update_story(story_id: int, story: schemas.StoryUpdate, db: Session = Depends(get_db)):
    db_story = crud.update_story(db, story_id, story)
    if db_story is None:
        raise HTTPException(status_code=404, detail="Story not found")
    return db_story

@app.delete("/stories/{story_id}")
def delete_story(story_id: int, db: Session = Depends(get_db)):
    crud.delete_story(db, story_id)
    return {"detail": "Story deleted"}

@app.post("/stories/{story_id}/analyze")
def analyze(story_id: int, db: Session = Depends(get_db)):
    story = crud.get_story(db, story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    result = ai.analyze_story(story.content)
    return {"analysis": result}
