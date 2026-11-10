import os
import shutil
import tempfile
import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Query, HTTPException, Depends, status

from backend.app.core.config import settings
from backend.app.schemas.transcription import TranscriptionResponse
from backend.app.services.asr_service import ASRService, get_asr_service

logger = logging.getLogger("signbridge.api")
router = APIRouter()


@router.post(
    "",
    response_model=TranscriptionResponse,
    status_code=status.HTTP_200_OK,
    summary="Transcribe spoken audio to text",
    description="Accepts an audio file upload (wav, webm, mp3, ogg, etc.) and returns the recognized transcript with timing segments."
)
async def transcribe_audio(
    file: UploadFile = File(..., description="Multipart audio file recording"),
    language: Optional[str] = Query(
        None,
        description="Optional language code (e.g. 'en', 'hi'). Auto-detected if omitted."
    ),
    beam_size: Optional[int] = Query(
        None,
        ge=1,
        le=10,
        description="Beam search size (default from config: 5)"
    ),
    asr_service: ASRService = Depends(get_asr_service)
) -> TranscriptionResponse:
    """Handle speech-to-text audio upload and transcription."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided in upload payload."
        )

    # Validate audio extension
    _, ext = os.path.splitext(file.filename.lower())
    if ext and ext not in settings.ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Unsupported audio format '{ext}'. "
                f"Allowed formats: {', '.join(settings.ALLOWED_AUDIO_EXTENSIONS)}"
            )
        )
    
    file_suffix = ext or ".wav"
    temp_file_path = None

    try:
        # Buffer uploaded file safely to disk
        with tempfile.NamedTemporaryFile(suffix=file_suffix, delete=False) as temp_audio:
            temp_file_path = temp_audio.name
            bytes_written = 0
            
            # Stream in chunks to avoid blowing up memory on large audio files
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                bytes_written += len(chunk)
                if bytes_written > settings.MAX_AUDIO_SIZE_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"Audio file exceeds {settings.MAX_AUDIO_SIZE_BYTES // (1024 * 1024)}MB maximum size limit."
                    )
                temp_audio.write(chunk)

        if bytes_written == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty audio recording submitted."
            )

        # Execute transcription
        logger.info(f"Transcribing {file.filename} ({bytes_written} bytes) with faster-whisper...")
        result = asr_service.transcribe(
            audio_file_path=temp_file_path,
            language=language,
            beam_size=beam_size
        )
        return result

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error processing audio transcription: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audio transcription failed: {str(exc)}"
        )
    finally:
        # Always clean up temporary audio file from disk
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except OSError as cleanup_err:
                logger.warning(f"Failed to delete temp file {temp_file_path}: {cleanup_err}")
