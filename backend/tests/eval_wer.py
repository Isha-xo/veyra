#!/usr/bin/env python3
"""Benchmark and Word Error Rate (WER) evaluation suite for SignBridge ASR.

Uses `jiwer` to measure:
- WER (Word Error Rate): (Substitutions + Deletions + Insertions) / Total Words
- MER (Match Error Rate)
- WIL (Word Information Lost)

Usage:
    python backend/tests/eval_wer.py [--manifest backend/tests/samples.json] [--model-size small]
"""

import os
import json
import argparse
from typing import List, Dict, Any
import jiwer

# Apply PyAV compatibility fix before importing faster_whisper
import backend.app.core.audio_compat  # noqa: F401
from faster_whisper import WhisperModel


# Standard text normalization transformation for fair WER comparison
wer_transform = jiwer.Compose([
    jiwer.ToLowerCase(),
    jiwer.RemovePunctuation(),
    jiwer.RemoveMultipleSpaces(),
    jiwer.Strip(),
    jiwer.ReduceToListOfListOfWords()
])


def evaluate_dataset(
    manifest_path: str,
    model_size: str = "small",
    device: str = "cpu",
    compute_type: str = "int8"
) -> Dict[str, Any]:
    if not os.path.exists(manifest_path):
        print(f"[-] Error: Evaluation manifest '{manifest_path}' not found.")
        return {}

    with open(manifest_path, "r", encoding="utf-8") as f:
        samples = json.load(f)

    if not samples:
        print("[-] Manifest contains no test samples.")
        return {}

    print(f"[*] Loading faster-whisper model '{model_size}' on {device} ({compute_type})...")
    model = WhisperModel(model_size, device=device, compute_type=compute_type)

    references = []
    hypotheses = []
    results_detail = []

    print(f"\n[*] Evaluating {len(samples)} test cases...\n")

    for idx, item in enumerate(samples, 1):
        audio_path = item["audio_path"]
        reference_text = item["reference_text"]
        lang_category = item.get("category", "General")

        if not os.path.exists(audio_path):
            print(f"  [!] Skipped sample #{idx} ({audio_path}): file does not exist.")
            continue

        # Transcribe
        segments, info = model.transcribe(audio_path, beam_size=5, vad_filter=True)
        hypothesis_text = " ".join([seg.text.strip() for seg in segments]).strip()

        # Compute individual sample WER
        sample_wer = jiwer.wer(
            reference_text,
            hypothesis_text,
            reference_transform=wer_transform,
            hypothesis_transform=wer_transform
        )

        references.append(reference_text)
        hypotheses.append(hypothesis_text)

        results_detail.append({
            "id": idx,
            "category": lang_category,
            "audio_file": os.path.basename(audio_path),
            "reference": reference_text,
            "hypothesis": hypothesis_text,
            "wer": round(sample_wer, 4),
            "detected_language": info.language,
            "language_probability": round(info.language_probability, 4)
        })

        print(f"Sample #{idx} [{lang_category}]:")
        print(f"  Ref:  {reference_text}")
        print(f"  Hyp:  {hypothesis_text}")
        print(f"  WER:  {sample_wer:.2%}\n")

    if not references:
        print("[-] No valid audio files were evaluated.")
        return {}

    # Overall dataset metrics
    overall_wer = jiwer.wer(
        references,
        hypotheses,
        reference_transform=wer_transform,
        hypothesis_transform=wer_transform
    )
    overall_mer = jiwer.mer(
        references,
        hypotheses,
        reference_transform=wer_transform,
        hypothesis_transform=wer_transform
    )
    overall_wil = jiwer.wil(
        references,
        hypotheses,
        reference_transform=wer_transform,
        hypothesis_transform=wer_transform
    )

    summary = {
        "model_size": model_size,
        "device": device,
        "compute_type": compute_type,
        "total_samples": len(results_detail),
        "overall_wer": round(overall_wer, 4),
        "overall_mer": round(overall_mer, 4),
        "overall_wil": round(overall_wil, 4),
        "details": results_detail
    }

    print("=" * 60)
    print("BENCHMARK EVALUATION SUMMARY")
    print("=" * 60)
    print(f"Total Evaluated Samples: {len(results_detail)}")
    print(f"Overall Word Error Rate (WER):     {overall_wer:.2%}")
    print(f"Overall Match Error Rate (MER):    {overall_mer:.2%}")
    print(f"Overall Word Info Lost (WIL):      {overall_wil:.2%}")
    print("=" * 60)

    return summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate SignBridge ASR using jiwer")
    parser.add_argument("--manifest", default="backend/tests/eval_samples.json", help="Path to evaluation JSON manifest")
    parser.add_argument("--model-size", default="small", help="Whisper model size")
    parser.add_argument("--output", default="backend/tests/eval_results.json", help="Path to save results")

    args = parser.parse_args()
    summary = evaluate_dataset(manifest_path=args.manifest, model_size=args.model_size)
    if summary:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        print(f"[+] Detailed evaluation results saved to '{args.output}'")
