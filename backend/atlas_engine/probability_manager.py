# probability_manager.py এর top এ এটা add করো:

# Try C++ hot-path, fall back to pure Python
try:
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "cpp"))
    import atlas_cpp
    _USE_CPP = True
    logger.info("✅ C++ probability ops loaded")
except ImportError:
    _USE_CPP = False
    logger.info("⚠️  C++ not available, using Python fallback")


# normalize method কে replace করো:
def normalize(self, items: list[dict]) -> list[dict]:
    active = [i for i in items if not i.get("eliminated")]
    if not active:
        for i in items:
            i["eliminated"] = False
        active = items

    if _USE_CPP:
        probs = [i["probability"] for i in active]
        atlas_cpp.normalize_probabilities(probs)
        for i, p in zip(active, probs):
            i["probability"] = p
    else:
        # Original Python implementation
        total = sum(i["probability"] for i in active)
        if total < 1e-20:
            p = 1.0 / len(active)
            for i in active:
                i["probability"] = p
        else:
            for i in active:
                i["probability"] /= total

    return items


# soft_filter method কে replace করো:
def soft_filter(self, items: list[dict]) -> list[dict]:
    active = [i for i in items if not i.get("eliminated")]
    n = len(active)
    if n <= 5:
        return items

    if _USE_CPP:
        probs    = [i["probability"] for i in active]
        to_elim  = atlas_cpp.soft_filter(probs, min_keep=5, threshold_pct=0.005)
        for idx in to_elim:
            active[idx]["eliminated"] = True
        if to_elim:
            self.normalize(items)
    else:
        # Original Python soft_filter logic
        top_prob  = max(i["probability"] for i in active)
        threshold = top_prob * 0.005
        sorted_active = sorted(active, key=lambda x: x["probability"], reverse=True)
        max_elim  = int(n * 0.80)
        eliminated = 0
        for item in sorted_active[1:]:
            if eliminated >= max_elim:
                break
            if item["probability"] < threshold:
                item["eliminated"] = True
                eliminated += 1
        if eliminated:
            self.normalize(items)

    return items