import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.nlp_service import NLPService

client = TestClient(app)
nlp_service = NLPService()


def test_admissions_office_sentence():
    """Test standard campus navigation sentence."""
    res = nlp_service.process_text("The admissions office is on the first floor.")
    assert "ADMISSION" in res.isl_tokens
    assert "OFFICE" in res.isl_tokens
    assert "FIRST" in res.isl_tokens
    assert "FLOOR" in res.isl_tokens
    # Ensure stop words 'the', 'is', 'on' are completely removed
    assert "THE" not in res.isl_tokens
    assert "IS" not in res.isl_tokens
    assert "ON" not in res.isl_tokens
    assert res.intent.intent in ("find_location", "admission_inquiry")


def test_question_word_to_end():
    """In ISL, Wh-question words must be placed at the end of the sentence."""
    res = nlp_service.process_text("Where is the library?")
    assert res.isl_tokens[-1] == "WHERE"
    assert "LIBRARY" in res.isl_tokens
    assert res.intent.intent == "find_location"


def test_svo_to_sov_reordering():
    """Verify verb 'BRING' is moved after the object 'ID_CARD'."""
    res = nlp_service.process_text("Please bring your ID card.")
    assert "PLEASE" in res.isl_tokens
    assert "ID_CARD" in res.isl_tokens
    assert "BRING" in res.isl_tokens
    # Verb 'BRING' should be after 'ID_CARD' in SOV grammar
    id_card_idx = res.isl_tokens.index("ID_CARD")
    bring_idx = res.isl_tokens.index("BRING")
    assert bring_idx > id_card_idx


def test_hindi_transliteration_to_isl():
    """Test Hindi / Hinglish phrases mapping to standard ISL signs."""
    res = nlp_service.process_text("Kripya apna pehchan patra laaiye.")
    assert "PLEASE" in res.isl_tokens
    assert "ID_CARD" in res.isl_tokens
    assert "BRING" in res.isl_tokens
    assert res.intent.intent == "submit_document"


def test_fingerspelling_fallback():
    """Unknown proper nouns must trigger letter-by-letter fingerspelling."""
    res = nlp_service.process_text("Meet Shreyas in room 104.")
    tokens = res.isl_tokens
    # 'Shreyas' is not a standard dictionary sign -> fingerspelled
    assert "_SPELL_S" in tokens
    assert "_SPELL_H" in tokens
    assert "_SPELL_R" in tokens
    assert "_SPELL_E" in tokens
    assert "_SPELL_Y" in tokens
    assert "_SPELL_A" in tokens
    # Digits '1', '0', '4'
    assert "1" in tokens
    assert "0" in tokens
    assert "4" in tokens


def test_nlp_api_endpoint():
    """Test FastAPI POST /api/v1/nlp/process endpoint."""
    response = client.post(
        "/api/v1/nlp/process",
        json={"text": "Where is the library?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["isl_grammar_text"] == "LIBRARY WHERE"
    assert "WHERE" in data["isl_tokens"]
    assert data["intent"]["intent"] == "find_location"
    assert len(data["animation_sequence"]) == 2
    assert data["animation_sequence"][0]["asset"] == "LIBRARY.mp4"
    assert data["animation_sequence"][1]["asset"] == "WHERE.mp4"


def test_nlp_api_empty_payload():
    """Test 422 or 400 validation on empty payload."""
    response = client.post("/api/v1/nlp/process", json={"text": ""})
    assert response.status_code == 422


def test_conversational_words_and_contractions():
    """Ensure everyday words like 'okay', 'it's okay', 'where's' don't break into fingerspelling."""
    res_okay = nlp_service.process_text("Okay")
    assert "OKAY" in res_okay.isl_tokens
    assert "_SPELL_O" not in res_okay.isl_tokens

    res_its_okay = nlp_service.process_text("It's okay.")
    assert "OK" in res_its_okay.isl_tokens
    assert "_SPELL_I" not in res_its_okay.isl_tokens
    assert "_SPELL_S" not in res_its_okay.isl_tokens

    res_contraction = nlp_service.process_text("Where's the library?")
    assert "LIBRARY" in res_contraction.isl_tokens
    assert "WHERE" in res_contraction.isl_tokens
    assert "_SPELL_S" not in res_contraction.isl_tokens

    res_name = nlp_service.process_text("What's your name?")
    assert "YOUR" in res_name.isl_tokens
    assert "NAME" in res_name.isl_tokens
    assert "WHAT" in res_name.isl_tokens
    assert "_SPELL_S" not in res_name.isl_tokens


def test_hindi_conversational_words():
    """Test Hindi colloquial words like theek hai, achha, sahi hai."""
    res_theek = nlp_service.process_text("theek hai")
    assert "OK" in res_theek.isl_tokens
    assert "_SPELL_T" not in res_theek.isl_tokens

    res_achha = nlp_service.process_text("achha")
    assert "GOOD" in res_achha.isl_tokens
    assert "_SPELL_A" not in res_achha.isl_tokens
