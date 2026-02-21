"""
Item Model — strict, exact-match comparison only.

Critical fix: The old matches_question() used substring matching
('russia' in 'australia' → True). This caused catastrophic false positives.
Now ALL comparisons are exact-match after normalization.
"""

from typing import Dict, Any, List, Tuple
import logging

logger = logging.getLogger(__name__)


def _norm(v) -> str:
    """Normalize a value to a lowercase stripped string for comparison."""
    return str(v).lower().strip()


class Item:

    def __init__(self, item_id: int, name: str, attributes: Dict[str, Any],
                 emoji: str = "", info: str = ""):
        self.id         = item_id
        self.name       = name
        self.attributes = attributes
        self.emoji      = emoji
        self.info       = info
        self.probability: float = 0.0
        self.eliminated: bool   = False
        self.evidence:   List[Tuple[str, str, float]] = []
        self.match_history: List[Tuple[str, bool]]    = []

    @classmethod
    def from_dict(cls, data: Dict) -> 'Item':
        meta = {'id', 'name', 'emoji', 'info', 'probability', 'eliminated', 'evidence'}
        attrs = {k: v for k, v in data.items() if k not in meta}
        item = cls(data.get('id', 0), data.get('name', 'Unknown'),
                   attrs, data.get('emoji', '🎯'), data.get('info', ''))
        item.probability = data.get('probability', 0.0)
        item.eliminated  = data.get('eliminated', False)
        return item

    def to_dict(self) -> Dict:
        return {
            'id': self.id, 'name': self.name,
            'emoji': self.emoji, 'info': self.info,
            'probability': self.probability, 'eliminated': self.eliminated,
            'evidence': self.evidence,
            **self.attributes
        }

    def matches_question(self, question: Dict) -> bool:
        """
        Strict exact-match comparison — NO substring matching.

        Rules:
        - Boolean attrs: direct equality
        - String attrs:  normalized exact match only
        - List attrs:    target must exactly match one element (normalized)
        """
        attr         = question['attribute']
        target_value = question['value']
        item_value   = self.attributes.get(attr)

        if item_value is None:
            return False

        # Boolean
        if isinstance(item_value, bool) or isinstance(target_value, bool):
            return bool(item_value) == bool(target_value)

        # List attribute (neighbors, famousFor, flagColors, exports, …)
        if isinstance(item_value, list):
            target_norm = _norm(target_value)
            # EXACT match only — no substring
            return any(_norm(v) == target_norm for v in item_value)

        # Scalar string / number
        return _norm(item_value) == _norm(target_value)

    def get_normalized_attr_values(self, attr: str) -> set:
        """Return the set of normalized values for an attribute."""
        v = self.attributes.get(attr)
        if v is None:
            return set()
        if isinstance(v, list):
            return {_norm(x) for x in v}
        return {_norm(v)}

    def reset_probability(self):
        self.probability  = 0.0
        self.eliminated   = False
        self.evidence     = []
        self.match_history = []

    def __repr__(self):
        return f"Item(id={self.id}, name='{self.name}', prob={self.probability:.4f})"
