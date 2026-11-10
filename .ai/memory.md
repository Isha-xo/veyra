# Project Memory: Veyra (SignBridge)

## Project Overview
SignBridge is an assistive technology platform bridging spoken/text communication and Indian Sign Language (ISL).
The current active focus is **Phase 1: Speech-to-Text (ASR)** — an independent backend microservice that converts speech audio (English, Hindi, Hinglish) into high-accuracy transcripts for downstream consumption by the frontend and future NLP layers.

---

## Current Status
Active Development (Phase 1: Speech-to-Text ASR)

---

## Current Progress
- Git repository synced (`https://github.com/ShreyasUday/veyra`) ✅
- Backend virtual environment & dependency management initialized ✅
- Backend dependencies installed (faster-whisper, FastAPI, uvicorn, jiwer) ✅
- Modular architecture implemented (core, api, services, schemas) ✅
- Unit tests implemented and verified (6/6 passing) ✅
- Live microphone recording & CLI tester (`record_and_transcribe.py`) added ✅
- Model download & live microphone speech test ⏳
- Word Error Rate (WER) evaluation benchmark ⏳

---

## Tech Stack
- **Language**: Python 3.14
- **Speech-to-Text Engine**: `faster-whisper` (CTranslate2 backend, INT8 quantization, CPU)
- **API Framework**: `FastAPI`, `Uvicorn`, `Pydantic v2`
- **Audio Processing**: `PyAV` / ffmpeg
- **Metrics & Benchmarking**: `jiwer` (Word Error Rate - WER)
- **Testing**: `pytest`, `httpx`

---

## Architecture
The ASR module is designed as an independent, loosely coupled service:
```
[Frontend (Microphone / WebM / WAV)]
             │
             ▼ (HTTP POST /api/v1/transcribe multipart/form-data)
     [FastAPI Routing & Validation]
             │
             ▼
     [ASR Service (faster-whisper)]
             │
             ▼
     [JSON Transcript & Segments]
             │
             ▼ (Future Phase)
[NLP Pipeline: Intent Classification -> Slot Extraction -> ISL Mapping]
```

---

## Folder Structure
```
backend/
├── app/
│   ├── core/           # Configuration & environment settings
│   ├── api/            # API routers & endpoint definitions (/health, /transcribe)
│   ├── schemas/        # Pydantic request & response schemas
│   ├── services/       # Core domain services (WhisperModel encapsulation)
│   └── main.py         # Application factory, lifespan, and CORS setup
├── test_audio/         # Reference audio files for validation & benchmarks
├── tests/              # Unit tests, standalone ASR verification, WER benchmarks
├── requirements.txt    # Project dependencies
└── README.md           # Backend and API documentation
```

---

## APIs
- `GET /api/v1/health`: Service health status, model metadata, and runtime device.
- `POST /api/v1/transcribe`: Accepts audio file (`.wav`, `.webm`, `.mp3`), runs VAD-filtered transcription, and returns text, language detection, and segment timestamps.

---

## Environment Variables
- `APP_ENV`: Application environment (`development`, `production`).
- `PORT`: Server listen port (default: `8000`).
- `HOST`: Server listen address (default: `0.0.0.0`).
- `CORS_ORIGINS`: Comma-separated list of allowed frontend origins (e.g. `http://localhost:3000`, `http://localhost:5173`).
- `WHISPER_MODEL_SIZE`: Whisper model identifier (`base`, `small`, `medium`).
- `WHISPER_DEVICE`: Computation device (`cpu`, `cuda`).
- `WHISPER_COMPUTE_TYPE`: Precision format (`int8`, `float16`, `float32`).
- `WHISPER_BEAM_SIZE`: Decoding beam size (default: `5`).
- `WHISPER_VAD_FILTER`: Enable Voice Activity Detection filtering (`true`/`false`).
