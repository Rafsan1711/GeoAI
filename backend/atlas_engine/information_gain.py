"""
Information Gain — Shannon entropy based question scoring.
Vectorized with NumPy. Uses C++ extension when available.
"""

import sys
import os
import math
from typing import Any

import numpy as np

from app.utils.logger import setup_logger

logger = setup_logger(__name__)

EPS = 1e-12

# Try C++ hot-path, fall back to pure Python/NumPy
try:
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "cpp"))
    import atlas_cpp
    _USE_CPP = True
    logger.info("✅ C++ information gain loaded")
except ImportError:
    _USE_CPP = False
    logger.debug("C++ not available — using NumPy fallback for information gain")


class InformationGain:

    def calculate(
        self,
        items:     list[dict],
        attribute: str,
        value:     Any,
    ) -> float:
        """
        Normalized information gain for a (attribute, value) question
        against the current set of active items.

        Returns float 0.0–1.0 (higher = better question to ask).
        """
        active = [i for i in items if not i.get("eliminated", False)]
        n = len(active)

        if n <= 1:
            return 0.0

        # Build probability array
        probs = np.array(
            [i["probability"] for i in active],
            dtype=np.float64,
        )
        total = probs.sum()
        if total < EPS:
            return 0.0
        probs /= total

        # Build binary match mask
        match_mask = [
            1 if self._matches(i, attribute, value) else 0
            for i in active
        ]

        yes_count = sum(match_mask)
        # If all match or none match — question is useless
        if yes_count == 0 or yes_count == n:
            return 0.0

        # ── C++ fast path ──────────────────────────────────────
        if _USE_CPP:
            try:
                gain = atlas_cpp.information_gain_binary(
                    probs.tolist(),
                    match_mask,
                )
                return float(np.clip(gain, 0.0, 1.0))
            except Exception as e:
                logger.debug("C++ IG call failed, falling back", error=str(e))

        # ── NumPy fallback ─────────────────────────────────────
        return self._numpy_ig(probs, match_mask)

    def _numpy_ig(
        self,
        probs:      np.ndarray,
        match_mask: list[int],
    ) -> float:
        """Pure NumPy information gain calculation."""
        H_before = self._entropy(probs)
        if H_before < EPS:
            return 0.0

        yes_mask = np.array(match_mask, dtype=bool)
        no_mask  = ~yes_mask

        yes_probs = probs[yes_mask]
        no_probs  = probs[no_mask]

        yes_sum = yes_probs.sum()
        no_sum  = no_probs.sum()

        H_after = 0.0
        if yes_sum > EPS:
            H_after += yes_sum * self._entropy(yes_probs / yes_sum)
        if no_sum > EPS:
            H_after += no_sum  * self._entropy(no_probs  / no_sum)

        gain = (H_before - H_after) / (H_before + EPS)
        return float(np.clip(gain, 0.0, 1.0))

    def _entropy(self, probs: np.ndarray) -> float:
        """Shannon entropy of a probability array."""
        p = probs[probs > EPS]
        if len(p) == 0:
            return 0.0
        return float(-np.sum(p * np.log2(p)))

    def _matches(self, item: dict, attribute: str, value: Any) -> bool:
        """
        Check if item's attribute value matches the question value.
        Handles: bool, list (multi-value), and string comparisons.
        """
        iv = item.get("attributes", {}).get(attribute)

        if iv is None:
            return False

        # Boolean comparison
        if isinstance(iv, bool) or isinstance(value, bool):
            return bool(iv) == bool(value)

        # List attribute (e.g. famousFor, neighbors, flagColors)
        if isinstance(iv, list):
            iv_norm = {str(x).lower().strip() for x in iv}
            v_norm  = str(value).lower().strip()
            return v_norm in iv_norm

        # String / number comparison
        return str(iv).lower().strip() == str(value).lower().strip()