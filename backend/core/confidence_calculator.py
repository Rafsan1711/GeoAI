"""
Confidence Calculator - Akinator-style adaptive early stopping.

Key fix: If only 1-2 items remain active, guess immediately.
If confidence is high enough for the question count, guess.
No hard question limit enforced here.
"""

import math
import logging
from typing import List
from models.item_model import Item
from backend.config import GAME_CONFIG

logger = logging.getLogger(__name__)


class ConfidenceCalculator:

    def __init__(self):
        self.epsilon = 1e-10

    def calculate(self, active_items: List[Item]) -> float:
        """
        Calculate composite confidence score (0-100).
        Uses weighted average of 4 signals.
        """
        if not active_items:
            return 0.0

        # ✅ FIX: If only 1 item left, it's 100% confident — guess immediately
        if len(active_items) == 1:
            return 100.0

        # ✅ FIX: If only 2 items left and top has 80%+ of total probability, very high confidence
        if len(active_items) == 2:
            total = sum(i.probability for i in active_items)
            top = max(i.probability for i in active_items)
            if total > self.epsilon and (top / total) >= 0.80:
                return 97.0

        weights = GAME_CONFIG.get('confidence_weights', {
            'probability_gap': 0.40,
            'normalized_prob': 0.30,
            'item_count':      0.20,
            'entropy':         0.10
        })

        # Fallback to algorithm_params if needed
        from backend.config import ALGORITHM_PARAMS
        w = ALGORITHM_PARAMS['confidence_weights']

        prob_gap_conf   = self._probability_gap_confidence(active_items)
        norm_prob_conf  = self._normalized_probability_confidence(active_items)
        item_count_conf = self._item_count_confidence(active_items, len(active_items))
        entropy_conf    = self._entropy_confidence(active_items)

        composite = (
            w['probability_gap'] * prob_gap_conf +
            w['normalized_prob']  * norm_prob_conf +
            w['item_count']       * item_count_conf +
            w['entropy']          * entropy_conf
        )

        return min(99.9, composite)

    def _probability_gap_confidence(self, items: List[Item]) -> float:
        """Confidence based on gap between top-2 probabilities."""
        if len(items) < 2:
            return 99.0

        sorted_items = sorted(items, key=lambda x: x.probability, reverse=True)
        top   = sorted_items[0].probability
        second = sorted_items[1].probability

        total = sum(i.probability for i in items)
        if total < self.epsilon:
            return 50.0

        gap = (top - second) / total
        return min(99.0, gap * 200.0)  # Aggressive scaling

    def _normalized_probability_confidence(self, items: List[Item]) -> float:
        """Confidence based on top item's share of total probability."""
        if not items:
            return 0.0

        top_prob   = max(i.probability for i in items)
        total_prob = sum(i.probability for i in items)

        if total_prob < self.epsilon:
            return 50.0

        normalized = top_prob / total_prob
        return normalized * 100.0

    def _item_count_confidence(self, active_items: List[Item], total_items: int) -> float:
        """Confidence based on how many items remain."""
        if total_items == 0:
            return 50.0

        active_count = len(active_items)

        if active_count == 1:
            return 100.0
        if active_count == 2:
            return 90.0
        if active_count <= 5:
            return 80.0

        max_items_for_scaling = 100
        scale_factor = min(1.0, active_count / max_items_for_scaling)
        confidence = 100.0 * (1.0 - scale_factor)

        elimination_rate = 1.0 - (active_count / max(total_items, 1))
        confidence += elimination_rate * 5.0

        return min(99.0, confidence)

    def _entropy_confidence(self, items: List[Item]) -> float:
        """Confidence from Shannon entropy."""
        if not items:
            return 0.0

        probs = [i.probability for i in items]
        total = sum(probs)

        if total < self.epsilon:
            return 50.0

        probs_norm = [p / total for p in probs]
        entropy = -sum(p * math.log2(p + self.epsilon) for p in probs_norm if p > 0)

        max_entropy = math.log2(len(items)) if len(items) > 1 else 1.0

        if max_entropy < self.epsilon:
            return 100.0

        norm_entropy = entropy / max_entropy
        return (1.0 - norm_entropy) * 100.0

    def should_make_guess(self, confidence: float, questions_asked: int,
                          active_items_count: int = None) -> bool:
        """
        ✅ AKINATOR-STYLE: Guess as soon as confidence is high enough.
        No hard question limit. Earlier = better.
        """
        cfg = GAME_CONFIG

        # ✅ Rule 1: If only 1 or 2 items remain → guess immediately (no matter what)
        if active_items_count is not None:
            if active_items_count <= cfg.get('force_guess_at_items', 2):
                logger.info(f"Force guess: only {active_items_count} item(s) remain.")
                return True

        # ✅ Rule 2: Adaptive confidence thresholds by question stage
        if questions_asked <= 10:
            threshold = cfg['confidence_threshold_stage_1']   # 99%
        elif questions_asked <= 25:
            threshold = cfg['confidence_threshold_stage_2']   # 95%
        elif questions_asked <= 50:
            threshold = cfg['confidence_threshold_stage_3']   # 85%
        else:
            threshold = cfg['confidence_threshold_stage_4']   # 75%

        if confidence >= threshold:
            logger.info(
                f"Guess triggered at Q{questions_asked}: "
                f"confidence={confidence:.1f}% >= threshold={threshold}%"
            )
            return True

        return False
