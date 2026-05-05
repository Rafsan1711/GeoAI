"""
Feature Importance — learned from real game data via Random Forest.
Falls back to hand-tuned priors when not enough data.
"""

import math
from collections import defaultdict
from typing import Any
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class FeatureImportance:

    def __init__(self, preloaded: dict[str, float] | None = None):
        # Preloaded from Supabase feature_importance table
        self.scores: dict[str, float] = preloaded or {}

    def load_from_db(self, db_rows: list[dict]):
        """Load importance scores from Supabase rows."""
        self.scores = {row["attribute"]: row["importance_score"] for row in db_rows}
        logger.info("Feature importance loaded", count=len(self.scores))

    def get(self, attribute: str) -> float:
        return self.scores.get(attribute, 0.50)

    def calculate_from_items(self, items: list[dict], questions: list[dict]) -> dict[str, float]:
        """
        Calculate importance scores from the current item set.
        Used as fallback when DB scores are unavailable.
        """
        attrs = {q["attribute"] for q in questions}
        scores: dict[str, float] = {}

        for attr in attrs:
            values: list = []
            defined = 0
            for item in items:
                v = item.get("attributes", {}).get(attr)
                if v is not None:
                    defined += 1
                    if isinstance(v, list):
                        values.extend([str(x) for x in v])
                    else:
                        values.append(str(v))

            if not values:
                scores[attr] = 0.0
                continue

            counts: dict[str, int] = defaultdict(int)
            for v in values:
                counts[v.lower().strip()] += 1
            total = sum(counts.values())
            gini = 1.0 - sum((c / total) ** 2 for c in counts.values())
            coverage = defined / len(items) if items else 0.0
            scores[attr] = gini * 0.6 + coverage * 0.4

        # Merge with DB scores (DB takes precedence)
        for attr, score in scores.items():
            if attr not in self.scores:
                self.scores[attr] = score

        return self.scores