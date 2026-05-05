"""
Atlas GMP Inference Engine — main coordinator.

Flow per game:
  1. start_game()        → load places + questions, init state
  2. get_next_question() → QuestionSelector picks best question
  3. process_answer()    → update probabilities, Bayesian beliefs
  4. get_prediction()    → return top place with confidence
  5. handle_feedback()   → user correction → boost correct place
"""

import uuid
from typing import Optional
from .question_selector import QuestionSelector
from .probability_manager import ProbabilityManager
from .confidence_calculator import ConfidenceCalculator
from .bayesian_network import BayesianNetwork
from .feature_importance import FeatureImportance
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


def _make_session(places: list[dict], questions: list[dict]) -> dict:
    """Build a fresh in-memory game session dict."""
    n = len(places)
    init_prob = 1.0 / n if n else 0.0
    items = []
    for p in places:
        items.append({
            "id":          p["id"],
            "name":        p["name"],
            "type":        p.get("type", "place"),
            "emoji":       p.get("emoji"),
            "description": p.get("description", ""),
            "fun_fact":    p.get("fun_fact", ""),
            "attributes":  p.get("attributes", {}),
            "probability": init_prob,
            "eliminated":  False,
            "evidence":    [],
        })
    return {
        "session_id":       str(uuid.uuid4()),
        "items":            items,
        "questions":        questions,
        "questions_asked":  0,
        "answer_history":   [],        # list of [question_dict, answer_str]
        "current_question": None,
        "asked_texts":      [],
    }


class InferenceEngine:

    def __init__(self):
        self.selector  = QuestionSelector()
        self.prob_mgr  = ProbabilityManager()
        self.conf_calc = ConfidenceCalculator()
        self.fi        = FeatureImportance()

    def load_feature_importance(self, fi_scores: dict[str, float]):
        self.selector.load_feature_importance(fi_scores)

    # ── Start ─────────────────────────────────────────────────

    def start_game(self, places: list[dict], questions: list[dict]) -> dict:
        session = _make_session(places, questions)
        logger.info(
            "Game started",
            session_id=session["session_id"],
            places=len(places),
            questions=len(questions),
        )
        return session

    # ── Question ──────────────────────────────────────────────

    def get_next_question(self, session: dict) -> Optional[dict]:
        """Returns next question dict or None (= time to guess)."""
        items  = session["items"]
        active = [i for i in items if not i["eliminated"]]

        if self._should_stop(session):
            return None

        available = [
            q for q in session["questions"]
            if q["question_text"] not in session["asked_texts"]
        ]

        bn = self._build_bayesian(session)
        history = [(h[0], h[1]) for h in session["answer_history"]]

        question = self.selector.select(available, active, bn, history)

        if question is None:
            return None

        session["current_question"] = question
        session["questions_asked"] += 1
        session["asked_texts"].append(question["question_text"])

        return question

    # ── Answer ────────────────────────────────────────────────

    def process_answer(self, session: dict, answer: str) -> dict:
        question = session["current_question"]
        if not question:
            raise ValueError("No active question")

        session["answer_history"].append([question, answer])

        active_before = sum(1 for i in session["items"] if not i["eliminated"])
        conf_before   = self.conf_calc.calculate(
            [i for i in session["items"] if not i["eliminated"]]
        )

        # Update probabilities
        self.prob_mgr.update_all(session["items"], question, answer)
        self.prob_mgr.soft_filter(session["items"])

        active_after = sum(1 for i in session["items"] if not i["eliminated"])
        active_items = [i for i in session["items"] if not i["eliminated"]]
        conf_after   = self.conf_calc.calculate(active_items)

        should_stop = self._should_stop(session)
        top         = self._top_candidates(active_items, 10)

        return {
            "confidence":          round(conf_after, 1),
            "confidence_before":   round(conf_before, 1),
            "questions_asked":     session["questions_asked"],
            "active_places_count": active_after,
            "should_stop":         should_stop,
            "top_candidates":      top,
        }

    # ── Prediction ────────────────────────────────────────────

    def get_prediction(self, session: dict) -> dict:
        active = [i for i in session["items"] if not i["eliminated"]]
        conf   = self.conf_calc.calculate(active)
        top    = sorted(active, key=lambda x: x["probability"], reverse=True)

        prediction = None
        alternatives = []
        if top:
            best = top[0]
            prediction = {
                "id":          best["id"],
                "name":        best["name"],
                "type":        best["type"],
                "emoji":       best.get("emoji"),
                "description": best.get("description", ""),
                "fun_fact":    best.get("fun_fact", ""),
            }
            alternatives = [
                {"id": i["id"], "name": i["name"], "type": i["type"],
                 "emoji": i.get("emoji"), "description": i.get("description", ""),
                 "fun_fact": i.get("fun_fact", "")}
                for i in top[1:4]
            ]

        logger.info(
            "Prediction made",
            session_id=session["session_id"],
            prediction=prediction["name"] if prediction else "None",
            confidence=round(conf, 1),
            questions=session["questions_asked"],
        )

        return {
            "prediction":     prediction,
            "confidence":     int(conf),
            "alternatives":   alternatives,
            "questions_asked":session["questions_asked"],
            "total_places":   len(session["items"]),
            "remaining":      len(active),
        }

    # ── Feedback ──────────────────────────────────────────────

    def apply_feedback(self, session: dict, correct_place_id: str) -> dict:
        """Boost correct place, reduce everything else."""
        for item in session["items"]:
            if item["id"] == correct_place_id:
                item["probability"] *= 25.0
                item["eliminated"]   = False
            else:
                item["probability"] *= 0.04
        self.prob_mgr.normalize(session["items"])
        self.prob_mgr.soft_filter(session["items"])
        active = [i for i in session["items"] if not i["eliminated"]]
        return {"active_after_feedback": len(active)}

    # ── Helpers ───────────────────────────────────────────────

    def _should_stop(self, session: dict) -> bool:
        active = [i for i in session["items"] if not i["eliminated"]]
        n      = len(active)
        if n <= 2:
            return True
        if not any(
            q["question_text"] not in session["asked_texts"]
            for q in session["questions"]
        ):
            return True
        conf = self.conf_calc.calculate(active)
        return self.conf_calc.should_guess(conf, session["questions_asked"], n)

    def _top_candidates(self, active: list[dict], n: int = 10) -> list[dict]:
        ranked = sorted(active, key=lambda x: x["probability"], reverse=True)
        return [
            {"name": i["name"], "emoji": i.get("emoji"), "probability": round(i["probability"] * 100, 2)}
            for i in ranked[:n]
        ]

    def _build_bayesian(self, session: dict) -> BayesianNetwork:
        bn = BayesianNetwork()
        bn.build(session["items"], session["questions"])
        for q, ans in session["answer_history"]:
            bn.update(q, ans, session["items"])
        return bn