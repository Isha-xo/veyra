#!/usr/bin/env python3
"""Setup script to download required NLTK data resources.

Downloads:
- punkt / punkt_tab (sentence & word tokenizers)
- averaged_perceptron_tagger / averaged_perceptron_tagger_eng (POS tagging)
- wordnet (lemmatization)
- stopwords (stop words list)

Total download size: ~15-20 MB.
"""

import nltk


def download_nltk_resources():
    resources = [
        "punkt",
        "punkt_tab",
        "averaged_perceptron_tagger",
        "averaged_perceptron_tagger_eng",
        "wordnet",
        "stopwords"
    ]
    
    print("\n" + "=" * 60)
    print("📦 DOWNLOADING NLTK RESOURCES FOR SIGNBRIDGE NLP")
    print("=" * 60)
    
    for res in resources:
        try:
            print(f"[*] Downloading '{res}'...")
            nltk.download(res, quiet=True)
            print(f"    [+] '{res}' is ready.")
        except Exception as e:
            print(f"    [-] Failed downloading '{res}': {e}")
            
    print("=" * 60)
    print("✅ All NLTK resources downloaded successfully!")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    download_nltk_resources()
