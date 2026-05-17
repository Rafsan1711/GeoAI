"""
FAISS Semantic Index — fast similarity search for disambiguation.

Build index: python -c "from atlas_engine.faiss_index import build_index; build_index()"
Index saved to: /tmp/gmp_faiss.index + /tmp/gmp_faiss_meta.json

Used by question_selector to find best discriminating questions
when only a few candidates remain.
"""

import json
import os
import numpy as np
from typing import Optional
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

INDEX_PATH = "/tmp/gmp_faiss.index"
META_PATH  = "/tmp/gmp_faiss_meta.json"

_index = None
_meta  = None   # list of {id, name, type}


def build_index() -> bool:
    """
    Build FAISS index from all active place embeddings in Supabase.
    Call this after adding new places via AtlasMind.
    """
    try:
        import faiss
        from app.services.supabase_service import get_client

        client = get_client()

        # Fetch all places with embeddings
        result = client.table("places").select(
            "id, name, type, embedding"
        ).eq("is_active", True).not_.is_("embedding", "null").execute()

        places = result.data or []
        if not places:
            logger.warning("No places with embeddings found")
            return False

        logger.info(f"Building FAISS index from {len(places)} places...")

        vectors = []
        meta    = []

        for p in places:
            emb = p.get("embedding")
            if not emb:
                continue
            if isinstance(emb, str):
                emb = json.loads(emb)
            vectors.append(np.array(emb, dtype=np.float32))
            meta.append({"id": p["id"], "name": p["name"], "type": p["type"]})

        if not vectors:
            return False

        matrix = np.stack(vectors)
        dim    = matrix.shape[1]   # 384 for MiniLM

        # Normalize for cosine similarity
        faiss.normalize_L2(matrix)

        # Build flat index (exact search — fast enough for <50k places)
        index = faiss.IndexFlatIP(dim)   # Inner Product = cosine after L2 norm
        index.add(matrix)

        # Save
        faiss.write_index(index, INDEX_PATH)
        with open(META_PATH, "w") as f:
            json.dump(meta, f)

        logger.info(f"FAISS index built: {len(meta)} vectors, dim={dim}")
        return True

    except ImportError:
        logger.warning("FAISS not installed — semantic search unavailable")
        return False
    except Exception as e:
        logger.error("FAISS build failed", error=str(e))
        return False


def load_index() -> bool:
    """Load saved index into memory."""
    global _index, _meta
    try:
        import faiss
        if not os.path.exists(INDEX_PATH) or not os.path.exists(META_PATH):
            logger.info("No FAISS index found — run build_index() first")
            return False

        _index = faiss.read_index(INDEX_PATH)
        with open(META_PATH) as f:
            _meta = json.load(f)

        logger.info(f"FAISS index loaded: {_index.ntotal} vectors")
        return True
    except Exception as e:
        logger.warning("FAISS load failed", error=str(e))
        return False


def find_most_similar(place_id: str, top_k: int = 5) -> list[dict]:
    """
    Find top_k most similar places to the given place_id.
    Returns list of {id, name, type, similarity}.
    """
    global _index, _meta

    if _index is None:
        load_index()
    if _index is None:
        return []

    try:
        # Find index of this place in meta
        idx = next((i for i, m in enumerate(_meta) if m["id"] == place_id), None)
        if idx is None:
            return []

        # Get its vector
        vec = np.zeros((1, _index.d), dtype=np.float32)
        _index.reconstruct(idx, vec[0])

        # Search
        D, I = _index.search(vec, top_k + 1)   # +1 because it finds itself

        results = []
        for dist, i in zip(D[0], I[0]):
            if i == idx or i < 0:
                continue
            results.append({
                **_meta[i],
                "similarity": float(dist),
            })

        return results[:top_k]

    except Exception as e:
        logger.warning("FAISS search failed", error=str(e))
        return []


def find_discriminating_attrs(
    place_a: dict,
    place_b: dict,
    candidate_attrs: list[str],
) -> list[str]:
    """
    Returns attributes that differ most between two similar places.
    Used by question_selector for final disambiguation.
    """
    differing = []
    for attr in candidate_attrs:
        va = place_a.get("attributes", {}).get(attr)
        vb = place_b.get("attributes", {}).get(attr)
        if va is None or vb is None:
            continue
        va_set = {str(x).lower().strip() for x in (va if isinstance(va, list) else [va])}
        vb_set = {str(x).lower().strip() for x in (vb if isinstance(vb, list) else [vb])}
        if va_set != vb_set:
            differing.append(attr)
    return differing