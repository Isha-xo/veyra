"""Indian Sign Language (ISL) Vocabulary and Dictionary Mapping.

Defines:
- Supported high-frequency core and campus vocabulary signs.
- Multilingual aliases (Hindi / Hinglish transliterations to English gloss).
- Alphabet and digit fingerspelling fallback mappings.
"""

from typing import List, Dict, Optional, Tuple

# Supported vocabulary signs mapped to their standard uppercase gloss token
# Each token maps to its video asset filename (e.g. 'PLEASE.mp4')
ISL_CORE_VOCABULARY: Dict[str, str] = {
    # Greetings & Common Politeness
    "HELLO": "HELLO.mp4",
    "NAMASTE": "HELLO.mp4",
    "PLEASE": "PLEASE.mp4",
    "KRIPYA": "PLEASE.mp4",
    "THANK_YOU": "THANK_YOU.mp4",
    "THANKS": "THANK_YOU.mp4",
    "DHANYAVAD": "THANK_YOU.mp4",
    "WELCOME": "WELCOME.mp4",
    "SORRY": "SORRY.mp4",
    "HELP": "HELP.mp4",
    "YES": "YES.mp4",
    "NO": "NO.mp4",
    "NOT": "NO.mp4",

    # Campus & Administration
    "ADMISSION": "ADMISSION.mp4",
    "OFFICE": "OFFICE.mp4",
    "CAMPUS": "CAMPUS.mp4",
    "COLLEGE": "COLLEGE.mp4",
    "UNIVERSITY": "UNIVERSITY.mp4",
    "LIBRARY": "LIBRARY.mp4",
    "CLASS": "CLASS.mp4",
    "CLASSROOM": "CLASS.mp4",
    "LAB": "LAB.mp4",
    "DEPARTMENT": "DEPARTMENT.mp4",

    # Documents & Transactions
    "ID_CARD": "ID_CARD.mp4",
    "ID": "ID_CARD.mp4",
    "CARD": "CARD.mp4",
    "FEE": "FEE.mp4",
    "FEES": "FEE.mp4",
    "RECEIPT": "RECEIPT.mp4",
    "FORM": "FORM.mp4",
    "DOCUMENT": "DOCUMENT.mp4",
    "DOCUMENTS": "DOCUMENT.mp4",
    "APPLICATION": "FORM.mp4",
    "CERTIFICATE": "CERTIFICATE.mp4",

    # Locations & Directions
    "FIRST": "FIRST.mp4",
    "SECOND": "SECOND.mp4",
    "THIRD": "THIRD.mp4",
    "FOURTH": "FOURTH.mp4",
    "FLOOR": "FLOOR.mp4",
    "GROUND_FLOOR": "GROUND_FLOOR.mp4",
    "ROOM": "ROOM.mp4",
    "BUILDING": "BUILDING.mp4",
    "ENTRANCE": "ENTRANCE.mp4",
    "EXIT": "EXIT.mp4",
    "LEFT": "LEFT.mp4",
    "RIGHT": "RIGHT.mp4",
    "STRAIGHT": "STRAIGHT.mp4",
    "HERE": "HERE.mp4",
    "THERE": "THERE.mp4",

    # Actions / Verbs
    "BRING": "BRING.mp4",
    "SUBMIT": "SUBMIT.mp4",
    "PAY": "PAY.mp4",
    "COLLECT": "COLLECT.mp4",
    "COME": "COME.mp4",
    "GO": "GO.mp4",
    "TAKE": "TAKE.mp4",
    "GIVE": "GIVE.mp4",
    "SHOW": "SHOW.mp4",
    "MEET": "MEET.mp4",
    "WAIT": "WAIT.mp4",
    "FILL": "FILL.mp4",

    # People & Pronouns
    "YOU": "YOU.mp4",
    "YOUR": "YOU.mp4",
    "ME": "ME.mp4",
    "I": "ME.mp4",
    "WE": "WE.mp4",
    "STUDENT": "STUDENT.mp4",
    "TEACHER": "TEACHER.mp4",
    "PROFESSOR": "TEACHER.mp4",
    "OFFICER": "OFFICER.mp4",
    "STAFF": "STAFF.mp4",

    # Question Words (Wh- words in ISL move to the end of the sentence)
    "WHERE": "WHERE.mp4",
    "WHAT": "WHAT.mp4",
    "WHEN": "WHEN.mp4",
    "HOW": "HOW.mp4",
    "WHO": "WHO.mp4",
    "WHICH": "WHICH.mp4",
}

# Multi-word compound mappings (e.g. "id card" -> "ID_CARD")
COMPOUND_WORDS_MAP: Dict[str, str] = {
    "id card": "ID_CARD",
    "identity card": "ID_CARD",
    "admissions office": "ADMISSION OFFICE",
    "admission office": "ADMISSION OFFICE",
    "fee receipt": "FEE RECEIPT",
    "fees receipt": "FEE RECEIPT",
    "first floor": "FIRST FLOOR",
    "second floor": "SECOND FLOOR",
    "third floor": "THIRD FLOOR",
    "ground floor": "GROUND_FLOOR",
    "thank you": "THANK_YOU",
}

# Hindi & Hinglish transliteration phrases to standard ISL gloss
HINDI_HINGLISH_ALIASES: Dict[str, str] = {
    "pehchan patra": "ID_CARD",
    "pehchan": "ID_CARD",
    "apna": "YOUR",
    "kripya": "PLEASE",
    "krippia": "PLEASE",
    "aaiye": "COME",
    "aao": "COME",
    "laao": "BRING",
    "laaiye": "BRING",
    "lekar": "BRING",
    "jama": "SUBMIT",
    "karyalay": "OFFICE",
    "kaksh": "ROOM",
    "shulk": "FEE",
    "kahan": "WHERE",
    "kidhar": "WHERE",
    "kya": "WHAT",
    "namaste": "HELLO",
    "namaskar": "HELLO",
    "dhanyavad": "THANK_YOU",
    "pe": "AT",
    "hai": "",  # Auxiliary copula - removed in ISL
}

# Non-signing auxiliary stop words that are removed in Indian Sign Language grammar
ISL_STOP_WORDS = {
    "is", "am", "are", "was", "were", "be", "been", "being",
    "a", "an", "the",
    "to", "of", "in", "on", "at", "by", "for", "with", "about",
    "into", "through", "during", "before", "after", "above", "below",
    "from", "up", "down", "out", "over", "under", "again",
    "do", "does", "did", "shall", "will", "would", "should", "can", "could", "may", "might"
}


def get_token_sign(word: str) -> Optional[str]:
    """Check if word exists in ISL dictionary."""
    clean = word.upper().strip()
    return ISL_CORE_VOCABULARY.get(clean)


def get_fingerspelling_tokens(word: str) -> List[Tuple[str, str]]:
    """Convert an unknown word into a list of fingerspelling sign tuples: (token, asset)."""
    clean = "".join(ch for ch in word.upper() if ch.isalnum())
    tokens = []
    for ch in clean:
        tokens.append((f"_SPELL_{ch}", f"{ch}.mp4"))
    return tokens
