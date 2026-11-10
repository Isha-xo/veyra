from fastapi import APIRouter, Depends
from backend.app.core.config import settings
from backend.app.schemas.transcription import HealthResponse
from backend.app.services.asr_service import ASRService, get_asr_service

router = APIRouter()


@router.get("", response_model=HealthResponse, summary="Check service and model status")
def check_health(asr_service: ASRService = Depends(get_asr_service)) -> HealthResponse:
    """Return health status and runtime Whisper model configuration."""
    return HealthResponse(
        status="ok",
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
        model_size=asr_service.model_size,
        device=asr_service.device,
        compute_type=asr_service.compute_type,
        model_loaded=asr_service.is_loaded
    )
