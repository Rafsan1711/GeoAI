"""
Embeddings — semantic similarity using MiniLM-L6-v2.
Used for 'last mile' disambiguation of near-identical places.
Model downloaded at Docker build time (see Dockerfile).
"""

import numpy as np
from typing import Optional
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

_model = None   # Lazy load


def _get_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("Embedding model loaded: all-MiniLM-L6-v2")
        except Exception as e:
            logger.error("Failed to load embedding model", error=str(e))
    return _model


def embed_place(place: dict) -> Optional[np.ndarray]:
    """Create a 384-dim embedding for a place from its text fields."""
    model = _get_model()
    if not model:
        return None

    parts = [
        place.get("name", ""),
        place.get("type", ""),
        place.get("description", ""),
        place.get("fun_fact", ""),
    ]
    # Add key attributes as text
    attrs = place.get("attributes", {})
    for key in ("continent", "subRegion", "language", "mainReligion", "climate"):
        v = attrs.get(key)
        if v:
            parts.append(f"{key}: {v}")

    text = " | ".join(p for p in parts if p)
    if not text.strip():
        return None

    try:
        vec = model.encode(text, normalize_embeddings=True)
        return vec
    except Exception as e:
        logger.warning("Embed failed", name=place.get("name"), error=str(e))
        return None


def find_discriminating_attributes(
    item_a: dict,
    item_b: dict,
    candidate_attrs: list[str],
) -> list[str]:
    """
    Given two near-identical places, return which attributes differ most.
    Used by question_selector to prioritize disambiguation questions.
    """
    differing = []
    for attr in candidate_attrs:
        va = item_a.get("attributes", {}).get(attr)
        vb = item_b.get("attributes", {}).get(attr)
        if va is None or vb is None:
            continue
        va_norm = {str(x).lower().strip() for x in (va if isinstance(va, list) else [va])}
        vb_norm = {str(x).lower().strip() for x in (vb if isinstance(vb, list) else [vb])}
        if va_norm != vb_norm:
            differing.append(attr)
    return differing