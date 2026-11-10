from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings and configuration."""
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    PROJECT_NAME: str = "SignBridge Speech Recognition API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Server configuration
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    
    # CORS Configuration - frontend integration
    CORS_ORIGINS: Union[List[str], str] = ["*"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Faster Whisper Model Configuration
    # Options: tiny, base, small, medium, large-v3
    # Default: small (balanced between latency and Hindi/Indian English accuracy)
    WHISPER_MODEL_SIZE: str = "small"
    WHISPER_DEVICE: str = "cpu"
    WHISPER_COMPUTE_TYPE: str = "int8"
    WHISPER_BEAM_SIZE: int = 5
    WHISPER_VAD_FILTER: bool = True
    PRELOAD_MODEL_ON_STARTUP: bool = False
    
    # Audio upload constraints
    MAX_AUDIO_SIZE_BYTES: int = 25 * 1024 * 1024  # 25 MB
    ALLOWED_AUDIO_EXTENSIONS: List[str] = [
        ".wav", ".mp3", ".webm", ".ogg", ".m4a", ".flac", ".aac"
    ]


settings = Settings()
