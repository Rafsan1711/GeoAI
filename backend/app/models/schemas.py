"""
Pydantic schemas — request/response models for all API endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional, Any
from enum import Enum


class AnswerEnum(str, Enum):
    YES          = "yes"
    PROBABLY     = "probably"
    DONT_KNOW    = "dontknow"
    PROBABLY_NOT = "probablynot"
    NO           = "no"


# ── Requests ─────────────────────────────────────────────────

class StartGameRequest(BaseModel):
    place_type: Optional[str] = None   # None = all types mixed
    
class AnswerRequest(BaseModel):
    session_id: str
    answer: AnswerEnum

class QuestionRequest(BaseModel):
    session_id: str

class PredictRequest(BaseModel):
    session_id: str

class FeedbackRequest(BaseModel):
    session_id:        str
    actual_place_name: Optional[str] = None
    actual_place_id:   Optional[str] = None


# ── Responses ─────────────────────────────────────────────────

class PlaceOut(BaseModel):
    id:          str
    name:        str
    type:        str
    emoji:       Optional[str] = None
    description: Optional[str] = None
    fun_fact:    Optional[str] = None

class QuestionOut(BaseModel):
    question_text: str
    attribute:     str
    value:         Any
    stage:         int

class TopCandidate(BaseModel):
    name:        str
    emoji:       Optional[str]
    probability: float   # 0-100 percentage

class StartGameResponse(BaseModel):
    session_id:    str
    total_places:  int
    message:       str

class QuestionResponse(BaseModel):
    question:            Optional[QuestionOut]
    ready_to_guess:      bool
    confidence:          float
    questions_asked:     int
    active_places_count: int
    top_candidates:      list[TopCandidate]

class AnswerResponse(BaseModel):
    confidence:          float
    questions_asked:     int
    active_places_count: int
    should_stop:         bool
    top_candidates:      list[TopCandidate]

class PredictionResponse(BaseModel):
    prediction:      Optional[PlaceOut]
    confidence:      int
    alternatives:    list[PlaceOut]
    questions_asked: int
    total_places:    int
    remaining:       int

class FeedbackResponse(BaseModel):
    status:  str
    message: str

class HealthResponse(BaseModel):
    status:  str
    version: str
    engine:  str
    db:      str
    cache:   str