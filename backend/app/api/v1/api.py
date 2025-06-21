from fastapi import APIRouter
from fastapi.responses import JSONResponse

from .endpoints import auth, users, stories, ai_model

api_router = APIRouter()

@api_router.get("/health", response_class=JSONResponse)
async def health_check():
    """Health check endpoint.
    
    Returns:
        dict: Status of the API
    """
    return {"status": "ok"}

# Include other routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(stories.router, prefix="/stories", tags=["stories"])
api_router.include_router(ai_model.router, prefix="/ai-model", tags=["ai-model"])
