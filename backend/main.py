from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend.app.models import Base, User, Story
from backend.app.database import engine, get_db
from pydantic import BaseModel
from passlib.context import CryptContext
import jwt, datetime, requests
import os
import requests

OLLAMA_URL = os.getenv('OLLAMA_URL', 'http://localhost:11434')  # fallback if missing

def ask_ollama(prompt: str):
    response = requests.post(
        f"{OLLAMA_URL}/api/generate",
        json={"prompt": prompt}
    )
    response.raise_for_status()
    return response.json()


app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")  # Bcrypt for password hashing:contentReference[oaicite:5]{index=5}

# JWT configuration
SECRET_KEY = "your_jwt_secret_key_here_change_me"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # token expiry (1 hour)

# Pydantic models for request/response
class SignupRequest(BaseModel):
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class StoryCreate(BaseModel):
    title: str
    content: str

class StoryOut(BaseModel):
    id: int
    title: str
    content: str
    user_id: int
    class Config:
        orm_mode = True

# Create DB tables at startup
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

# Enable CORS for all origins (for development convenience)
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Utility: authenticate user and return token
def create_access_token(data: dict, expires_delta: int = None):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=(expires_delta or ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    token_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)  # Generate JWT token:contentReference[oaicite:6]{index=6}
    return token_jwt

# Dependency: get current user from token
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exc = HTTPException(
        status_code=401, detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])  # Decode JWT:contentReference[oaicite:7]{index=7}
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exc
    except jwt.ExpiredSignatureError:
        raise credentials_exc
    except jwt.InvalidTokenError:
        raise credentials_exc
    # Token is valid – get user from DB
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise credentials_exc
    return user

# User signup endpoint
@app.post("/signup", status_code=201)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    # Check if username is taken
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    # Create new user
    hashed_pw = pwd_context.hash(payload.password)  # Hash password:contentReference[oaicite:8]{index=8}
    new_user = User(username=payload.username, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully"}

# User login endpoint – returns JWT token
@app.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not pwd_context.verify(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    # Create JWT token with user identity
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}

# Get all stories for current user
@app.get("/stories", response_model=list[StoryOut])
def list_stories(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    stories = db.query(Story).filter(Story.user_id == current_user.id).all()
    return stories

# Get a single story (if owned by current user)
@app.get("/stories/{story_id}", response_model=StoryOut)
def get_story(story_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story or story.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Story not found")
    return story

# Create a new story for current user
@app.post("/stories", response_model=StoryOut)
def create_story(payload: StoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_story = Story(title=payload.title, content=payload.content, user_id=current_user.id)
    db.add(new_story)
    db.commit()
    db.refresh(new_story)
    return new_story

# Update an existing story (must belong to current user)
@app.put("/stories/{story_id}", response_model=StoryOut)
def update_story(story_id: int, payload: StoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story or story.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Story not found")
    story.title = payload.title
    story.content = payload.content
    db.commit()
    db.refresh(story)
    return story

# Delete a story (current user only)
@app.delete("/stories/{story_id}")
def delete_story(story_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story or story.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Story not found")
    db.delete(story)
    db.commit()
    return {"message": "Story deleted"}

# Refine a story using the Ollama LLM API
@app.post("/stories/{story_id}/refine")
def refine_story(story_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story or story.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Story not found")
    # Prepare the prompt for the model to refine the content
    prompt_text = (
        "Refine the following story, improving its grammar, clarity, and style without changing the plot:\n\n"
        + story.content
        + "\n"
    )
    # Call the Ollama API to generate refined text:contentReference[oaicite:9]{index=9}
    try:
        resp = requests.post(
            "http://0.0.0.0:11434/api/generate",
            json={"model": "deepseek-r1", "prompt": prompt_text}
        )
        resp.raise_for_status()
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error communicating with Ollama: {e}")
    data = resp.json()
    refined_text = data.get("response")
    if refined_text is None:
        raise HTTPException(status_code=500, detail="No response from model")
    # Return the refined content (not auto-saving to DB, user can save manually)
    return {"refined_content": refined_text}
