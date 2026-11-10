#!/usr/bin/env python3
"""Standalone script to test faster-whisper speech recognition on local audio files.

Usage:
    python backend/tests/test_asr_standalone.py [path_to_audio_file] [--model-size small] [--device cpu]
"""

import sys
import os
import time
import argparse
from faster_whisper import WhisperModel


def run_standalone_test(
    audio_path: str,
    model_size: str = "small",
    device: str = "cpu",
    compute_type: str = "int8",
    beam_size: int = 5,
    vad_filter: bool = True
):
    if not os.path.exists(audio_path):
        print(f"[-] Error: Audio file '{audio_path}' not found.")
        sys.exit(1)

    print(f"[*] Initializing faster-whisper (model={model_size}, device={device}, compute_type={compute_type})...")
    print("[*] Note: If this model is not cached locally, it will download weights from Hugging Face.")
    
    start_load = time.time()
    model = WhisperModel(model_size, device=device, compute_type=compute_type)
    load_time = time.time() - start_load
    print(f"[+] Model loaded in {load_time:.2f} seconds.")

    print(f"[*] Transcribing '{audio_path}'...")
    start_transcribe = time.time()
    segments, info = model.transcribe(
        audio_path,
        beam_size=beam_size,
        vad_filter=vad_filter
    )

    print("\n" + "=" * 50)
    print(f"Detected Language: {info.language} (Probability: {info.language_probability:.2%})")
    print(f"Audio Duration:    {info.duration:.2f} seconds")
    print("=" * 50)
    print("Segments:")

    full_transcript = []
    for segment in segments:
        text = segment.text.strip()
        print(f"  [{segment.start:5.2f}s -> {segment.end:5.2f}s] {text}")
        full_transcript.append(text)

    transcribe_time = time.time() - start_transcribe
    print("=" * 50)
    print(f"Full Transcript:   {' '.join(full_transcript)}")
    print(f"Inference Time:    {transcribe_time:.2f} seconds")
    if info.duration > 0:
        rtf = transcribe_time / info.duration
        print(f"Real-Time Factor:  {rtf:.2f}x (lower is faster; <1.0 means faster than real-time)")
    print("=" * 50 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Standalone faster-whisper tester")
    parser.add_argument("audio", nargs="?", default="backend/test_audio/english.wav", help="Path to audio file")
    parser.add_argument("--model-size", default="small", choices=["tiny", "base", "small", "medium"], help="Whisper model size")
    parser.add_argument("--device", default="cpu", help="Device (cpu or cuda)")
    parser.add_argument("--compute-type", default="int8", help="Compute type (int8, float16, float32)")
    parser.add_argument("--beam-size", type=int, default=5, help="Beam size")

    args = parser.parse_args()
    run_standalone_test(
        audio_path=args.audio,
        model_size=args.model_size,
        device=args.device,
        compute_type=args.compute_type,
        beam_size=args.beam_size
    )
