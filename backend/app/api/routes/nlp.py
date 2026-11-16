import os
import tempfile
import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Query, HTTPException, Depends, status

from backend.app.core.config import settings
from backend.app.schemas.nlp import NLPRequest, NLPResponse
from backend.app.services.nlp_service import NLPService, get_nlp_service
from backend.app.services.asr_service import ASRService, get_asr_service

logger = logging.getLogger("signbridge.api.nlp")
router = APIRouter()


@router.post(
    "/process",
    response_model=NLPResponse,
    status_code=status.HTTP_200_OK,
    summary="Convert text to Indian Sign Language (ISL) grammar and sign tokens",
    description="Takes English, Hindi, or Hinglish text and converts it into ISL SOV grammar with animation tokens."
)
def process_text_to_isl(
    payload: NLPRequest,
    nlp_service: NLPService = Depends(get_nlp_service)
) -> NLPResponse:
    """Process text into ISL grammar and animation sequence."""
    try:
        return nlp_service.process_text(payload.text)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"NLP processing error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"NLP processing failed: {str(e)}"
        )


@router.post(
    "/speech-to-isl",
    status_code=status.HTTP_200_OK,
    summary="All-in-One: Audio Speech ➔ Text Transcript ➔ ISL Sign Animation Sequence",
    description="Transcribes audio via faster-whisper and converts it to ISL tokens in a single call."
)
async def speech_to_isl(
    file: UploadFile = File(..., description="Multipart audio file recording"),
    language: Optional[str] = Query(None, description="Optional audio language hint ('en', 'hi')"),
    asr_service: ASRService = Depends(get_asr_service),
    nlp_service: NLPService = Depends(get_nlp_service)
):
    """Execute end-to-end Speech-to-ISL pipeline."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No audio file provided.")

    _, ext = os.path.splitext(file.filename.lower())
    if ext and ext not in settings.ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported format '{ext}'. Allowed: {', '.join(settings.ALLOWED_AUDIO_EXTENSIONS)}"
        )

    temp_file_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=ext or ".wav", delete=False) as temp:
            temp_file_path = temp.name
            while chunk := await file.read(1024 * 1024):
                temp.write(chunk)

        # 1. Transcribe Audio
        asr_result = asr_service.transcribe(temp_file_path, language=language)

        if not asr_result.transcript:
            raise HTTPException(status_code=400, detail="No speech detected in audio recording.")

        # 2. Process Transcript with NLP
        nlp_result = nlp_service.process_text(asr_result.transcript)

        return {
            "transcript": asr_result.transcript,
            "language": asr_result.language,
            "language_probability": asr_result.language_probability,
            "duration": asr_result.duration,
            "isl": nlp_result
        }

    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
