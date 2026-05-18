"""
Probability Manager — Bayesian update + smart elimination.

Answer multipliers:
  YES match:         ×10    YES mismatch:      ×0.001
  PROBABLY match:    ×3.5   PROBABLY mismatch: ×0.15
  DONTKNOW:          ×1.0   (no change)
  PROBABLYNOT match: ×0.15  PROBABLYNOT miss:  ×3.5
  NO match:          ×0.001 NO mismatch:       ×10
"""

import sys
import os
from typing import Any

from app.utils.logger import setup_logger

logger = setup_logger(__name__)

FLOOR = 1e-14

# Try C++ hot-path, fall back to pure Python
try:
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "cpp"))
    import atlas_cpp
    _USE_CPP = True
    logger.info("✅ C++ probability ops loaded")
except ImportError:
    _USE_CPP = False
    logger.debug("C++ not available — using Python fallback for probability ops")

LIKELIHOOD: dict[str, dict[str, float]] = {
    "yes":         {"match": 10.0,  "mismatch": 0.001},
    "probably":    {"match": 3.5,   "mismatch": 0.15},
    "dontknow":    {"match": 1.0,   "mismatch": 1.0},
    "probablynot": {"match": 0.15,  "mismatch": 3.5},
    "no":          {"match": 0.001, "mismatch": 10.0},
}


class ProbabilityManager:

    def update_all(
        self,
        items:    list[dict],
        question: dict,
        answer:   str,
    ) -> list[dict]:
        """Update probabilities for all active items after an answer."""
        params = LIKELIHOOD.get(answer, LIKELIHOOD["dontknow"])

        for item in items:
            if item.get("eliminated"):
                continue
            matches = self._matches(
                item,
                question["attribute"],
                question.get("value"),
            )
            mult               = params["match"] if matches else params["mismatch"]
            item["probability"] = max(item["probability"] * mult, FLOOR)

        return self.normalize(items)

    def normalize(self, items: list[dict]) -> list[dict]:
        """Normalize probabilities of active items to sum to 1."""
        active = [i for i in items if not i.get("eliminated")]

        if not active:
            # Emergency reset — reactivate everything
            logger.warning("All items eliminated — emergency reset")
            for i in items:
                i["eliminated"] = False
            active = items

        if _USE_CPP:
            try:
                probs = [i["probability"] for i in active]
                atlas_cpp.normalize_probabilities(probs)
                for item, p in zip(active, probs):
                    item["probability"] = p
                return items
            except Exception as e:
                logger.debug("C++ normalize failed, using Python", error=str(e))

        # Python fallback
        total = sum(i["probability"] for i in active)
        if total < 1e-20:
            p = 1.0 / len(active)
            for i in active:
                i["probability"] = p
        else:
            for i in active:
                i["probability"] /= total

        return items

    def soft_filter(self, items: list[dict]) -> list[dict]:
        """
        Eliminate items whose probability < 0.5% of top item.
        Always keep at least top 5. Max eliminate 80% per pass.
        """
        active = [i for i in items if not i.get("eliminated")]
        n      = len(active)

        if n <= 5:
            return items

        if _USE_CPP:
            try:
                probs   = [i["probability"] for i in active]
                to_elim = atlas_cpp.soft_filter(
                    probs,
                    min_keep=5,
                    threshold_pct=0.005,
                )
                for idx in to_elim:
                    active[idx]["eliminated"] = True
                if to_elim:
                    logger.debug("C++ soft filter", eliminated=len(to_elim), total=n)
                    self.normalize(items)
                return items
            except Exception as e:
                logger.debug("C++ soft_filter failed, using Python", error=str(e))

        # Python fallback
        top_prob  = max(i["probability"] for i in active)
        threshold = top_prob * 0.005

        sorted_active = sorted(
            active,
            key=lambda x: x["probability"],
            reverse=True,
        )

        max_elim   = int(n * 0.80)
        eliminated = 0

        for item in sorted_active[1:]:   # never eliminate rank #1
            if eliminated >= max_elim:
                break
            if item["probability"] < threshold:
                item["eliminated"] = True
                eliminated        += 1

        if eliminated:
            logger.debug("Python soft filter", eliminated=eliminated, total=n)
            self.normalize(items)

        return items

    def _matches(self, item: dict, attribute: str, value: Any) -> bool:
        """Check if item attribute matches question value."""
        iv = item.get("attributes", {}).get(attribute)

        if iv is None:
            return False

        if isinstance(iv, bool) or isinstance(value, bool):
            return bool(iv) == bool(value)

        if isinstance(iv, list):
            iv_norm = {str(x).lower().strip() for x in iv}
            return str(value).lower().strip() in iv_norm

        return str(iv).lower().strip() == str(value).lower().strip()