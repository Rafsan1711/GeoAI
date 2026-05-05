"""
Confidence Calculator — 4-signal composite score (0–100).
"""

import math
from app.utils.logger import setup_logger

logger = setup_logger(__name__)
EPS = 1e-10

WEIGHTS = {
    "probability_gap": 0.40,
    "normalized_prob": 0.30,
    "item_count":      0.20,
    "entropy":         0.10,
}

# Confidence thresholds per stage (from settings, hardcoded here as defaults)
THRESHOLDS = {
    "stage_1": 99.0,   # Q 1–10
    "stage_2": 95.0,   # Q 11–25
    "stage_3": 88.0,   # Q 26–50
    "stage_4": 78.0,   # Q 50+
}


class ConfidenceCalculator:

    def calculate(self, active_items: list[dict]) -> float:
        n = len(active_items)
        if n == 0:
            return 0.0
        if n == 1:
            return 100.0
        if n == 2:
            total = sum(i["probability"] for i in active_items)
            top   = max(i["probability"] for i in active_items)
            if total > EPS and (top / total) >= 0.80:
                return 97.0

        score = (
            WEIGHTS["probability_gap"] * self._prob_gap(active_items) +
            WEIGHTS["normalized_prob"] * self._norm_prob(active_items) +
            WEIGHTS["item_count"]      * self._item_count(n) +
            WEIGHTS["entropy"]         * self._entropy(active_items)
        )
        return min(99.9, score)

    def should_guess(self, confidence: float, questions_asked: int, active_count: int) -> bool:
        # Force guess if very few items left
        if active_count <= 2:
            return True

        if   questions_asked <= 10:
            threshold = THRESHOLDS["stage_1"]
        elif questions_asked <= 25:
            threshold = THRESHOLDS["stage_2"]
        elif questions_asked <= 50:
            threshold = THRESHOLDS["stage_3"]
        else:
            threshold = THRESHOLDS["stage_4"]

        return confidence >= threshold

    # ── Private ──────────────────────────────────────────────

    def _prob_gap(self, items: list[dict]) -> float:
        sorted_p = sorted((i["probability"] for i in items), reverse=True)
        total = sum(sorted_p)
        if total < EPS:
            return 50.0
        gap = (sorted_p[0] - sorted_p[1]) / total
        return min(99.0, gap * 200.0)

    def _norm_prob(self, items: list[dict]) -> float:
        total = sum(i["probability"] for i in items)
        top   = max(i["probability"] for i in items)
        if total < EPS:
            return 50.0
        return (top / total) * 100.0

    def _item_count(self, n: int) -> float:
        if n == 1:  return 100.0
        if n == 2:  return 90.0
        if n <= 5:  return 80.0
        scale = min(1.0, n / 100.0)
        return max(0.0, 100.0 * (1.0 - scale))

    def _entropy(self, items: list[dict]) -> float:
        probs = [i["probability"] for i in items]
        total = sum(probs)
        if total < EPS:
            return 50.0
        pn     = [p / total for p in probs]
        H      = -sum(p * math.log2(p + EPS) for p in pn if p > 0)
        H_max  = math.log2(len(items)) if len(items) > 1 else 1.0
        return (1.0 - H / (H_max + EPS)) * 100.0