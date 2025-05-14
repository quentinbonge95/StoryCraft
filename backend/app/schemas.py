from pydantic import BaseModel
from typing import Optional

class StoryCreate(BaseModel):
    title: str
    date: str
    content: str
    tags: Optional[str] = ""
    emotional_impact: Optional[str] = "medium"

class StoryUpdate(StoryCreate):
    pass

class StoryOut(StoryCreate):
    id: int

    class Config:
        orm_mode = True
