from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models, schemas, crud, database, ai

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try: yield db
    finally: db.close()

@app.post("/stories/", response_model=schemas.StoryOut)
def create_story_endpoint(story: schemas.StoryCreate, db: Session = Depends(get_db)):
    return crud.create_story(db, story)

@app.get("/stories/", response_model=list[schemas.StoryOut])
def read_stories(db: Session = Depends(get_db)):
    return crud.get_stories(db)

@app.get("/stories/{story_id}", response_model=schemas.StoryOut)
def read_story(story_id: int, db: Session = Depends(get_db)):
    s = crud.get_story(db, story_id)
    if not s: raise HTTPException(404, "Not found")
    return s

@app.put("/stories/{story_id}", response_model=schemas.StoryOut)
def update_story_endpoint(story_id: int, story: schemas.StoryUpdate, db: Session = Depends(get_db)):
    s = crud.update_story(db, story_id, story)
    if not s: raise HTTPException(404, "Not found")
    return s

@app.delete("/stories/{story_id}")
def delete_story_endpoint(story_id: int, db: Session = Depends(get_db)):
    crud.delete_story(db, story_id)
    return {"detail": "deleted"}

@app.post("/stories/{story_id}/analyze")
def analyze_endpoint(story_id: int, db: Session = Depends(get_db)):
    s = crud.get_story(db, story_id)
    if not s: raise HTTPException(404, "Not found")
    return {"analysis": ai.analyze_story(s.content)}

@app.get("/prompt/")
def prompt_endpoint():
    # simple hard-coded superlative-subject for brainstorming
    superlatives = ["First", "Last", "Best", "Worst"]
    subjects     = ["vacation", "job", "mistake", "car", "goodbye"]
    import random
    return {
      "prompt": f"{random.choice(superlatives)} {random.choice(subjects)}"
    }
import random

SUPERLATIVES = ["first", "last", "best", "worst"]
SUBJECTS     = ["job", "vacation", "goodbye", "car", "girlfriend", "mistake", "watch"]

@app.get("/prompt/")
def get_prompt():
    return {
        "superlative": random.choice(SUPERLATIVES),
        "subject":     random.choice(SUBJECTS)
    }