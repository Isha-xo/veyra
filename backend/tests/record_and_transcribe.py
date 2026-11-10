#!/usr/bin/env python3
"""Direct Microphone Recording and Live Transcription for SignBridge ASR.

Records directly from your Fedora machine's microphone and immediately transcribes
the speech using faster-whisper.

Usage:
    python backend/tests/record_and_transcribe.py [--duration 5] [--model-size small]
"""

import os
import sys
import time
import argparse
import subprocess

# Apply PyAV compatibility fix before importing faster_whisper
import backend.app.core.audio_compat  # noqa: F401
from faster_whisper import WhisperModel


def record_from_mic(output_wav_path: str, duration: int = 5) -> bool:
    """Record audio from the microphone using arecord (16kHz, 16-bit, Mono PCM)."""
    os.makedirs(os.path.dirname(output_wav_path), exist_ok=True)
    
    print("\n" + "=" * 50)
    print(f"🎤 MICROPHONE RECORDING ({duration} SECONDS)")
    print("=" * 50)
    print("Get ready to speak...")
    for i in range(3, 0, -1):
        print(f"  {i}...")
        time.sleep(1)
    
    print(f"\n🔴 RECORDING NOW ({duration}s)... Speak clearly!")
    
    # arecord: -d duration, -f format (S16_LE), -r sample rate (16000), -c channels (1)
    cmd = [
        "arecord",
        "-d", str(duration),
        "-f", "S16_LE",
        "-r", "16000",
        "-c", "1",
        "-q",  # quiet mode
        output_wav_path
    ]
    
    try:
        subprocess.run(cmd, check=True)
        print("⏹️  Recording complete!")
        print(f"💾 Audio saved to: {output_wav_path}")
        return True
    except FileNotFoundError:
        print("[-] Error: 'arecord' command not found. Please install alsa-utils.")
        return False
    except subprocess.CalledProcessError as e:
        print(f"[-] Recording failed: {e}")
        return False


def transcribe_recording(
    wav_path: str,
    model_size: str = "small",
    device: str = "cpu",
    compute_type: str = "int8"
):
    """Transcribe the recorded WAV file using faster-whisper."""
    print("\n" + "=" * 50)
    print(f"⚙️  FASTER-WHISPER TRANSCRIPTION (model={model_size})")
    print("=" * 50)
    print(f"[*] Initializing model '{model_size}' on {device} ({compute_type})...")
    print("[*] (If running for the first time, model weights will download automatically)")

    start_load = time.time()
    model = WhisperModel(model_size, device=device, compute_type=compute_type)
    print(f"[+] Model ready in {time.time() - start_load:.2f}s")

    print("[*] Transcribing audio...")
    start_transcribe = time.time()
    segments, info = model.transcribe(
        wav_path,
        beam_size=5,
        vad_filter=True
    )

    full_transcript = []
    print("\nDetected Segments:")
    for seg in segments:
        text = seg.text.strip()
        print(f"  [{seg.start:5.2f}s -> {seg.end:5.2f}s] {text}")
        full_transcript.append(text)

    elapsed = time.time() - start_transcribe
    transcript_text = " ".join(full_transcript).strip()

    print("\n" + "=" * 50)
    print("RESULTS:")
    print("=" * 50)
    print(f"🌐 Detected Language: {info.language} ({info.language_probability:.1%})")
    print(f"⏱️  Duration:          {info.duration:.2f}s")
    print(f"⚡ Processing Time:   {elapsed:.2f}s")
    print(f"📝 Full Transcript:   \"{transcript_text}\"")
    print("=" * 50 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Direct mic recording & transcription")
    parser.add_argument("--duration", type=int, default=5, help="Recording duration in seconds (default: 5)")
    parser.add_argument("--model-size", default="small", choices=["tiny", "base", "small", "medium", "large-v3"], help="Whisper model size")
    parser.add_argument("--output", default="backend/test_audio/my_recording.wav", help="Path to save recorded audio")

    args = parser.parse_args()

    success = record_from_mic(args.output, duration=args.duration)
    if success:
        transcribe_recording(args.output, model_size=args.model_size)
