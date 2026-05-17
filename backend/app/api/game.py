"""
Game API endpoints — v2.
Session state stored in Redis (falls back to in-memory dict).
"""

from fastapi import APIRouter, HTTPException, Request
from app.models.schemas import (
    StartGameRequest, AnswerRequest, QuestionRequest,
    PredictRequest, FeedbackRequest,
    StartGameResponse, QuestionResponse, AnswerResponse,
    PredictionResponse, FeedbackResponse,
    QuestionOut, PlaceOut, TopCandidate,
)
from app.services.redis_service import RedisService
from app.services.supabase_service import SupabaseService
from atlas_engine.inference_engine import InferenceEngine
from app.utils.logger import setup_logger

logger = setup_logger(__name__)
router = APIRouter()

# Fallback in-memory store when Redis unavailable
_memory_sessions: dict[str, dict] = {}

# Single engine instance — stateless logic, shared across requests
_engine = InferenceEngine()


# ── Session helpers ───────────────────────────────────────────

async def _save(session_id: str, session: dict):
    ok = await RedisService.save_session(session_id, session)
    if not ok:
        _memory_sessions[session_id] = session


async def _load(session_id: str) -> dict | None:
    data = await RedisService.load_session(session_id)
    if data:
        return data
    return _memory_sessions.get(session_id)


async def _delete(session_id: str):
    await RedisService.delete_session(session_id)
    _memory_sessions.pop(session_id, None)


# ── Endpoints ─────────────────────────────────────────────────

@router.post("/game/start", response_model=StartGameResponse)
async def start_game(req: StartGameRequest):
    places    = SupabaseService.get_all_active_places(req.place_type)
    questions = SupabaseService.get_all_questions(req.place_type)

    if not places:
        raise HTTPException(
            status_code=503,
            detail="No places found in database. Please check Supabase."
        )
    if not questions:
        raise HTTPException(
            status_code=503,
            detail="No questions found in database. Please check Supabase."
        )

    session = _engine.start_game(places, questions)
    await _save(session["session_id"], session)

    logger.info(
        "Game started",
        session_id=session["session_id"],
        place_type=req.place_type or "all",
        places=len(places),
        questions=len(questions),
    )

    return StartGameResponse(
        session_id=session["session_id"],
        total_places=len(places),
        message="Game started — think of a place!",
    )


@router.post("/game/question", response_model=QuestionResponse)
async def get_question(req: QuestionRequest):
    session = await _load(req.session_id)
    if not session:
        raise HTTPException(
            status_code=400,
            detail="Session not found or expired. Please start a new game."
        )

    active  = [i for i in session["items"] if not i["eliminated"]]
    conf    = _engine.conf_calc.calculate(active)
    top     = _engine._top_candidates(active, 10)
    top_out = [
        TopCandidate(
            name=c["name"],
            emoji=c.get("emoji"),
            probability=c["probability"],
        )
        for c in top
    ]

    question = _engine.get_next_question(session)
    await _save(req.session_id, session)

    q_out = None
    if question:
        q_out = QuestionOut(
            question_text=question["question_text"],
            attribute=question["attribute"],
            value=question.get("value"),
            stage=question.get("stage", 5),
        )

    return QuestionResponse(
        question=q_out,
        ready_to_guess=(question is None),
        confidence=round(conf, 1),
        questions_asked=session["questions_asked"],
        active_places_count=len(active),
        top_candidates=top_out,
    )


@router.post("/game/answer", response_model=AnswerResponse)
async def process_answer(req: AnswerRequest):
    session = await _load(req.session_id)
    if not session:
        raise HTTPException(
            status_code=400,
            detail="Session not found or expired. Please start a new game."
        )

    result = _engine.process_answer(session, req.answer.value)
    await _save(req.session_id, session)

    top_out = [
        TopCandidate(
            name=c["name"],
            emoji=c.get("emoji"),
            probability=c["probability"],
        )
        for c in result["top_candidates"]
    ]

    return AnswerResponse(
        confidence=result["confidence"],
        questions_asked=result["questions_asked"],
        active_places_count=result["active_places_count"],
        should_stop=result["should_stop"],
        top_candidates=top_out,
    )


@router.post("/game/predict", response_model=PredictionResponse)
async def predict(req: PredictRequest):
    session = await _load(req.session_id)
    if not session:
        raise HTTPException(
            status_code=400,
            detail="Session not found or expired. Please start a new game."
        )

    result = _engine.get_prediction(session)

    # Log to Supabase (best-effort, don't block)
    try:
        SupabaseService.log_game_result({
            "session_token":    req.session_id,
            "status":           "active",
            "final_confidence": result["confidence"],
            "questions_asked":  result["questions_asked"],
        })
    except Exception:
        pass

    # Don't delete session yet — user needs to confirm correct/incorrect
    await _save(req.session_id, session)

    pred_out = None
    if result["prediction"]:
        p = result["prediction"]
        pred_out = PlaceOut(
            id=p["id"],
            name=p["name"],
            type=p["type"],
            emoji=p.get("emoji"),
            description=p.get("description"),
            fun_fact=p.get("fun_fact"),
        )

    alts_out = [
        PlaceOut(
            id=a["id"],
            name=a["name"],
            type=a["type"],
            emoji=a.get("emoji"),
            description=a.get("description"),
            fun_fact=a.get("fun_fact"),
        )
        for a in result["alternatives"]
    ]

    return PredictionResponse(
        prediction=pred_out,
        confidence=result["confidence"],
        alternatives=alts_out,
        questions_asked=result["questions_asked"],
        total_places=result["total_places"],
        remaining=result["remaining"],
    )


@router.post("/game/feedback", response_model=FeedbackResponse)
async def feedback(req: FeedbackRequest):
    session = await _load(req.session_id)
    if not session:
        raise HTTPException(
            status_code=400,
            detail="Session not found or expired."
        )

    correct_id = req.actual_place_id
    if not correct_id and req.actual_place_name:
        place = SupabaseService.get_place_by_name(req.actual_place_name)
        if place:
            correct_id = place["id"]

    if correct_id:
        _engine.apply_feedback(session, correct_id)
        await _save(req.session_id, session)

        # Update session status in Supabase
        try:
            SupabaseService.log_game_result({
                "session_token":       req.session_id,
                "status":              "incorrect",
                "corrected_place_id":  correct_id,
                "questions_asked":     session["questions_asked"],
            })
        except Exception:
            pass

        logger.info(
            "Feedback applied",
            session_id=req.session_id,
            correct_id=correct_id,
        )

        return FeedbackResponse(
            status="learning",
            message="Got it! Atlas is learning from this. Try another place!",
        )

    return FeedbackResponse(
        status="unknown_place",
        message="Place not found in database yet. We'll add it soon via AtlasMind!",
    )


@router.post("/game/correct")
async def mark_correct(req: PredictRequest):
    """Call this when user confirms Atlas was correct."""
    session = await _load(req.session_id)

    if session:
        try:
            SupabaseService.log_game_result({
                "session_token":    req.session_id,
                "status":           "correct",
                "questions_asked":  session["questions_asked"],
            })
        except Exception:
            pass
        await _delete(req.session_id)

    return {"status": "ok", "message": "Atlas scores another point! 🎉"}