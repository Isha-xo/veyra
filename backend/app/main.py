import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import settings
from backend.app.api.routes import api_router
from backend.app.api.routes.transcribe import transcribe_audio
from backend.app.services.asr_service import get_asr_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("signbridge")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.info("Initializing SignBridge Speech Recognition API...")
    if settings.PRELOAD_MODEL_ON_STARTUP:
        logger.info("Preloading faster-whisper model on startup...")
        get_asr_service().load_model()
    else:
        logger.info("Model preloading deferred (lazy loading enabled).")
    yield
    logger.info("Shutting down SignBridge Speech Recognition API...")


def create_application() -> FastAPI:
    """FastAPI application factory."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=(
            "Independent Speech-to-Text (ASR) microservice for SignBridge. "
            "Transcribes English, Hindi, and Hinglish speech audio using local faster-whisper."
        ),
        lifespan=lifespan
    )

    # Enable CORS for frontend integration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount API v1 router
    app.include_router(api_router, prefix=settings.API_V1_STR)

    # Direct routes for developer convenience (supports both /transcribe and /api/v1/transcribe)
    app.add_api_route(
        "/transcribe",
        transcribe_audio,
        methods=["POST"],
        tags=["Speech Recognition"],
        summary="Direct /transcribe convenience endpoint"
    )

    @app.get("/", tags=["General"])
    def root():
        return {
            "message": "SignBridge ASR API is running",
            "docs": "/docs",
            "health": f"{settings.API_V1_STR}/health",
            "transcribe": "/transcribe",
            "version": settings.VERSION
        }

    return app


app = create_application()
