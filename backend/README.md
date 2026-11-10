# SignBridge: Phase 1 Speech-to-Text (ASR) Microservice

This module is the independent **Speech-to-Text (ASR)** engine for **SignBridge** (Veyra). It accepts spoken audio recordings (English, Hindi, and Hinglish) from the frontend application and returns timestamped transcripts with language detection and confidence scoring.

---

## 1. Architecture Overview

```
[ Frontend: User Speaks / Audio Blob (WebM / WAV) ]
                       │
                       ▼  POST /api/v1/transcribe (or /transcribe)
    ┌────────────────────────────────────────────────────────┐
    │                FastAPI REST Microservice               │
    │  - Multipart audio upload parsing                      │
    │  - Audio format and size validation                    │
    │  - Safe temp file handling & auto-cleanup              │
    │  - CORS support for web frontend integration           │
    └──────────────────────────┬─────────────────────────────┘
                               │
                               ▼
    ┌────────────────────────────────────────────────────────┐
    │           Domain ASR Service (faster-whisper)          │
    │  - CTranslate2 engine (CPU INT8 quantization)          │
    │  - Silero VAD (Voice Activity Detection) filter        │
    │  - Multilingual support: English, Hindi, Hinglish      │
    └──────────────────────────┬─────────────────────────────┘
                               │
                               ▼
[ Structured JSON Transcript: text, language, confidence, segments ]
                               │
                               ▼ (Future Phase)
[ Downstream NLP Pipeline: Intent -> Slots -> ISL Sign Mapping ]
```

---

## 2. Technology Stack

* **Language:** Python 3
* **ASR Engine:** `faster-whisper` (`base` / `small` models with `int8` CPU quantization)
* **API Framework:** `FastAPI`, `Uvicorn`, `Pydantic v2`
* **Audio Processing:** `PyAV` / `ffmpeg`
* **Benchmarking & Metrics:** `jiwer` (Word Error Rate - WER, MER, WIL)
* **Testing:** `pytest`, `httpx`

---

## 3. Directory Structure

```
backend/
├── app/
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py               # Settings (Pydantic BaseSettings, environment variables)
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── health.py           # GET /api/v1/health (service metadata & model state)
│   │       └── transcribe.py       # POST /api/v1/transcribe & POST /transcribe
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── transcription.py        # Pydantic models (contract for requests & responses)
│   ├── services/
│   │   ├── __init__.py
│   │   └── asr_service.py          # Decoupled faster-whisper singleton engine
│   ├── __init__.py
│   └── main.py                     # FastAPI application factory, CORS, lifespan
├── test_audio/
│   └── README.md                   # Guide and matrix for test audio recordings
├── tests/
│   ├── __init__.py
│   ├── test_api.py                 # Pytest suite for API endpoints and validation
│   ├── test_asr_standalone.py      # Standalone CLI tester for faster-whisper
│   ├── eval_wer.py                 # Benchmark script to calculate WER with jiwer
│   └── eval_samples.json           # Evaluation benchmark dataset manifest
├── requirements.txt
├── .env.example
└── README.md
```

---

## 4. Setup and Installation

### Step 1: Create and activate virtual environment
From the repository root:
```bash
python3 -m venv backend/venv
source backend/venv/bin/activate
```

### Step 2: Install dependencies
```bash
pip install -r backend/requirements.txt
```

---

## 5. Running the API Server

Start the Uvicorn development server:
```bash
PYTHONPATH=. backend/venv/bin/uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

* **Interactive Swagger UI:** Visit [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **Alternative ReDoc:** Visit [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
* **Health Check:** `curl http://127.0.0.1:8000/api/v1/health`

---

## 6. Frontend Integration Contract

### Endpoint Specification
* **URL:** `http://localhost:8000/transcribe` (or `http://<BACKEND_IP>:8000/api/v1/transcribe`)
* **Method:** `POST`
* **Content-Type:** `multipart/form-data`
* **CORS:** Enabled for all origins by default (customizable via `CORS_ORIGINS` in `.env`).

### Request Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `file` | `File (Binary)` | **Yes** | Audio recording (`.webm`, `.wav`, `.mp3`, `.ogg`, `.m4a`). |
| `language` | `Query string` | No | Optional ISO language hint (e.g. `en`, `hi`). If omitted, Whisper auto-detects. |
| `beam_size` | `Query integer` | No | Search beam size (1–10). Default is `5`. |

### Response Schema (JSON)
```json
{
  "transcript": "Please bring your ID card.",
  "language": "en",
  "language_probability": 0.9852,
  "duration": 2.45,
  "segments": [
    {
      "id": 0,
      "start": 0.0,
      "end": 2.45,
      "text": "Please bring your ID card.",
      "avg_logprob": -0.152,
      "no_speech_prob": 0.008
    }
  ]
}
```

### Frontend Teammate Integration Example (JavaScript / Fetch)
```javascript
// Example: Sending recorded audio from HTML5 MediaRecorder to SignBridge ASR
async function sendAudioForTranscription(audioBlob) {
  const formData = new FormData();
  formData.append("file", audioBlob, "recording.webm");

  const response = await fetch("http://localhost:8000/transcribe", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Transcription failed");
  }

  const data = await response.json();
  console.log("Transcribed Text:", data.transcript);
  console.log("Detected Language:", data.language);
  return data;
}
```

### cURL Example
```bash
curl -X POST "http://127.0.0.1:8000/transcribe" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@backend/test_audio/english_id_card.wav"
```

---

## 7. Model Download & Local Cache

* **Automatic Cache Location:** `~/.cache/huggingface/hub/`
* `faster-whisper` models run **completely offline** once downloaded.
* Default model: `small` (~460 MB, balanced accuracy for Indian English and Hindi).
* Alternative: `base` (~140 MB, lighter and faster).

---

## 8. Standalone Testing & Benchmarks

### A. Run Unit Tests (Mocked - Fast)
```bash
PYTHONPATH=. backend/venv/bin/pytest backend/tests/test_api.py -v
```

### B. Record Directly from Your Microphone and Transcribe
```bash
PYTHONPATH=. backend/venv/bin/python backend/tests/record_and_transcribe.py --duration 5 --model-size small
```
* Shows a 3-second countdown, records for 5 seconds from your laptop mic, saves to `backend/test_audio/my_recording.wav`, and immediately transcribes it.

### C. Test ASR Directly on an Existing Audio File
```bash
PYTHONPATH=. backend/venv/bin/python backend/tests/test_asr_standalone.py backend/test_audio/your_audio.wav --model-size small
```

### D. Evaluate Word Error Rate (WER) with `jiwer`
```bash
PYTHONPATH=. backend/venv/bin/python backend/tests/eval_wer.py --manifest backend/tests/eval_samples.json --model-size small
```
