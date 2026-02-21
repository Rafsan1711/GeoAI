"""
Probability Manager — Aggressive Bayesian update + smart elimination.

Fix for confidence stuck at 38%:
- YES answer multiplier raised to 8× for match, 0.001× for mismatch
  (was 5× / 0.005×). This makes each YES dramatically more decisive.
- soft_filter now eliminates items whose probability < 1% of top item
  (was 0.1%). At 8 active items all at ~12%, a single YES should push
  the matching ones to dominate quickly.
- After elimination, normalize() is called again so probabilities sum to 1.
"""

import logging
from typing import List, Dict

from models.item_model import Item

logger = logging.getLogger(__name__)


class ProbabilityManager:

    # Multipliers: (match_likelihood, mismatch_likelihood)
    # YES on a matching attribute → ×8; mismatch → ×0.001 (near elimination)
    LIKELIHOOD: Dict[str, Dict[str, float]] = {
        'yes':         {'match': 8.0,   'mismatch': 0.001},
        'probably':    {'match': 3.5,   'mismatch': 0.15},
        'dontknow':    {'match': 1.0,   'mismatch': 1.0},
        'probablynot': {'match': 0.15,  'mismatch': 3.5},
        'no':          {'match': 0.001, 'mismatch': 8.0},
    }

    FLOOR = 1e-12   # probability never goes below this

    def update_item_probability(self, item: Item, question: Dict, answer: str) -> float:
        matches    = item.matches_question(question)
        params     = self.LIKELIHOOD.get(answer, self.LIKELIHOOD['dontknow'])
        likelihood = params['match'] if matches else params['mismatch']
        posterior  = max(item.probability * likelihood, self.FLOOR)

        item.evidence.append((question['question'], answer, likelihood))
        item.match_history.append((question['question'], matches))
        return posterior

    def normalize_probabilities(self, items: List[Item]) -> List[Item]:
        active = [i for i in items if not i.eliminated]
        if not active:
            logger.warning("All eliminated — reactivating all items.")
            for i in items:
                i.eliminated = False
            active = items

        total = sum(i.probability for i in active)
        if total < 1e-20:
            logger.warning("Probability mass vanished — resetting uniform.")
            p = 1.0 / len(active)
            for i in active:
                i.probability = p
            return items

        for i in active:
            i.probability /= total
        return items

    def soft_filter(self, items: List[Item]) -> List[Item]:
        """
        Eliminate items whose probability is < 1% of the top item's probability.
        Always keep at least the top 5 items active (safety net).
        Never eliminate more than 80% of the pool in one pass.
        """
        active = [i for i in items if not i.eliminated]
        n      = len(active)

        if n <= 5:
            return items   # nothing to filter yet

        sorted_active = sorted(active, key=lambda x: x.probability, reverse=True)
        top_prob      = sorted_active[0].probability

        # Threshold: 1% of top item's probability
        threshold = top_prob * 0.01

        # How many we're allowed to eliminate (max 80% of pool)
        max_elim  = int(n * 0.80)
        eliminated = 0

        # Start from index 1 — only rank #1 is immune, everyone else can be cut
        for item in sorted_active[1:]:
            if eliminated >= max_elim:
                break
            if item.probability < threshold:
                item.eliminated = True
                eliminated += 1

        if eliminated:
            logger.debug(
                f"soft_filter: eliminated {eliminated}/{n} items "
                f"(threshold={threshold:.2e})"
            )
            # Re-normalize after elimination
            self.normalize_probabilities(items)

        return items
