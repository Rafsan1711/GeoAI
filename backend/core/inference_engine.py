"""
Inference Engine — Akinator-style, context-aware, guaranteed-to-terminate AI.

Fixes in this version:
- get_next_question() returns None when question_selector finds nothing useful
  (active-item grounding removes impossible questions like "Russia border?" after
  Indian Subcontinent confirmed). This immediately triggers ready_to_guess=True
  in app.py, ending the game — no infinite loop.
- _should_stop_asking() is the single source-of-truth for stopping; it is called
  both after process_answer() and inside get_next_question().
- soft_filter() no longer takes top_k from GAME_CONFIG (removed aggressive top_k=3).
"""

import logging
from typing import List, Dict, Optional
import uuid

from .question_selector import QuestionSelector
from .probability_manager import ProbabilityManager
from .confidence_calculator import ConfidenceCalculator
from algorithms.information_gain import InformationGain
from algorithms.bayesian_network import BayesianNetwork
from models.game_state import GameState
from models.item_model import Item
from backend.config import GAME_CONFIG
from services.firebase_service import FirebaseService

logger = logging.getLogger(__name__)


class InferenceEngine:
    """Main AI Engine — Akinator-style, guaranteed termination."""

    def __init__(self):
        self.question_selector    = QuestionSelector()
        self.probability_manager  = ProbabilityManager()
        self.confidence_calculator = ConfidenceCalculator()
        self.information_gain     = InformationGain()
        self.bayesian_network     = BayesianNetwork()
        self.firebase_service     = FirebaseService()
        self.active_games: Dict[str, GameState] = {}
        self.session_stats = {
            'games_played': 0,
            'successful_guesses': 0,
            'average_questions': 0,
        }
        logger.info("InferenceEngine ready (v3.2 — context-aware, guaranteed termination)")

    # ── Game lifecycle ────────────────────────────────────────────────────────

    def start_new_game(self, category: str, items: List[Dict],
                       questions: List[Dict]) -> GameState:
        session_id   = str(uuid.uuid4())
        item_objects = [Item.from_dict({**d, 'probability': 0.0}) for d in items]
        init_prob    = 1.0 / len(item_objects) if item_objects else 0.0
        for item in item_objects:
            item.probability = init_prob

        game_state = GameState(
            session_id=session_id,
            category=category,
            items=item_objects,
            questions=questions,
        )
        self.active_games[session_id] = game_state
        self.bayesian_network.build_network(item_objects, questions)
        self.question_selector.calculate_feature_importance(item_objects, questions)
        self.firebase_service.save_game_state(game_state)
        logger.info(f"Game started: {session_id} | {len(item_objects)} items | "
                    f"{len(questions)} questions")
        return game_state

    def get_game_state(self, session_id: str) -> Optional[GameState]:
        if session_id in self.active_games:
            return self.active_games[session_id]
        data = self.firebase_service.load_game_state(session_id)
        if data:
            try:
                gs = GameState.from_dict(data)
                self.active_games[session_id] = gs
                self.bayesian_network.build_network(gs.items, gs.questions)
                self.question_selector.calculate_feature_importance(gs.items, gs.questions)
                return gs
            except Exception as e:
                logger.error(f"Failed to rebuild GameState {session_id}: {e}")
        return None

    # ── Question flow ─────────────────────────────────────────────────────────

    def get_next_question(self, game_state: GameState) -> Optional[Dict]:
        """
        Returns the best next question, or None if the game should end.
        None can mean:
          (a) confidence/item-count threshold reached → ready to guess
          (b) no useful question left after active-item grounding → ready to guess
        Both cases set ready_to_guess=True in app.py.
        """
        # Check stopping conditions first
        if self._should_stop_asking(game_state):
            logger.info(f"[{game_state.session_id}] Stop condition met before question select.")
            return None

        active_items        = game_state.get_active_items()
        available_questions = game_state.get_available_questions()

        if not active_items or not available_questions:
            logger.info(f"[{game_state.session_id}] No items or questions left → guess.")
            return None

        question = self.question_selector.select_best_question(
            available_questions=available_questions,
            active_items=active_items,
            bayesian_network=self.bayesian_network,
            game_state_history=game_state.answer_history,
        )

        # ── KEY FIX: selector returned None → no useful question remains ─────
        # This happens when all remaining questions are about attributes that
        # none of the active items actually have (e.g., "Russia border?" when
        # only Indian Subcontinent countries are left).
        # Returning None here makes app.py set ready_to_guess=True immediately.
        if question is None:
            logger.info(
                f"[{game_state.session_id}] Selector found no useful question "
                f"({len(active_items)} items remain) → triggering guess."
            )
            return None

        game_state.mark_question_asked(question)
        self.firebase_service.save_game_state(game_state)
        logger.info(
            f"[{game_state.session_id}] Q{game_state.questions_asked}: "
            f"{question['question']}"
        )
        return question

    # ── Answer processing ─────────────────────────────────────────────────────

    def process_answer(self, game_state: GameState, answer: str) -> Dict:
        if not game_state.current_question:
            raise ValueError("No active question to answer.")

        question = game_state.current_question
        game_state.record_answer(answer)

        # Bayesian probability update
        active_items = game_state.get_active_items()
        for item in active_items:
            item.probability = self.probability_manager.update_item_probability(
                item, question, answer
            )

        self.probability_manager.normalize_probabilities(game_state.items)
        # Conservative soft filter — keeps top-20, threshold 0.1% of top item
        self.probability_manager.soft_filter(game_state.items)
        self.bayesian_network.update_beliefs(question, answer, game_state.items)

        current_active = game_state.get_active_items()
        confidence     = self.confidence_calculator.calculate(current_active)
        top_item       = game_state.get_top_prediction()
        should_stop    = self._should_stop_asking(game_state)

        self.firebase_service.save_game_state(game_state)
        logger.info(
            f"[{game_state.session_id}] Answer={answer} | "
            f"active={len(current_active)} | conf={confidence:.1f}% | "
            f"stop={should_stop}"
        )

        return {
            'confidence':        confidence,
            'active_items_count': len(current_active),
            'top_prediction':    top_item.to_dict() if top_item else None,
            'should_stop':       should_stop,
        }

    # ── Final prediction ──────────────────────────────────────────────────────

    def get_final_prediction(self, game_state: GameState) -> Dict:
        top_item     = game_state.get_top_prediction()
        active_items = game_state.get_active_items()
        confidence   = self.confidence_calculator.calculate(active_items)

        if top_item:
            sorted_items = sorted(active_items, key=lambda x: x.probability, reverse=True)
            alternatives = [i.to_dict() for i in sorted_items[1:4]]
            self.firebase_service.log_game_result(
                game_state, top_item.name, confidence, False, "Final Guess"
            )
            self._update_session_stats(
                game_state,
                confidence >= GAME_CONFIG['confidence_threshold_stage_3'],
            )
        else:
            alternatives = []

        self.active_games.pop(game_state.session_id, None)

        return {
            'prediction':      top_item.to_dict() if top_item else None,
            'confidence':      int(confidence),
            'alternatives':    alternatives,
            'questions_asked': game_state.questions_asked,
            'total_items':     len(game_state.items),
            'remaining_items': len(active_items),
        }

    # ── Stopping logic ────────────────────────────────────────────────────────

    def _should_stop_asking(self, game_state: GameState) -> bool:
        """
        Single source of truth for stopping.
        Returns True when the engine should make its final guess.
        """
        active_items = game_state.get_active_items()
        active_count = len(active_items)

        # 1. Only 1 or 2 items remain → guess immediately
        force_at = GAME_CONFIG.get('force_guess_at_items', 2)
        if active_count <= force_at:
            logger.info(
                f"[{game_state.session_id}] Force-guess: "
                f"{active_count} item(s) remain."
            )
            return True

        # 2. No questions left at all (all asked)
        if not game_state.get_available_questions():
            logger.info(f"[{game_state.session_id}] No available questions left.")
            return True

        # 3. Adaptive confidence threshold
        confidence = self.confidence_calculator.calculate(active_items)
        return self.confidence_calculator.should_make_guess(
            confidence,
            game_state.questions_asked,
            active_items_count=active_count,
        )

    # ── Session statistics ────────────────────────────────────────────────────

    def _update_session_stats(self, game_state: GameState, success: bool):
        self.session_stats['games_played'] += 1
        if success:
            self.session_stats['successful_guesses'] += 1
        games    = self.session_stats['games_played']
        prev_avg = self.session_stats['average_questions']
        new_avg  = ((prev_avg * (games - 1)) + game_state.questions_asked) / games
        self.session_stats['average_questions'] = new_avg

    def get_session_stats(self) -> Dict:
        games   = self.session_stats['games_played']
        success = self.session_stats['successful_guesses']
        return {
            'games_played':     games,
            'successful_guesses': success,
            'success_rate':     (success / games * 100) if games > 0 else 0,
            'average_questions': self.session_stats['average_questions'],
        }
