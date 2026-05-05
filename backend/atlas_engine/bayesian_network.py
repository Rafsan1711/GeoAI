"""
Bayesian Network — propagates belief across related attributes.
Lightweight: no heavy graph library, pure Python.
"""

from collections import defaultdict
from typing import Any
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

# Attributes that are semantically related
ATTR_GROUPS = {
    "continent":   ["region", "subRegion", "hasCoast", "climate", "language"],
    "subRegion":   ["continent", "region", "landlocked", "mainReligion"],
    "mainReligion":["language", "government"],
    "climate":     ["avgTemperature", "hasMountains", "hasRivers"],
    "population":  ["size"],
    "type":        ["subtype"],
    "country":     ["continent", "subRegion"],
}


class BayesianNetwork:

    def __init__(self):
        self.beliefs: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
        self.evidence: list[tuple[str, Any, str]] = []

    def build(self, items: list[dict], questions: list[dict]):
        """Initialize belief priors from dataset distribution."""
        self.beliefs.clear()
        self.evidence.clear()

        attrs = {q["attribute"] for q in questions}
        for attr in attrs:
            counts: dict[str, int] = defaultdict(int)
            total = 0
            for item in items:
                v = item.get("attributes", {}).get(attr)
                if v is None:
                    continue
                vals = v if isinstance(v, list) else [v]
                for val in vals:
                    counts[str(val).lower().strip()] += 1
                    total += 1
            if total:
                for val, cnt in counts.items():
                    self.beliefs[attr][val] = cnt / total

    def update(self, question: dict, answer: str, items: list[dict]):
        """Update beliefs after a question-answer pair."""
        attr  = question["attribute"]
        value = str(question.get("value", "")).lower().strip()
        self.evidence.append((attr, value, answer))

        active = [i for i in items if not i.get("eliminated", False)]
        if not active:
            return

        total_prob = sum(i["probability"] for i in active)
        if total_prob < 1e-12:
            return

        match_prob = sum(
            i["probability"]
            for i in active
            if self._matches(i, attr, question.get("value"))
        )
        new_belief = match_prob / total_prob

        if value in self.beliefs[attr]:
            old = self.beliefs[attr][value]
            self.beliefs[attr][value] = old * 0.5 + new_belief * 0.5

        self._propagate(attr, new_belief, answer)

    def score_question(self, question: dict) -> float:
        """Returns 0–1 score based on current beliefs (how informative)."""
        attr  = question["attribute"]
        value = str(question.get("value", "")).lower().strip()
        belief = self.beliefs.get(attr, {}).get(value, 0.5)
        return 1.0 - abs(0.5 - belief) * 2.0   # 1.0 when belief=0.5 (maximum uncertainty → most informative)

    def _propagate(self, source_attr: str, new_belief: float, answer: str):
        factor = 0.12 if answer in ("yes", "no") else 0.04
        dependents: set[str] = set()
        for attr, group in ATTR_GROUPS.items():
            if source_attr in group:
                dependents.add(attr)
            elif attr == source_attr:
                dependents.update(group)

        for dep in dependents:
            if dep not in self.beliefs:
                continue
            for val in self.beliefs[dep]:
                cur = self.beliefs[dep][val]
                if new_belief > 0.7:
                    self.beliefs[dep][val] = min(1.0, cur * (1.0 + factor))
                elif new_belief < 0.3:
                    self.beliefs[dep][val] = max(0.0, cur * (1.0 - factor))
            # Renormalize
            total = sum(self.beliefs[dep].values())
            if total > 1e-12:
                for val in self.beliefs[dep]:
                    self.beliefs[dep][val] /= total

    def _matches(self, item: dict, attr: str, value: Any) -> bool:
        iv = item.get("attributes", {}).get(attr)
        if iv is None:
            return False
        if isinstance(iv, bool) or isinstance(value, bool):
            return bool(iv) == bool(value)
        if isinstance(iv, list):
            return str(value).lower().strip() in {str(x).lower().strip() for x in iv}
        return str(iv).lower().strip() == str(value).lower().strip()

    def reset(self):
        self.beliefs.clear()
        self.evidence.clear()