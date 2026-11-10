from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.asr_service import get_asr_service, ASRService
from backend.app.schemas.transcription import TranscriptionResponse, TranscriptionSegment

client = TestClient(app)


class MockASRService:
    """Mock ASR service to test API transport without loading Whisper weights."""
    def __init__(self):
        self.model_size = "small"
        self.device = "cpu"
        self.compute_type = "int8"
        self._loaded = True

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    def transcribe(self, audio_file_path: str, **kwargs) -> TranscriptionResponse:
        return TranscriptionResponse(
            transcript="Please bring your ID card.",
            language="en",
            language_probability=0.985,
            duration=2.4,
            segments=[
                TranscriptionSegment(
                    id=0,
                    start=0.0,
                    end=2.4,
                    text="Please bring your ID card.",
                    avg_logprob=-0.15,
                    no_speech_prob=0.01
                )
            ]
        )


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "SignBridge ASR API is running"
    assert "/docs" in data["docs"]


def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "small" in data["model_size"]


def test_transcribe_missing_file():
    response = client.post("/api/v1/transcribe")
    # FastAPI returns 422 for missing required multipart form parameter
    assert response.status_code == 422


def test_transcribe_unsupported_extension():
    files = {"file": ("document.pdf", b"dummy pdf content", "application/pdf")}
    response = client.post("/api/v1/transcribe", files=files)
    assert response.status_code == 415
    assert "Unsupported audio format" in response.json()["detail"]


def test_transcribe_empty_file():
    files = {"file": ("recording.wav", b"", "audio/wav")}
    response = client.post("/api/v1/transcribe", files=files)
    assert response.status_code == 400
    assert "Empty audio recording" in response.json()["detail"]


def test_transcribe_with_mock_service():
    # Override ASR service dependency
    app.dependency_overrides[get_asr_service] = lambda: MockASRService()
    try:
        files = {"file": ("test.wav", b"RIFF....fake_wav_bytes", "audio/wav")}
        response = client.post("/api/v1/transcribe", files=files)
        assert response.status_code == 200
        data = response.json()
        assert data["transcript"] == "Please bring your ID card."
        assert data["language"] == "en"
        assert len(data["segments"]) == 1
    finally:
        app.dependency_overrides.clear()
