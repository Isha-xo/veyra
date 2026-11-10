import logging
from typing import Optional, List, Tuple
from faster_whisper import WhisperModel
from backend.app.core.config import settings
from backend.app.schemas.transcription import (
    TranscriptionSegment,
    TranscriptionResponse
)

logger = logging.getLogger("signbridge.asr")


class ASRService:
    """Encapsulated faster-whisper Automatic Speech Recognition Service.
    
    Decoupled from FastAPI or HTTP transport logic so it can be reused
    independently or integrated into pipelines.
    """

    def __init__(
        self,
        model_size: Optional[str] = None,
        device: Optional[str] = None,
        compute_type: Optional[str] = None,
        beam_size: Optional[int] = None,
        vad_filter: Optional[bool] = None,
    ):
        self.model_size = model_size or settings.WHISPER_MODEL_SIZE
        self.device = device or settings.WHISPER_DEVICE
        self.compute_type = compute_type or settings.WHISPER_COMPUTE_TYPE
        self.beam_size = beam_size or settings.WHISPER_BEAM_SIZE
        self.vad_filter = vad_filter if vad_filter is not None else settings.WHISPER_VAD_FILTER
        self._model: Optional[WhisperModel] = None

    def load_model(self) -> None:
        """Load or warm up the Whisper model into memory."""
        if self._model is None:
            logger.info(
                f"Loading faster-whisper model '{self.model_size}' "
                f"on {self.device} with {self.compute_type} precision..."
            )
            self._model = WhisperModel(
                model_size_or_path=self.model_size,
                device=self.device,
                compute_type=self.compute_type
            )
            logger.info("faster-whisper model successfully loaded.")

    @property
    def is_loaded(self) -> bool:
        """Check if model is currently loaded in memory."""
        return self._model is not None

    def transcribe(
        self,
        audio_file_path: str,
        language: Optional[str] = None,
        beam_size: Optional[int] = None,
        vad_filter: Optional[bool] = None,
    ) -> TranscriptionResponse:
        """Transcribe an audio file using faster-whisper.
        
        Args:
            audio_file_path: Path to the target audio file (wav, webm, mp3, etc.)
            language: Optional ISO 639-1 language code (e.g. 'en', 'hi'). If None, auto-detected.
            beam_size: Optional beam size override.
            vad_filter: Optional voice activity detection override.
            
        Returns:
            TranscriptionResponse containing full transcript and segment metadata.
        """
        if self._model is None:
            self.load_model()

        active_beam_size = beam_size or self.beam_size
        active_vad = self.vad_filter if vad_filter is None else vad_filter

        # Run transcription with faster-whisper
        segments_generator, info = self._model.transcribe(
            audio_file_path,
            language=language,
            beam_size=active_beam_size,
            vad_filter=active_vad
        )

        segments_list: List[TranscriptionSegment] = []
        full_text_parts: List[str] = []

        for idx, seg in enumerate(segments_generator):
            clean_text = seg.text.strip()
            if clean_text:
                full_text_parts.append(clean_text)
                segments_list.append(
                    TranscriptionSegment(
                        id=idx,
                        start=round(seg.start, 2),
                        end=round(seg.end, 2),
                        text=clean_text,
                        avg_logprob=round(seg.avg_logprob, 3) if seg.avg_logprob is not None else None,
                        no_speech_prob=round(seg.no_speech_prob, 3) if seg.no_speech_prob is not None else None,
                    )
                )

        full_transcript = " ".join(full_text_parts).strip()

        return TranscriptionResponse(
            transcript=full_transcript,
            language=info.language,
            language_probability=round(info.language_probability, 4),
            duration=round(info.duration, 2),
            segments=segments_list
        )


# Global singleton instance for FastAPI dependency injection
_asr_service_instance: Optional[ASRService] = None


def get_asr_service() -> ASRService:
    """Dependency provider for ASRService singleton."""
    global _asr_service_instance
    if _asr_service_instance is None:
        _asr_service_instance = ASRService()
    return _asr_service_instance
