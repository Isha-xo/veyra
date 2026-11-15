import os
import re
import logging
from typing import List, Dict, Tuple, Optional

import nltk

# Ensure workspace venv nltk_data is prioritized
_venv_nltk_data = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend/venv/nltk_data"))
if os.path.exists(_venv_nltk_data) and _venv_nltk_data not in nltk.data.path:
    nltk.data.path.insert(0, _venv_nltk_data)

from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from nltk.corpus import wordnet
from nltk import pos_tag

from backend.app.core.isl_vocab import (
    ISL_CORE_VOCABULARY,
    COMPOUND_WORDS_MAP,
    HINDI_HINGLISH_ALIASES,
    ISL_STOP_WORDS,
    get_token_sign,
    get_fingerspelling_tokens,
)
from backend.app.schemas.nlp import (
    NLPResponse,
    ISLAnimationToken,
    IntentClassification,
)

logger = logging.getLogger("signbridge.nlp")


class NLPService:
    """Natural Language Processing Service for SignBridge.
    
    Transforms English, Hindi, and Hinglish transcripts into:
    1. Intent Classification & Slot Extraction.
    2. Indian Sign Language (ISL) SOV Grammar (Subject-Object-Verb).
    3. Animation tokens and video asset sequences with fingerspelling fallback.
    """

    def __init__(self):
        self.lemmatizer = WordNetLemmatizer()
        self._ensure_nltk_resources()

    def _ensure_nltk_resources(self):
        """Safely ensure required NLTK resources are loaded."""
        try:
            wordnet.ensure_loaded()
        except Exception:
            try:
                nltk.download("wordnet", quiet=True)
                nltk.download("punkt", quiet=True)
                nltk.download("averaged_perceptron_tagger_eng", quiet=True)
                nltk.download("stopwords", quiet=True)
            except Exception as e:
                logger.warning(f"Could not verify NLTK resources automatically: {e}")

    @staticmethod
    def _get_wordnet_pos(treebank_tag: str):
        """Map POS tag to first character lemmatize() accepts."""
        if treebank_tag.startswith("J"):
            return wordnet.ADJ
        elif treebank_tag.startswith("V"):
            return wordnet.VERB
        elif treebank_tag.startswith("N"):
            return wordnet.NOUN
        elif treebank_tag.startswith("R"):
            return wordnet.ADV
        else:
            return wordnet.NOUN

    def _preprocess_text(self, text: str) -> str:
        """Normalize text and resolve compound words and Hindi/Hinglish aliases."""
        clean = text.lower().strip()
        # Remove special characters except alphanumeric, spaces, and question mark
        clean = re.sub(r"[^\w\s\?]", " ", clean)

        # Replace known multi-word compounds
        for phrase, replacement in COMPOUND_WORDS_MAP.items():
            pattern = r"\b" + re.escape(phrase) + r"\b"
            clean = re.sub(pattern, replacement, clean)

        # Replace Hindi & Hinglish transliterated phrases
        for phrase, replacement in HINDI_HINGLISH_ALIASES.items():
            pattern = r"\b" + re.escape(phrase) + r"\b"
            clean = re.sub(pattern, replacement, clean)

        # Collapse whitespace
        clean = re.sub(r"\s+", " ", clean).strip()
        return clean

    def _extract_intent_and_slots(self, original_text: str) -> IntentClassification:
        """Extract user intent and key domain entities (slots)."""
        lower = original_text.lower()
        slots: Dict[str, str] = {}

        # 1. Slot extraction: Floor numbers
        floor_match = re.search(r"\b(first|second|third|fourth|ground|1st|2nd|3rd|4th)\b", lower)
        if floor_match:
            slots["floor"] = floor_match.group(1)

        # Slot extraction: Departments / Campus Locations
        dept_match = re.search(r"\b(admission|admissions|library|lab|classroom|accounts|office)\b", lower)
        if dept_match:
            slots["department"] = dept_match.group(1)

        # Slot extraction: Documents
        doc_match = re.search(r"\b(id card|identity card|fee receipt|receipt|form|certificate)\b", lower)
        if doc_match:
            slots["document"] = doc_match.group(1)

        # Slot extraction: Actions
        action_match = re.search(r"\b(bring|submit|pay|collect|fill)\b", lower)
        if action_match:
            slots["action"] = action_match.group(1)

        # 2. Intent classification
        intent = "general_query"
        confidence = 0.85

        if any(w in lower for w in ["where", "which floor", "location", "kahan", "kidhar"]):
            intent = "find_location"
            confidence = 0.95
        elif any(w in lower for w in ["bring", "submit", "id card", "pehchan patra", "receipt", "document"]):
            intent = "submit_document"
            confidence = 0.95
        elif any(w in lower for w in ["fee", "fees", "pay", "shulk"]):
            intent = "inquire_fees"
            confidence = 0.90
        elif any(w in lower for w in ["admission", "admissions", "apply"]):
            intent = "admission_inquiry"
            confidence = 0.90
        elif any(w in lower for w in ["hello", "hi", "namaste", "good morning", "good afternoon"]):
            intent = "greeting"
            confidence = 0.98

        return IntentClassification(intent=intent, confidence=confidence, slots=slots)

    def _apply_isl_grammar(self, tagged_tokens: List[Tuple[str, str]], is_question: bool) -> List[str]:
        """Convert token sequence from English SVO to Indian Sign Language SOV grammar.
        
        ISL Grammar Rules applied:
        1. Non-signing auxiliary stop words removed ('is', 'the', 'a', 'to', etc.).
        2. Words lemmatized to root form.
        3. Subject-Object-Verb (SOV) ordering:
           [Politeness / Time] -> [Subject / Noun] -> [Object] -> [Verb] -> [Question word].
        4. In ISL questions, interrogative words ('WHERE', 'WHAT') move to the END.
        """
        politeness: List[str] = []
        subjects: List[str] = []
        objects: List[str] = []
        verbs: List[str] = []
        question_words: List[str] = []
        others: List[str] = []

        WH_WORDS = {"WHERE", "WHAT", "WHEN", "WHY", "HOW", "WHO", "WHICH"}
        POLITE_WORDS = {"PLEASE", "THANK_YOU", "WELCOME", "HELLO", "SORRY"}

        for word, tag in tagged_tokens:
            token = word.upper().strip()
            if not token:
                continue

            # Check if it's a stopword (unless it's an important question/polite word)
            if word.lower() in ISL_STOP_WORDS and token not in WH_WORDS:
                continue

            # Lemmatize
            pos_category = self._get_wordnet_pos(tag)
            lemma = self.lemmatizer.lemmatize(token.lower(), pos=pos_category).upper()

            # Categorize into grammatical buckets
            if lemma in POLITE_WORDS or token in POLITE_WORDS:
                politeness.append(token)
            elif lemma in WH_WORDS or token in WH_WORDS:
                question_words.append(token)
            elif tag.startswith("V"):  # Verb
                verbs.append(lemma)
            elif tag in ("PRP", "PRP$"):  # Pronoun (You, Me)
                subjects.append(lemma)
            elif tag.startswith("N"):  # Noun / Object
                # Distinguish subject vs object simply
                if not subjects:
                    subjects.append(lemma)
                else:
                    objects.append(lemma)
            elif tag.startswith("J") or tag.startswith("CD"):  # Adjective or Cardinal Number (e.g. First, Second)
                objects.append(lemma)
            else:
                others.append(lemma)

        # Assemble in ISL SOV order:
        # [Politeness] -> [Subject] -> [Others / Modifiers] -> [Object] -> [Verb] -> [Question]
        isl_ordered = politeness + subjects + others + objects + verbs + question_words
        return isl_ordered

    def process_text(self, text: str) -> NLPResponse:
        """Full pipeline: processes raw text into ISL grammar and animation sequence."""
        if not text or not text.strip():
            raise ValueError("Input text cannot be empty.")

        is_question = "?" in text or any(
            text.lower().startswith(w) for w in ["where", "what", "how", "when", "who", "which", "is", "can"]
        )

        # 1. Extract Intent and Entities
        intent_info = self._extract_intent_and_slots(text)

        # 2. Preprocess & Normalize
        normalized = self._preprocess_text(text)

        # 3. Tokenize & POS Tag
        tokens = word_tokenize(normalized)
        tagged = pos_tag(tokens)

        # 4. Apply ISL SOV Grammar
        isl_tokens = self._apply_isl_grammar(tagged, is_question=is_question)

        # Fallback if grammar produced an empty list
        if not isl_tokens:
            isl_tokens = [t.upper() for t in tokens if t.isalnum()]

        # 5. Generate Animation Sequence with Fingerspelling Fallback
        animation_sequence: List[ISLAnimationToken] = []
        final_gloss_list: List[str] = []

        for token in isl_tokens:
            # Handle multi-word tokens like "ID_CARD" or "ADMISSION OFFICE"
            parts = token.split()
            for part in parts:
                clean_part = re.sub(r"[^\w]", "", part)
                if not clean_part:
                    continue

                sign_asset = get_token_sign(clean_part)
                if sign_asset:
                    # Valid sign found in vocabulary
                    final_gloss_list.append(clean_part)
                    animation_sequence.append(
                        ISLAnimationToken(token=clean_part, type="word", asset=sign_asset)
                    )
                elif clean_part.isdigit():
                    # Digits fingerspelling (e.g. "104" -> 1.mp4, 0.mp4, 4.mp4)
                    for digit in clean_part:
                        final_gloss_list.append(digit)
                        animation_sequence.append(
                            ISLAnimationToken(token=digit, type="fingerspell", asset=f"{digit}.mp4")
                        )
                else:
                    # Unknown word -> Letter-by-letter fingerspelling fallback
                    spelling_tuples = get_fingerspelling_tokens(clean_part)
                    for sp_token, sp_asset in spelling_tuples:
                        final_gloss_list.append(sp_token)
                        animation_sequence.append(
                            ISLAnimationToken(token=sp_token, type="fingerspell", asset=sp_asset)
                        )

        isl_grammar_text = " ".join(final_gloss_list)

        return NLPResponse(
            original_text=text,
            isl_grammar_text=isl_grammar_text,
            isl_tokens=final_gloss_list,
            animation_sequence=animation_sequence,
            intent=intent_info,
        )


# Global singleton instance for FastAPI dependency injection
_nlp_service_instance: Optional[NLPService] = None


def get_nlp_service() -> NLPService:
    """Dependency provider for NLPService singleton."""
    global _nlp_service_instance
    if _nlp_service_instance is None:
        _nlp_service_instance = NLPService()
    return _nlp_service_instance
