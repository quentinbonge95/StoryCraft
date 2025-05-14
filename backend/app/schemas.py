from typing import Optional
from pydantic import BaseModel

class StoryBase(BaseModel):
    title: str
    date: str
    content: str
    tags: Optional[str] = ""
    emotional_impact: Optional[str] = "medium"

class StoryCreate(StoryBase):
    pass

class StoryUpdate(StoryBase):
    pass

class StoryOut(StoryBase):
    id: int
    class Config:
        orm_mode = True
