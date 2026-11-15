from typing import List, Dict, Optional
from pydantic import BaseModel, Field


class NLPRequest(BaseModel):
    """Input payload for text-to-ISL NLP processing."""
    text: str = Field(
        ...,
        min_length=1,
        description="Spoken transcript or typed text in English, Hindi, or Hinglish",
        examples=["The admissions office is on the first floor."]
    )


class ISLAnimationToken(BaseModel):
    """Individual sign language animation token with asset mapping."""
    token: str = Field(..., description="Uppercase gloss or fingerspelling token", examples=["ADMISSION"])
    type: str = Field(..., description="'word' for full sign, or 'fingerspell' for letter sign", examples=["word"])
    asset: str = Field(..., description="Associated video asset filename", examples=["ADMISSION.mp4"])


class IntentClassification(BaseModel):
    """Extracted intent and domain slots."""
    intent: str = Field(..., description="Classified user intent", examples=["find_location"])
    confidence: float = Field(..., description="Classification confidence score", examples=[0.95])
    slots: Dict[str, str] = Field(default_factory=dict, description="Extracted domain entities/slots")


class NLPResponse(BaseModel):
    """Standardized response contract for Indian Sign Language NLP."""
    original_text: str = Field(..., description="Original input text")
    isl_grammar_text: str = Field(..., description="Grammatically reordered ISL sentence", examples=["ADMISSION OFFICE FIRST FLOOR"])
    isl_tokens: List[str] = Field(..., description="Ordered list of sign gloss tokens", examples=[["ADMISSION", "OFFICE", "FIRST", "FLOOR"]])
    animation_sequence: List[ISLAnimationToken] = Field(..., description="Sequence of animation assets for the frontend player")
    intent: IntentClassification = Field(..., description="Intent and extracted slot parameters")
