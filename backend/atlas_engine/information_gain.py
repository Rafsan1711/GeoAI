# backend/atlas_engine/information_gain.py এর calculate() method update করো:

def calculate(self, items: list[dict], attribute: str, value: Any) -> float:
    active = [i for i in items if not i.get("eliminated", False)]
    n = len(active)
    if n <= 1:
        return 0.0

    probs = np.array([i["probability"] for i in active], dtype=np.float64)
    total = probs.sum()
    if total < EPS:
        return 0.0
    probs /= total

    # Build match mask
    match_mask = [1 if self._matches(i, attribute, value) else 0 for i in active]

    # Use C++ if available
    try:
        import sys, os
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), "cpp"))
        import atlas_cpp
        gain = atlas_cpp.information_gain_binary(probs.tolist(), match_mask)
        return float(np.clip(gain, 0.0, 1.0))
    except ImportError:
        pass

    # Python fallback
    H_before = self._entropy(probs)
    if H_before < EPS:
        return 0.0

    yes_mask = np.array(match_mask, dtype=bool)
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