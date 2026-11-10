# SignBridge: Phase 1 Speech-to-Text (ASR) Microservice

> An independent, high-performance Speech-to-Text (ASR) microservice for **SignBridge** (Veyra). It accepts spoken audio recordings (English, Hindi, and Hinglish) from a web or mobile frontend and generates timestamped transcripts with language detection and confidence scoring for downstream Indian Sign Language (ISL) processing.

---

## 1. Overview

SignBridge bridges spoken conversation and Indian Sign Language (ISL). 

**Phase 1** delivers the foundational Speech-to-Text (ASR) engine. It is architected as an independent backend microservice decoupled from downstream Natural Language Processing (NLP) and animation layers. The frontend records user speech from the microphone and sends audio via HTTP to this microservice, which executes local automatic speech recognition using quantized Whisper models and returns a standardized JSON contract.

---

## 2. Implemented Features

* **Local Offline Inference:** Runs entirely on your local machine using `faster-whisper` and CTranslate2 without requiring external cloud APIs or paid subscriptions.
* **CPU Optimization:** Runs efficiently on standard CPUs using INT8 quantization (`compute_type="int8"`).
* **Multilingual & Code-Mixed Support:** Recognizes Indian English, Hindi (Devanagari), and Hinglish (mixed Hindi-English phrases).
* **Voice Activity Detection (VAD):** Integrated Silero VAD filter automatically ignores background silence and non-speech segments.
* **Robust File Ingestion:** Streams and safely buffers multipart audio payloads (`.webm`, `.wav`, `.mp3`, `.ogg`, `.m4a`) up to 25 MB with automatic temporary file cleanup.
* **Frontend-Ready CORS:** Pre-configured Cross-Origin Resource Sharing (CORS) allowing browser frontends (e.g., React, Next.js, Vite) to connect seamlessly.
* **Interactive Documentation:** Auto-generated interactive Swagger UI at `/docs` and ReDoc at `/redoc`.
* **Testing & Benchmarking Suite:** Built-in tools for live microphone testing (`record_and_transcribe.py`) and formal Word Error Rate (WER) scoring (`eval_wer.py` via `jiwer`).

---

## 3. Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Programming Language** | Python 3 | Core backend runtime |
| **ASR Engine** | `faster-whisper` (CTranslate2) | High-speed local speech recognition |
| **Model Weights** | OpenAI Whisper (via Hugging Face) | Pretrained multilingual transformer models |
| **API Framework** | `FastAPI` | Asynchronous REST API and serialization |
| **ASGI Web Server** | `Uvicorn` | High-throughput web server |
| **Validation & Settings** | `Pydantic v2` / `pydantic-settings` | Strict schema validation and configuration |
| **Audio Processing** | `PyAV` / `ffmpeg` | In-memory and streaming audio decoding |
| **Metrics & Evaluation**| `jiwer` | Word Error Rate (WER) calculation |
| **Testing** | `pytest`, `httpx` | Automated route and integration testing |

---

## 4. Whisper Model Guide (All Tiers)

Whisper is available in multiple model sizes. All models run **100% offline** once cached in `~/.cache/huggingface/hub/`.

### Model Comparison Table

| Model Size | Weight Size | RAM / Memory | Relative Speed | Recommended Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **`tiny`** | ~75 MB | ~390 MB | ~32x real-time | Quick testing, lightweight devices, basic English words |
| **`base`** | ~140 MB | ~500 MB | ~16x real-time | Fast prototyping, clean English speech |
| **`small`** *(Default)* | ~460 MB | ~1.0 GB | ~6x real-time | **Recommended:** Optimal balance for Indian English, Hindi, and Hinglish |
| **`medium`** | ~1.5 GB | ~2.6 GB | ~2x real-time | Higher vocabulary accuracy, noisy environments |
| **`large-v3`** | ~3.1 GB | ~4.7 GB | ~1x real-time | Maximum accuracy, complex domain terms, multiple speakers |

---

### How to Download Any Model Tier

We have provided a dedicated CLI downloader with a **visual progress bar** showing download speed (MB/s) and estimated time:

```bash
# Download the default / recommended model (small: ~460 MB)
PYTHONPATH=. backend/venv/bin/python backend/tests/download_model.py --model-size small

# Or download the lightweight model (base: ~140 MB)
PYTHONPATH=. backend/venv/bin/python backend/tests/download_model.py --model-size base

# Or download the fastest model (tiny: ~75 MB)
PYTHONPATH=. backend/venv/bin/python backend/tests/download_model.py --model-size tiny

# Or download high-accuracy models
PYTHONPATH=. backend/venv/bin/python backend/tests/download_model.py --model-size medium
PYTHONPATH=. backend/venv/bin/python backend/tests/download_model.py --model-size large-v3
```

> **Note:** Models download once. Subsequent runs load from local cache in **under 1 second**.

---

## 5. Environment Variables (`.env`)

### Do you need to configure `.env` right now?
**No. Everything works out-of-the-box without touching `.env`.**

All configuration settings have safe, production-grade defaults built into `backend/app/core/config.py`:
* Default Host: `0.0.0.0`
* Default Port: `8000`
* Default Model: `small`
* Default Device: `cpu`
* Default Precision: `int8`
* Default CORS: `*` (permits all frontend origins)

### Optional `.env` Overrides
If you wish to customize runtime parameters, copy `backend/.env.example` to `backend/.env`:
```bash
cp backend/.env.example backend/.env
```

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `WHISPER_MODEL_SIZE` | `small` | Choose `tiny`, `base`, `small`, `medium`, or `large-v3` |
| `WHISPER_DEVICE` | `cpu` | Hardware accelerator: `cpu` or `cuda` |
| `WHISPER_COMPUTE_TYPE` | `int8` | Precision: `int8`, `float16`, or `float32` |
| `WHISPER_BEAM_SIZE` | `5` | Beam search decoding width (1–10) |
| `WHISPER_VAD_FILTER` | `true` | Enable Silero Voice Activity Detection |
| `CORS_ORIGINS` | `*` | Allowed origins (e.g. `http://localhost:3000,http://localhost:5173`) |
| `HOST` | `0.0.0.0` | Listen host address |
| `PORT` | `8000` | Listen port |

---

## 6. Installation & Quickstart

### Step 1: Create Virtual Environment
```bash
python3 -m venv backend/venv
source backend/venv/bin/activate
```

### Step 2: Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### Step 3: Run the FastAPI Server
```bash
PYTHONPATH=. backend/venv/bin/uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

* **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
* **Health Endpoint:** [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

---

## 7. Frontend Integration Contract

### Endpoint Specification
* **Route:** `POST /transcribe` *(or `POST /api/v1/transcribe`)*
* **Content-Type:** `multipart/form-data`

### Request Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `file` | `Binary File` | **Yes** | Audio recording (`.webm`, `.wav`, `.mp3`, `.ogg`, `.m4a`). |
| `language` | `Query string` | No | Optional ISO code (`en` for English, `hi` for Hindi). If omitted, Whisper auto-detects. |
| `beam_size` | `Query integer`| No | Decoding beam search width (1–10). Default: `5`. |

### Response Schema (`200 OK`)
```json
{
  "transcript": "Please bring your ID card.",
  "language": "en",
  "language_probability": 0.998,
  "duration": 3.84,
  "segments": [
    {
      "id": 0,
      "start": 0.52,
      "end": 3.80,
      "text": "Please bring your ID card.",
      "avg_logprob": -0.152,
      "no_speech_prob": 0.008
    }
  ]
}
```

### Frontend Implementation Example (JavaScript / Fetch)
```javascript
// Function called by frontend after capturing microphone audio
async function transcribeSpeech(audioBlob) {
  const formData = new FormData();
  // Name the file with .webm (or .wav) extension
  formData.append("file", audioBlob, "recording.webm");

  const response = await fetch("http://localhost:8000/transcribe", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Transcription failed");
  }

  const result = await response.json();
  console.log("Transcript:", result.transcript);
  console.log("Detected Language:", result.language);
  return result;
}
```

---

## 8. Testing & Evaluation

### A. Run Automated Unit Tests
```bash
PYTHONPATH=. backend/venv/bin/pytest backend/tests/test_api.py -v
```

### B. Record Directly from Microphone & Transcribe
Test speech recognition with your own voice in the terminal:
```bash
# Record for 5 seconds using 'small' model
PYTHONPATH=. backend/venv/bin/python backend/tests/record_and_transcribe.py --duration 5 --model-size small

# Or test with other model sizes
PYTHONPATH=. backend/venv/bin/python backend/tests/record_and_transcribe.py --duration 5 --model-size base
```

### C. Evaluate Word Error Rate (WER) with `jiwer`
To benchmark transcription accuracy against ground truth sentences:
```bash
PYTHONPATH=. backend/venv/bin/python backend/tests/eval_wer.py --manifest backend/tests/eval_samples.json --model-size small
```
Outputs individual and overall Word Error Rate (WER), Match Error Rate (MER), and Word Information Lost (WIL), and saves results to `backend/tests/eval_results.json`.

---

## 9. Project Directory Structure

```
backend/
├── app/
│   ├── core/
│   │   ├── __init__.py
│   │   ├── audio_compat.py         # PyAV 19+ compatibility shim
│   │   └── config.py               # Settings (Pydantic BaseSettings, CORS, model size)
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── health.py           # GET /api/v1/health status endpoint
│   │       └── transcribe.py       # POST /transcribe audio handler
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── transcription.py        # Pydantic v2 serialization contracts
│   ├── services/
│   │   ├── __init__.py
│   │   └── asr_service.py          # Decoupled faster-whisper singleton engine
│   ├── __init__.py
│   └── main.py                     # FastAPI application factory, lifespan, CORS
├── test_audio/                     # Local test recordings directory
├── tests/
│   ├── __init__.py
│   ├── test_api.py                 # Pytest suite for API endpoints
│   ├── test_asr_standalone.py      # Standalone file transcription runner
│   ├── record_and_transcribe.py    # Direct mic recording and live transcription
│   ├── download_model.py           # Model downloader with visual progress bar
│   ├── eval_wer.py                 # Benchmark evaluation suite using jiwer
│   └── eval_samples.json           # Evaluation reference dataset manifest
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment variable template
└── README.md                       # Phase 1 documentation
```

---

## 10. Learning Notes & Resume Highlights

* **Difficulty:** Intermediate
* **Core Technical Concepts Learned:**
  * Quantized transformer inference with CTranslate2 and INT8 CPU execution.
  * Streaming file ingestion, memory boundaries, and safe temporary file buffering in asynchronous web frameworks.
  * Decoupling domain machine learning services from HTTP delivery layers.
  * Cross-Origin Resource Sharing (CORS) protocol semantics for frontend/backend decoupled architectures.
  * Systematic ASR evaluation using Levenshtein-distance metrics (Word Error Rate via `jiwer`).
* **Resume Highlights:**
  * *Designed and deployed an independent, asynchronous Speech-to-Text microservice using FastAPI and faster-whisper with INT8 CPU quantization, achieving sub-second model initialization and >2x real-time transcription throughput.*
  * *Engineered an evaluation harness utilizing `jiwer` to benchmark Word Error Rate across English, Hindi, and code-mixed (Hinglish) speech inputs.*
