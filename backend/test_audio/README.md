# Test Audio Recordings Directory

This folder holds audio recordings (`.wav`, `.webm`, `.mp3`) used to validate and benchmark the SignBridge ASR module.

## Recommended Test Matrix

| Filename | Language | Sample Sentence | Purpose |
| :--- | :--- | :--- | :--- |
| `english_id_card.wav` | English | "Please bring your ID card." | Standard baseline clarity test |
| `english_admissions.wav` | English | "The admissions office is on the first floor." | Navigation phrase, testing number words ("first") |
| `hindi_id_card.wav` | Hindi | "कृपया अपना पहचान पत्र लेकर आइए।" | Devanagari ASR accuracy |
| `hinglish_floor.wav` | Hinglish | "Admission office first floor pe hai." | Code-mixed sentence evaluation |

## Audio Recording Guidelines
- **Formats accepted:** `.wav` (PCM 16-bit 16kHz recommended), `.webm` (standard browser MediaRecorder), `.mp3`
- **Speaking speeds:** Test both normal conversational pace and fast speech.
- **Environment:** Test quiet office conditions vs background ambient noise (corridor/cafeteria).
