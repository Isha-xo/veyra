from typing import List, Optional
from pydantic import BaseModel, Field


class TranscriptionSegment(BaseModel):
    """Schema representing an individual speech segment with timestamps."""
    id: int = Field(..., description="Segment sequential index")
    start: float = Field(..., description="Start time in seconds")
    end: float = Field(..., description="End time in seconds")
    text: str = Field(..., description="Transcribed text for this segment")
    avg_logprob: Optional[float] = Field(None, description="Average log probability of tokens")
    no_speech_prob: Optional[float] = Field(None, description="Probability that no speech was present")


class TranscriptionResponse(BaseModel):
    """Standardized API contract for speech-to-text response."""
    transcript: str = Field(
        ...,
        description="Full concatenated recognized transcript",
        examples=["Please bring your ID card."]
    )
    language: str = Field(
        ...,
        description="Detected ISO 639-1 language code (e.g., 'en', 'hi')",
        examples=["en"]
    )
    language_probability: float = Field(
        ...,
        description="Confidence probability of the detected language (0.0 to 1.0)",
        examples=[0.985]
    )
    duration: float = Field(
        ...,
        description="Total duration of processed audio in seconds",
        examples=[2.45]
    )
    segments: List[TranscriptionSegment] = Field(
        default_factory=list,
        description="List of detailed timed segments"
    )


class HealthResponse(BaseModel):
    """Healthcheck and runtime metadata schema."""
    status: str = Field("ok", examples=["ok"])
    service: str = Field(..., examples=["SignBridge Speech Recognition API"])
    version: str = Field(..., examples=["1.0.0"])
    model_size: str = Field(..., examples=["small"])
    device: str = Field(..., examples=["cpu"])
    compute_type: str = Field(..., examples=["int8"])
    model_loaded: bool = Field(..., description="Whether WhisperModel is loaded in memory")
