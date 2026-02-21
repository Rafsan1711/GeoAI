"""
Question Selector — Context-aware, active-item-grounded question selection.

How it works:
1. Build `active_val_set[attr]` — the exact normalized values that exist
   across ALL current active items for every attribute.
2. A question is valid ONLY IF its normalized value exists in active_val_set.
   This is why "Does it border Russia?" disappears once Indian Subcontinent
   is confirmed — none of those countries have 'russia' in their neighbors.
3. After YES on an exclusive attr (continent, subRegion, language, …),
   ALL other values for that attr are blocked permanently.
4. Stage ordering: continent→subRegion→geography→population→society→culture.
   The selector never skips ahead; it stays in the current stage until settled.
5. Returns None when nothing useful remains → inference engine triggers guess.
"""

import logging
from typing import List, Dict, Set, Tuple, Optional
from collections import defaultdict

from models.item_model import Item
from algorithms.information_gain import InformationGain
from algorithms.bayesian_network import BayesianNetwork
from config import GAME_CONFIG

logger = logging.getLogger(__name__)


# ── Attribute metadata ────────────────────────────────────────────────────────

STAGE_MAP: Dict[str, int] = {
    'continent':    0,
    'region':       1, 'subRegion':       1,
    'hasCoast':     2, 'landlocked':      2, 'isIsland':   2,
    'hasMountains': 2, 'hasRivers':       2, 'climate':    2,
    'avgTemperature': 2,
    'population':   3, 'size':            3,
    'government':   4, 'mainReligion':    4, 'driveSide':  4,
    'language':     5, 'flagColors':      5, 'formerColony': 5,
    'colonizedBy':  5, 'hasWonder':       5, 'hasNobel':   5,
    'hasUNESCO':    5, 'hostsMajorSportEvent': 5,
    'exports':      6, 'neighbors':       6, 'famousFor':  6,
    'capital':      7, 'nationalDish':    7, 'famousPeople': 7,
    'currency':     7,
}

# Once YES confirmed → block all other values for this attribute
EXCLUSIVE_ATTRS: Set[str] = {
    'continent', 'region', 'subRegion', 'climate', 'avgTemperature',
    'population', 'size', 'government', 'mainReligion', 'driveSide',
    'language', 'capital', 'nationalDish', 'currency',
}

# Boolean attrs — ask at most once
BOOL_ATTRS: Set[str] = {
    'landlocked', 'hasCoast', 'isIsland', 'hasMountains', 'hasRivers',
    'hasWonder', 'hasNobel', 'hasUNESCO', 'formerColony',
    'hostsMajorSportEvent',
}

def _norm(v) -> str:
    return str(v).lower().strip()


class QuestionSelector:

    def __init__(self):
        self.info_gain_calc    = InformationGain()
        self.feature_importance: Dict[str, float] = {}

    def get_attribute_stage(self, attr: str) -> int:
        return STAGE_MAP.get(attr, 5)

    def calculate_feature_importance(self, items: List[Item], questions: List[Dict]):
        attrs = set(q['attribute'] for q in questions)
        for attr in attrs:
            values, defined = [], 0
            for item in items:
                v = item.attributes.get(attr)
                if v is not None:
                    defined += 1
                    values.extend([v] if not isinstance(v, list) else v)
            if not values:
                self.feature_importance[attr] = 0.0
                continue
            counts = defaultdict(int)
            for v in values:
                counts[_norm(v)] += 1
            total = sum(counts.values())
            gini  = 1.0 - sum((c / total) ** 2 for c in counts.values())
            cov   = defined / len(items) if items else 0.0
            self.feature_importance[attr] = gini * 0.6 + cov * 0.4

    # ── Main entry point ──────────────────────────────────────────────────────

    def select_best_question(
        self,
        available_questions: List[Dict],
        active_items: List[Item],
        bayesian_network: BayesianNetwork,
        game_state_history: List[Tuple[Dict, str]],
    ) -> Optional[Dict]:

        if not active_items:
            return None

        ctx             = self._build_context(game_state_history)
        active_val_set  = self._build_active_val_set(active_items)
        candidates      = self._filter(available_questions, active_items,
                                       ctx, active_val_set)

        if not candidates:
            logger.info("No useful questions remain → trigger guess.")
            return None

        target_stage = self._target_stage(ctx)
        scored = sorted(
            [(self._score(q, active_items, bayesian_network, target_stage), q)
             for q in candidates],
            key=lambda x: x[0], reverse=True
        )

        best = scored[0][1]
        logger.info(
            f"Selected Q (stage={self.get_attribute_stage(best['attribute'])}, "
            f"score={scored[0][0]:.3f}, target_stage={target_stage}): "
            f"{best['question']}"
        )
        return best

    # ── Active value set ──────────────────────────────────────────────────────

    def _build_active_val_set(self, active_items: List[Item]) -> Dict[str, Set[str]]:
        val_set: Dict[str, Set[str]] = defaultdict(set)
        for item in active_items:
            for attr, v in item.attributes.items():
                if v is None:
                    continue
                if isinstance(v, list):
                    for x in v:
                        val_set[attr].add(_norm(x))
                else:
                    val_set[attr].add(_norm(v))
        return val_set

    # ── Context ───────────────────────────────────────────────────────────────

    def _build_context(self, history: List[Tuple[Dict, str]]) -> Dict:
        confirmed:   Dict[str, str]  = {}
        denied:      Dict[str, Set]  = defaultdict(set)
        asked_count: Dict[str, int]  = defaultdict(int)
        asked_texts: Set[str]        = set()
        asked_bool:  Set[str]        = set()

        for q, ans in history:
            attr = q['attribute']
            val  = _norm(q.get('value', ''))
            asked_texts.add(q['question'])
            asked_count[attr] += 1
            if attr in BOOL_ATTRS:
                asked_bool.add(attr)
            if ans in ('yes', 'probably'):
                confirmed[attr] = val
            elif ans in ('no', 'probablynot'):
                denied[attr].add(val)

        return dict(confirmed=confirmed, denied=denied,
                    asked_count=asked_count, asked_texts=asked_texts,
                    asked_bool=asked_bool)

    # ── Filter ────────────────────────────────────────────────────────────────

    def _filter(
        self,
        questions: List[Dict],
        active_items: List[Item],
        ctx: Dict,
        active_val_set: Dict[str, Set[str]],
    ) -> List[Dict]:

        confirmed    = ctx['confirmed']
        denied       = ctx['denied']
        asked_count  = ctx['asked_count']
        asked_texts  = ctx['asked_texts']
        asked_bool   = ctx['asked_bool']
        n_active     = len(active_items)

        result = []
        for q in questions:
            attr = q['attribute']
            val  = _norm(q.get('value', ''))

            if q['question'] in asked_texts:
                continue
            if attr in BOOL_ATTRS and attr in asked_bool:
                continue
            if attr in EXCLUSIVE_ATTRS and attr in confirmed:
                continue
            if val in denied.get(attr, set()):
                continue

            max_r = 8 if attr in ('famousFor', 'neighbors', 'flagColors', 'exports') else 2
            if asked_count.get(attr, 0) >= max_r:
                continue

            if val not in active_val_set.get(attr, set()):
                continue

            yes_cnt = sum(
                1 for item in active_items
                if item.matches_question({'attribute': attr, 'value': q.get('value')})
            )
            if yes_cnt == 0 or yes_cnt == n_active:
                continue

            result.append(q)

        return result

    # ── Stage targeting ───────────────────────────────────────────────────────

    def _target_stage(self, ctx: Dict) -> int:
        confirmed   = ctx['confirmed']
        asked_count = ctx['asked_count']

        if 'continent' not in confirmed:
            return 0
        if 'subRegion' not in confirmed and asked_count.get('subRegion', 0) < 3:
            return 1

        geo = {'landlocked', 'hasCoast', 'isIsland', 'hasMountains', 'climate'}
        if sum(1 for a in geo if a in confirmed or asked_count.get(a, 0) >= 1) < 2:
            return 2

        if 'population' not in confirmed and asked_count.get('population', 0) < 1:
            return 3

        soc = {'mainReligion', 'government', 'driveSide'}
        if sum(1 for a in soc if a in confirmed or asked_count.get(a, 0) >= 1) < 2:
            return 4

        if 'language' not in confirmed and asked_count.get('language', 0) < 1:
            return 5

        return 6

    # ── Scoring ───────────────────────────────────────────────────────────────

    def _score(
        self, q: Dict, active_items: List[Item],
        bn: BayesianNetwork, target_stage: int,
    ) -> float:

        attr  = q['attribute']
        val   = q.get('value')
        stage = self.get_attribute_stage(attr)

        ig = self.info_gain_calc.calculate(active_items, attr, val)

        diff = stage - target_stage
        if diff == 0:
            stage_bonus = 0.55
        elif diff == 1:
            stage_bonus = 0.20
        elif diff == -1:
            stage_bonus = 0.05
        else:
            stage_bonus = max(0.0, 0.05 - abs(diff) * 0.02)

        yes_cnt = sum(
            1 for item in active_items
            if item.matches_question({'attribute': attr, 'value': val})
        )
        n       = len(active_items)
        balance = 1.0 - abs(0.5 - yes_cnt / n) * 2 if n else 0.0

        bn_score   = bn.score_question(q)
        importance = self.feature_importance.get(attr, 0.5)

        return (ig * 0.40 + stage_bonus * 0.35 +
                balance * 0.10 + bn_score * 0.10 + importance * 0.05)
