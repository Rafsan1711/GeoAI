"""
Information Gain — Shannon entropy based.
Vectorized with NumPy for speed.
"""

import math
import numpy as np
from typing import Any
from app.utils.logger import setup_logger

logger = setup_logger(__name__)
EPS = 1e-12


class InformationGain:

    def calculate(self, items: list[dict], attribute: str, value: Any) -> float:
        """
        Normalized information gain for a (attribute, value) question
        against the current set of active items.
        Returns 0.0–1.0 (higher = better question).
        """
        active = [i for i in items if not i.get("eliminated", False)]
        n = len(active)
        if n <= 1:
            return 0.0

        probs = np.array([i["probability"] for i in active], dtype=np.float64)
        total = probs.sum()
        if total < EPS:
            return 0.0
        probs /= total

        H_before = self._entropy(probs)
        if H_before < EPS:
            return 0.0

        yes_mask = np.array([self._matches(i, attribute, value) for i in active])
        no_mask  = ~yes_mask

        yes_prob_sum = probs[yes_mask].sum()
        no_prob_sum  = probs[no_mask].sum()

        H_after = 0.0
        if yes_prob_sum > EPS:
            H_after += yes_prob_sum * self._entropy(probs[yes_mask] / yes_prob_sum)
        if no_prob_sum > EPS:
            H_after += no_prob_sum  * self._entropy(probs[no_mask]  / no_prob_sum)

        gain = (H_before - H_after) / (H_before + EPS)
        return float(np.clip(gain, 0.0, 1.0))

    def _entropy(self, probs: np.ndarray) -> float:
        p = probs[probs > EPS]
        return float(-np.sum(p * np.log2(p))) if len(p) else 0.0

    def _matches(self, item: dict, attribute: str, value: Any) -> bool:
        iv = item.get("attributes", {}).get(attribute)
        if iv is None:
            return False
        if isinstance(iv, bool) or isinstance(value, bool):
            return bool(iv) == bool(value)
        if isinstance(iv, list):
            return str(value).lower().strip() in {str(x).lower().strip() for x in iv}
        return str(iv).lower().strip() == str(value).lower().strip()