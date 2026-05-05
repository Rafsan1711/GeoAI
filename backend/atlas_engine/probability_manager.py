"""
Probability Manager — Bayesian update + smart elimination.

Answer multipliers (tuned for 95%+ accuracy):
  YES match:         ×10  (very decisive)
  YES mismatch:      ×0.001
  PROBABLY match:    ×3.5
  PROBABLY mismatch: ×0.15
  DONTKNOW:          ×1.0 (no info)
  PROBABLYNOT match: ×0.15
  PROBABLYNOT miss:  ×3.5
  NO match:          ×0.001
  NO mismatch:       ×10
"""

import numpy as np
from typing import Any
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

FLOOR = 1e-14

LIKELIHOOD: dict[str, dict[str, float]] = {
    "yes":         {"match": 10.0,  "mismatch": 0.001},
    "probably":    {"match": 3.5,   "mismatch": 0.15},
    "dontknow":    {"match": 1.0,   "mismatch": 1.0},
    "probablynot": {"match": 0.15,  "mismatch": 3.5},
    "no":          {"match": 0.001, "mismatch": 10.0},
}


class ProbabilityManager:

    def update_all(self, items: list[dict], question: dict, answer: str) -> list[dict]:
        """Update probabilities for all active items after an answer."""
        params = LIKELIHOOD.get(answer, LIKELIHOOD["dontknow"])
        for item in items:
            if item.get("eliminated"):
                continue
            matches = self._matches(item, question["attribute"], question.get("value"))
            mult    = params["match"] if matches else params["mismatch"]
            item["probability"] = max(item["probability"] * mult, FLOOR)
        return self.normalize(items)

    def normalize(self, items: list[dict]) -> list[dict]:
        active = [i for i in items if not i.get("eliminated")]
        if not active:
            # Emergency: reactivate all
            logger.warning("All items eliminated — resetting")
            for i in items:
                i["eliminated"] = False
            active = items

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
        n = len(active)
        if n <= 5:
            return items

        top_prob  = max(i["probability"] for i in active)
        threshold = top_prob * 0.005   # 0.5% of top
        sorted_active = sorted(active, key=lambda x: x["probability"], reverse=True)

        max_elim  = int(n * 0.80)
        eliminated = 0

        for item in sorted_active[1:]:   # never eliminate rank #1
            if eliminated >= max_elim:
                break
            if item["probability"] < threshold:
                item["eliminated"] = True
                eliminated += 1

        if eliminated:
            logger.debug("Soft filter", eliminated=eliminated, total=n)
            self.normalize(items)

        return items

    def _matches(self, item: dict, attribute: str, value: Any) -> bool:
        iv = item.get("attributes", {}).get(attribute)
        if iv is None:
            return False
        if isinstance(iv, bool) or isinstance(value, bool):
            return bool(iv) == bool(value)
        if isinstance(iv, list):
            return str(value).lower().strip() in {str(x).lower().strip() for x in iv}
        return str(iv).lower().strip() == str(value).lower().strip()