"""
Question Selector — Context-aware, stage-driven, active-value-grounded.

Core idea:
  1. Build active_val_set: which values actually exist across remaining items.
  2. Only consider questions whose value exists in active_val_set.
  3. Eliminate questions that split 0/all (useless).
  4. Score by: information_gain × stage_bonus × balance × bayesian × importance.
  5. Return None when nothing useful remains → engine triggers guess.
"""

from collections import defaultdict
from typing import Any, Optional
from .information_gain import InformationGain
from .bayesian_network import BayesianNetwork
from .feature_importance import FeatureImportance
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

# Stage mapping: attribute → when to ask (0=first, 9=last)
from app.utils.question_selector_helper import STAGE_MAP


EXCLUSIVE_ATTRS = {
    "continent", "subRegion", "region", "climate", "avgTemperature",
    "population", "size", "government", "mainReligion", "driveSide",
    "language", "capital", "currency", "type", "subtype", "country", "located_in",
}

BOOL_ATTRS = {
    "landlocked", "hasCoast", "isIsland", "isArchipelago", "hasMountains",
    "hasRivers", "hasWonder", "hasNobel", "hasUNESCO", "formerColony",
    "hostsMajorSportEvent",
}

MULTI_ATTRS = {"famousFor", "neighbors", "flagColors", "exports", "famousPeople"}

def _norm(v: Any) -> str:
    return str(v).lower().strip()


class QuestionSelector:

    def __init__(self):
        self.ig_calc    = InformationGain()
        self.fi         = FeatureImportance()

    def load_feature_importance(self, fi_scores: dict[str, float]):
        self.fi.scores = fi_scores

    def select(
        self,
        available_questions: list[dict],
        active_items: list[dict],
        bayesian: BayesianNetwork,
        history: list[tuple[dict, str]],
    ) -> Optional[dict]:

        if not active_items:
            return None

        ctx            = self._build_ctx(history)
        active_val_set = self._active_vals(active_items)
        candidates     = self._filter(available_questions, active_items, ctx, active_val_set)

        if not candidates:
            logger.info("No useful questions remain — triggering guess")
            return None

        target_stage = self._target_stage(ctx)
        scored = sorted(
            [(self._score(q, active_items, bayesian, target_stage), q) for q in candidates],
            key=lambda x: x[0],
            reverse=True,
        )

        best_score, best_q = scored[0]
        logger.debug(
            "Question selected",
            question=best_q["question_text"][:60],
            score=round(best_score, 3),
            target_stage=target_stage,
            candidates=len(candidates),
        )
        return best_q

    # ── Context ───────────────────────────────────────────────

    def _build_ctx(self, history: list[tuple[dict, str]]) -> dict:
        confirmed:    dict[str, str]  = {}
        denied:       dict[str, set]  = defaultdict(set)
        asked_count:  dict[str, int]  = defaultdict(int)
        asked_texts:  set[str]        = set()
        asked_bool:   set[str]        = set()

        for q, ans in history:
            attr = q["attribute"]
            val  = _norm(q.get("value", ""))
            asked_texts.add(q["question_text"])
            asked_count[attr] += 1
            if attr in BOOL_ATTRS:
                asked_bool.add(attr)
            if ans in ("yes", "probably"):
                confirmed[attr] = val
            elif ans in ("no", "probablynot"):
                denied[attr].add(val)

        return dict(
            confirmed=confirmed, denied=denied,
            asked_count=asked_count, asked_texts=asked_texts, asked_bool=asked_bool
        )

    # ── Active value set ──────────────────────────────────────

    def _active_vals(self, active_items: list[dict]) -> dict[str, set[str]]:
        val_set: dict[str, set[str]] = defaultdict(set)
        for item in active_items:
            for attr, v in item.get("attributes", {}).items():
                if v is None:
                    continue
                vals = v if isinstance(v, list) else [v]
                for x in vals:
                    val_set[attr].add(_norm(x))
        return val_set

    # ── Filter ────────────────────────────────────────────────

    def _filter(
        self,
        questions: list[dict],
        active_items: list[dict],
        ctx: dict,
        active_val_set: dict[str, set[str]],
    ) -> list[dict]:
        confirmed   = ctx["confirmed"]
        denied      = ctx["denied"]
        asked_count = ctx["asked_count"]
        asked_texts = ctx["asked_texts"]
        asked_bool  = ctx["asked_bool"]
        n_active    = len(active_items)
        result      = []

        for q in questions:
            attr = q["attribute"]
            val  = _norm(q.get("value", ""))

            if q["question_text"] in asked_texts:
                continue
            if attr in BOOL_ATTRS and attr in asked_bool:
                continue
            if attr in EXCLUSIVE_ATTRS and attr in confirmed:
                continue
            if val in denied.get(attr, set()):
                continue

            max_r = 8 if attr in MULTI_ATTRS else 2
            if asked_count.get(attr, 0) >= max_r:
                continue

            # Must be relevant to current active items
            if val not in active_val_set.get(attr, set()):
                continue

            # Must split — not all-yes or all-no
            yes_cnt = sum(
                1 for item in active_items
                if self._item_matches(item, attr, q.get("value"))
            )
            if yes_cnt == 0 or yes_cnt == n_active:
                continue

            result.append(q)

        return result

    # ── Target stage ──────────────────────────────────────────

    def _target_stage(self, ctx: dict) -> int:
        confirmed   = ctx["confirmed"]
        asked_count = ctx["asked_count"]

        if "continent" not in confirmed and "type" not in confirmed:
            return 0
        if "subRegion" not in confirmed and asked_count.get("subRegion", 0) < 3:
            return 1

        geo = {"landlocked", "hasCoast", "isIsland", "hasMountains", "climate"}
        if sum(1 for a in geo if a in confirmed or asked_count.get(a, 0) >= 1) < 2:
            return 2

        if "population" not in confirmed and asked_count.get("population", 0) < 1:
            return 3

        soc = {"mainReligion", "government", "driveSide"}
        if sum(1 for a in soc if a in confirmed or asked_count.get(a, 0) >= 1) < 2:
            return 4

        if "language" not in confirmed and asked_count.get("language", 0) < 1:
            return 5

        return 6

    # ── Scoring ───────────────────────────────────────────────

    def _score(
        self,
        q: dict,
        active_items: list[dict],
        bayesian: BayesianNetwork,
        target_stage: int,
    ) -> float:
        attr  = q["attribute"]
        val   = q.get("value")
        stage = STAGE_MAP.get(attr, 5)

        ig = self.ig_calc.calculate(active_items, attr, val)

        diff = stage - target_stage
        if   diff == 0:  stage_bonus = 0.55
        elif diff == 1:  stage_bonus = 0.20
        elif diff == -1: stage_bonus = 0.05
        else:            stage_bonus = max(0.0, 0.05 - abs(diff) * 0.02)

        n = len(active_items)
        yes_cnt = sum(1 for item in active_items if self._item_matches(item, attr, val))
        balance = 1.0 - abs(0.5 - yes_cnt / n) * 2.0 if n else 0.0

        bn_score   = bayesian.score_question(q)
        importance = self.fi.get(attr)

        return (
            ig         * 0.40 +
            stage_bonus* 0.35 +
            balance    * 0.10 +
            bn_score   * 0.10 +
            importance * 0.05
        )

    def _item_matches(self, item: dict, attribute: str, value: Any) -> bool:
        iv = item.get("attributes", {}).get(attribute)
        if iv is None:
            return False
        if isinstance(iv, bool) or isinstance(value, bool):
            return bool(iv) == bool(value)
        if isinstance(iv, list):
            return _norm(value) in {_norm(x) for x in iv}
        return _norm(iv) == _norm(value)