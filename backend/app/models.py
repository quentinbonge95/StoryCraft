from sqlalchemy import Column, Integer, String, Text
from app.database import Base

class Story(Base):
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    date = Column(String)
    content = Column(Text)
    tags = Column(String)
    emotional_impact = Column(String)
