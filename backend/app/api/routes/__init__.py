"""FastAPI route blueprints."""
from fastapi import APIRouter
from backend.app.api.routes.health import router as health_router
from backend.app.api.routes.transcribe import router as transcribe_router

api_router = APIRouter()

api_router.include_router(health_router, prefix="/health", tags=["Health"])
api_router.include_router(transcribe_router, prefix="/transcribe", tags=["Speech Recognition"])

__all__ = ["api_router"]
