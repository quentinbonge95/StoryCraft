from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class AIModelBase(BaseModel):
    provider: str
    model_name: str

class AIModelCreate(AIModelBase):
    api_key: Optional[str] = None

class AIModelUpdate(AIModelBase):
    api_key: Optional[str] = None

class AIModel(AIModelBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
