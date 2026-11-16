# Veyra (SignBridge) 🌉🤟

> **Offline-Capable AI converting Spoken Audio and Typed Text into Authentic Indian Sign Language (ISL) via Interactive 3D Anatomical Hands.**

---

## 🌟 Key Features

- **Offline Speech-to-Text (ASR):** Local inference via `faster-whisper` (Base model) with low-latency multilingual transcription (English, Hindi, Hinglish).
- **ISL Grammar & NLP Engine:**
  - Converts English SVO (*Subject-Verb-Object*) into ISL SOV (*Subject-Object-Verb*) grammar.
  - Interrogative Wh- question words (`WHERE`, `WHAT`, `HOW`, `WHEN`, `WHO`, `WHICH`, `WHY`) automatically repositioned to sentence termination according to ISLRTC standards.
  - Contraction expansion (`what's` ➔ `what is`, `it's` ➔ `it is`, `can't` ➔ `can not`, etc.).
  - Non-signing auxiliary stop words (`is`, `am`, `are`, `the`, `a`, etc.) automatically filtered out.
- **Enriched Vocabulary (400+ Words & Phrases):**
  - Covers campus navigation, admissions, fee payments, document verification, polite conversational idioms, and calendar/time terms.
  - Over 170+ Hindi / Hinglish colloquial phrases (*"kahan hai"*, *"theek hai"*, *"kaise ho"*, *"fees kitni hai"*, *"shulk"*, *"pehchan patra"*).
  - Proper nouns and abbreviations automatically fallback to fingerspelling with authentic individual handshapes for all 26 letters (**A through Z**).
- **Interactive 3D Anatomical Dual-Hand Avatar:**
  - Powered by Three.js WebGL and an anatomically correct, rigged 3D human hand model (`hands.glb`, ~330 KB).
  - True two-handed coordination (spacing, supination/pronation palm angles, independent 3-joint finger flexion around local Z axis).
  - Single-handed signs cleanly hide non-dominant hand to eliminate clutter and visual overlap.
  - 360° orbit controls, zoom presets, speed slider (0.75x, 1x, 1.25x), step-by-step sign timeline, and full-screen Theater Mode (`⛶ Fit Screen`).

---

## 🚀 Teammate Quickstart Guide

### Prerequisites
- **Python:** 3.10 to 3.14
- **Node.js:** 18+ (with `npm`)

---

### 1. Backend Setup

```bash
# From the project root:
cd backend

# Create a virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux / macOS:
source venv/bin/activate
# On Windows (cmd):
# venv\Scripts\activate.bat
# On Windows (PowerShell):
# .\venv\Scripts\Activate.ps1

# Install all backend dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn app.main:app --reload --port 8000
```

> **Backend is live at:** `http://localhost:8000`  
> **Interactive Swagger API Docs:** `http://localhost:8000/docs`

---

### 2. Frontend Setup

In a new terminal window:

```bash
# From the project root:
cd frontend

# Install frontend dependencies (includes Three.js, React, Vite)
npm install

# Start Vite development server
npm run dev
```

> **Frontend is live at:** `http://localhost:5173`

---

## 🧪 Testing & Verification

### Run Backend Unit & NLP Tests
From the project root:
```bash
PYTHONPATH=. backend/venv/bin/pytest backend/tests/
```
*(All 15 automated tests verify campus navigation, Wh- movement, SVO-to-SOV reordering, Hindi transliteration, contraction expansion, and fingerspelling fallbacks).*

### Run Frontend Production Build Check
```bash
npm --prefix frontend run build
```

---

## 📂 Project Architecture

```text
Veyra/
├── backend/
│   ├── app/
│   │   ├── api/routes/        # FastAPI REST endpoints (/health, /transcribe, /nlp)
│   │   ├── core/
│   │   │   ├── config.py      # App settings & CORS configuration
│   │   │   ├── isl_vocab.py   # 400+ ISL vocabulary, compound idioms, Hindi aliases
│   │   │   └── audio_compat.py# Audio container/codec compatibility helpers
│   │   ├── schemas/           # Pydantic v2 request/response contracts
│   │   ├── services/
│   │   │   ├── asr_service.py # Faster-Whisper local model inference
│   │   │   └── nlp_service.py # NLTK grammar, contractions & SOV reordering
│   │   └── main.py            # FastAPI application entrypoint
│   ├── requirements.txt       # Frozen Python dependencies
│   └── tests/                 # Automated test suite
│
├── frontend/
│   ├── public/
│   │   └── models/
│   │       └── hands.glb      # Anatomical rigged human hands GLTF asset (330 KB)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Avatar3D.jsx   # Three.js 3D hand animator & alphabet poses
│   │   │   ├── SignPlayer.jsx # Timeline, playback controls & theater mode
│   │   │   ├── AudioRecorder.jsx # Microphone recording component
│   │   │   └── ISLViewer.jsx  # Token & glossary display
│   │   ├── pages/
│   │   │   └── Dashboard.jsx  # Main application dashboard
│   │   └── services/
│   │       └── api.js         # REST client communicating with FastAPI
│   ├── package.json           # React 19, Three.js 0.187, Vite
│   └── vite.config.js
│
└── README.md
```

---

## 💡 Quick Test Sentences to Try in UI

1. **Campus Directions:** `"Where is the admissions office?"` ➔ `ADMISSION OFFICE WHERE`
2. **Fee Inquiries:** `"How much is the fee?"` ➔ `FEE HOW_MUCH`
3. **Document Submission:** `"Please bring your ID card."` ➔ `PLEASE YOUR ID_CARD BRING`
4. **Questions:** `"What is your name?"` ➔ `YOUR NAME WHAT`
5. **Conversational:** `"For the best experience."` ➔ `GOOD` (Thumbs-up)
6. **Hindi / Hinglish:** `"Aap kaise ho?"` ➔ `YOU HOW`
7. **Proper Nouns (Fingerspelling):** `"Meet Shreyas in room 104."` ➔ Spells `S-H-R-E-Y-A-S` with 3D finger letter poses.
