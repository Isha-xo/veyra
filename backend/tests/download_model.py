#!/usr/bin/env python3
"""Dedicated Whisper Model Downloader with Visual Progress Bar.

Usage:
    python backend/tests/download_model.py [--model-size small]
"""

import sys
import argparse
from huggingface_hub import snapshot_download

MODEL_MAP = {
    "tiny": "Systran/faster-whisper-tiny",
    "base": "Systran/faster-whisper-base",
    "small": "Systran/faster-whisper-small",
    "medium": "Systran/faster-whisper-medium",
    "large-v3": "Systran/faster-whisper-large-v3",
}

ALLOW_PATTERNS = [
    "config.json",
    "preprocessor_config.json",
    "model.bin",
    "tokenizer.json",
    "vocabulary.*",
]


def download(model_size: str = "small"):
    repo_id = MODEL_MAP.get(model_size, model_size)
    print("\n" + "=" * 60)
    print(f"📥 DOWNLOADING FASTER-WHISPER MODEL: {model_size}")
    print(f"Repository: {repo_id}")
    print("=" * 60)
    print("Resuming from cached chunks if available...\n")

    try:
        path = snapshot_download(
            repo_id=repo_id,
            allow_patterns=ALLOW_PATTERNS,
            # Normal tqdm progress bar enabled
        )
        print("\n" + "=" * 60)
        print(f"✅ SUCCESS! Model '{model_size}' is fully downloaded and cached.")
        print(f"Cached at: {path}")
        print("=" * 60 + "\n")
        return path
    except Exception as e:
        print(f"\n❌ Error during download: {e}")
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download faster-whisper model weights")
    parser.add_argument("--model-size", default="small", choices=["tiny", "base", "small", "medium", "large-v3"])
    args = parser.parse_args()
    download(args.model_size)
