"""
Admin API — Full Implementation.

AUTH RULES:
  - First Google account to ever login = super admin (automatically)
  - Nobody else can access /admin AT ALL
  - Firebase ID token required for every endpoint
  - 401 = not authenticated, 403 = not admin

ENDPOINTS:
  GET  /api/admin/stats
  GET  /api/admin/places
  GET  /api/admin/accuracy
  POST /api/admin/accuracy/run
  POST /api/admin/atlasmind/check
  POST /api/admin/atlasmind/generate
  POST /api/admin/engine/reload-fi
  POST /api/admin/engine/rebuild-faiss
  GET  /api/admin/engine/selftest
"""

import json
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from app.services.supabase_service import SupabaseService, get_client
from app.utils.logger import setup_logger

logger = setup_logger(__name__)
router = APIRouter()
bearer = HTTPBearer()

_firebase_initialized = False


# ── Firebase Admin SDK init ───────────────────────────────────

def _init_firebase():
    global _firebase_initialized
    if _firebase_initialized:
        return True
    try:
        import firebase_admin
        from firebase_admin import credentials as fb_creds
        from app.core.config import settings

        if firebase_admin._apps:
            _firebase_initialized = True
            return True

        sdk = settings.FIREBASE_ADMIN_SDK_JSON
        if not sdk:
            logger.error("FIREBASE_ADMIN_SDK_JSON not set in environment")
            return False

        cred = fb_creds.Certificate(json.loads(sdk))
        firebase_admin.initialize_app(cred)
        _firebase_initialized = True
        logger.info("Firebase Admin SDK initialized")
        return True
    except Exception as e:
        logger.error("Firebase Admin SDK init failed", error=str(e))
        return False


# ── Auth dependency ───────────────────────────────────────────

async def verify_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> dict:
    """
    Verify Firebase ID token.
    Only allows users in admin_users table.
    First-ever login creates the super admin record.
    """
    if not _init_firebase():
        raise HTTPException(
            status_code=503,
            detail="Auth service unavailable — Firebase not configured"
        )

    try:
        from firebase_admin import auth as fb_auth
        decoded = fb_auth.verify_id_token(credentials.credentials)
        uid     = decoded["uid"]
        email   = decoded.get("email", "")
    except Exception as e:
        logger.warning("Token verification failed", error=str(e))
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Check admin_users table
    try:
        client = get_client()

        # Count total admins
        count_res = client.table("admin_users").select(
            "id", count="exact"
        ).execute()
        total_admins = count_res.count or 0

        if total_admins == 0:
            # First ever login → this person becomes super admin
            result = client.table("admin_users").insert({
                "firebase_uid":  uid,
                "email":         email,
                "is_super_admin": True,
            }).execute()
            admin = result.data[0]
            logger.info("First admin created", email=email, uid=uid)

        else:
            # Check if this UID is in admin_users
            existing = client.table("admin_users").select("*").eq(
                "firebase_uid", uid
            ).execute()

            if not existing.data:
                # Not an admin — reject completely
                logger.warning(
                    "Unauthorized admin access attempt",
                    email=email,
                    uid=uid,
                )
                raise HTTPException(
                    status_code=403,
                    detail="Access denied. This account is not registered as admin."
                )

            admin = existing.data[0]

            # Update last login
            client.table("admin_users").update(
                {"last_login": "now()"}
            ).eq("firebase_uid", uid).execute()

        return admin

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Admin auth DB error", error=str(e))
        raise HTTPException(status_code=500, detail="Auth check failed")


# ── Request models ────────────────────────────────────────────

class AtlasMindCheckRequest(BaseModel):
    names: list[str]


class AtlasMindGenerateRequest(BaseModel):
    names:              list[str]
    place_type:         Optional[str] = None
    generate_questions: bool = True


class RunAccuracyRequest(BaseModel):
    place_type: Optional[str] = None


# ── Stats ─────────────────────────────────────────────────────

@router.get("/stats")
async def admin_stats(admin: dict = Depends(verify_admin)):
    """
    Real stats from DB only. No fake/mock data.
    """
    client = get_client()
    stats  = {}

    # Place counts by type
    try:
        places_res = client.table("places").select(
            "type"
        ).eq("is_active", True).execute()

        type_counts: dict[str, int] = {}
        for row in (places_res.data or []):
            t = row.get("type", "unknown")
            type_counts[t] = type_counts.get(t, 0) + 1

        stats["total_places"]   = sum(type_counts.values())
        stats["places_by_type"] = type_counts
    except Exception as e:
        logger.error("Places count failed", error=str(e))
        stats["total_places"]   = None
        stats["places_by_type"] = {}

    # Question count
    try:
        q_res = client.table("questions").select(
            "id", count="exact"
        ).eq("is_active", True).execute()
        stats["total_questions"] = q_res.count or 0
    except Exception:
        stats["total_questions"] = None

    # Latest accuracy from analytics
    try:
        acc_res = client.table("analytics_daily").select(
            "bot_test_accuracy, bot_test_total, bot_test_correct,"
            " bot_test_avg_questions, bot_test_ran_at, date"
        ).order("date", desc=True).limit(1).execute()

        if acc_res.data:
            row = acc_res.data[0]
            stats["latest_accuracy"]      = row.get("bot_test_accuracy")
            stats["latest_test_date"]     = row.get("date")
            stats["latest_test_total"]    = row.get("bot_test_total")
            stats["latest_test_correct"]  = row.get("bot_test_correct")
            stats["latest_avg_questions"] = row.get("bot_test_avg_questions")
        else:
            stats["latest_accuracy"]  = None
            stats["latest_test_date"] = None
    except Exception:
        stats["latest_accuracy"] = None

    # Last 7 days analytics
    try:
        analytics = SupabaseService.get_daily_analytics(7)
        stats["analytics_7d"] = analytics
    except Exception:
        stats["analytics_7d"] = []

    # Recent game count (last 7 days)
    try:
        from datetime import date, timedelta
        week_ago = str(date.today() - timedelta(days=7))
        sessions_res = client.table("game_sessions").select(
            "id", count="exact"
        ).gte("created_at", week_ago).execute()
        stats["games_last_7d"] = sessions_res.count or 0
    except Exception:
        stats["games_last_7d"] = None

    stats["admin_email"] = admin["email"]
    return stats


# ── Places ────────────────────────────────────────────────────

@router.get("/places")
async def list_places(
    page:       int = 1,
    per_page:   int = 50,
    place_type: Optional[str] = None,
    search:     Optional[str] = None,
    admin: dict = Depends(verify_admin),
):
    client = get_client()
    offset = (page - 1) * per_page

    query = client.table("places").select(
        "id, name, type, subtype, emoji, is_active,"
        " is_verified, data_quality_score, created_at, created_by"
    ).order("name").range(offset, offset + per_page - 1)

    if place_type:
        query = query.eq("type", place_type)
    if search:
        query = query.ilike("name", f"%{search}%")

    try:
        result = query.execute()
        return {
            "places":   result.data or [],
            "page":     page,
            "per_page": per_page,
        }
    except Exception as e:
        logger.error("Places list failed", error=str(e))
        raise HTTPException(500, "Failed to load places")


# ── AtlasMind — Duplicate Check ───────────────────────────────

@router.post("/atlasmind/check")
async def atlasmind_check(
    req:   AtlasMindCheckRequest,
    admin: dict = Depends(verify_admin),
):
    if not req.names:
        return {"results": {}}

    valid_names = [n.strip() for n in req.names if n.strip()]
    if not valid_names:
        return {"results": {}}

    try:
        from app.services.atlasmind_pipeline import atlasmind_pipeline
        _, dup_results = atlasmind_pipeline._deduplicate(valid_names)
        dup_map = {r.name: r for r in dup_results}

        results = {}
        for name in valid_names:
            if name in dup_map:
                r = dup_map[name]
                results[name] = {
                    "exists":     True,
                    "id":         r.place_id,
                    "similar_to": r.similar_to,
                }
            else:
                results[name] = {
                    "exists":     False,
                    "id":         None,
                    "similar_to": None,
                }

        return {"results": results}

    except Exception as e:
        logger.error("AtlasMind check failed", error=str(e))
        raise HTTPException(500, "Duplicate check failed")


# ── AtlasMind — Generate ──────────────────────────────────────

@router.post("/atlasmind/generate")
async def atlasmind_generate(
    req:   AtlasMindGenerateRequest,
    admin: dict = Depends(verify_admin),
):
    if not req.names:
        raise HTTPException(400, "No names provided")
    if len(req.names) > 50:
        raise HTTPException(400, "Maximum 50 places per request")

    # Check Gemini is configured
    from app.core.config import settings
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            503,
            "Gemini API key not configured. Set GEMINI_API_KEY in environment."
        )

    try:
        from app.services.atlasmind_pipeline import atlasmind_pipeline

        report = await atlasmind_pipeline.run(
            names=req.names,
            place_type=req.place_type,
            admin_email=admin["email"],
            generate_questions=req.generate_questions,
        )

        return {
            "total":       report.total,
            "inserted":    report.inserted,
            "duplicates":  report.duplicates,
            "failed":      report.failed,
            "low_quality": report.low_quality,
            "summary":     report.summary(),
            "results": [
                {
                    "name":                r.name,
                    "status":              r.status,
                    "place_id":            r.place_id,
                    "quality":             round(r.quality, 2) if r.quality else None,
                    "error":               r.error,
                    "similar_to":          r.similar_to,
                    "questions_generated": r.questions_generated,
                }
                for r in report.results
            ],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("AtlasMind generate failed", error=str(e))
        raise HTTPException(500, f"Generation failed: {str(e)}")


# ── Accuracy ──────────────────────────────────────────────────

@router.get("/accuracy")
async def accuracy_history(
    days:  int = 30,
    admin: dict = Depends(verify_admin),
):
    try:
        analytics = SupabaseService.get_daily_analytics(days)

        # Build graph data (only rows that have bot test data)
        graph_data = []
        for row in reversed(analytics):
            if row.get("bot_test_accuracy") is not None:
                graph_data.append({
                    "date":          row["date"],
                    "accuracy":      row["bot_test_accuracy"],
                    "total":         row.get("bot_test_total", 0),
                    "correct":       row.get("bot_test_correct", 0),
                    "avg_questions": row.get("bot_test_avg_questions", 0),
                    "ran_at":        row.get("bot_test_ran_at"),
                })

        # Confusion pairs from latest row
        confusion_pairs = []
        if analytics:
            raw_pairs = analytics[0].get("confusion_pairs")
            if raw_pairs:
                if isinstance(raw_pairs, str):
                    try:
                        confusion_pairs = json.loads(raw_pairs)
                    except Exception:
                        confusion_pairs = []
                elif isinstance(raw_pairs, list):
                    confusion_pairs = raw_pairs

        return {
            "graph_data":    graph_data,
            "latest":        graph_data[-1] if graph_data else None,
            "total_records": len(graph_data),
            "confusion_pairs": confusion_pairs[:10],
        }

    except Exception as e:
        logger.error("Accuracy history failed", error=str(e))
        raise HTTPException(500, "Failed to load accuracy data")


@router.post("/accuracy/run")
async def trigger_accuracy_test(
    req:              RunAccuracyRequest,
    background_tasks: BackgroundTasks,
    admin:            dict = Depends(verify_admin),
):
    async def _run_test(place_type: Optional[str]):
        try:
            import subprocess, sys, os
            cmd = [sys.executable, "scripts/run_accuracy_test.py"]
            if place_type:
                cmd += ["--type", place_type]
            subprocess.Popen(cmd, cwd="/app")
            logger.info("Accuracy test subprocess started", place_type=place_type)
        except Exception as e:
            logger.error("Accuracy test trigger failed", error=str(e))

    background_tasks.add_task(_run_test, req.place_type)

    return {
        "status":  "started",
        "message": "Accuracy test running in background. Check /admin/accuracy in ~5-10 minutes.",
    }


# ── Engine Controls ───────────────────────────────────────────

@router.post("/engine/reload-fi")
async def reload_feature_importance(admin: dict = Depends(verify_admin)):
    """Reload feature importance into engine without restart."""
    try:
        from app.api.game import _engine
        fi = SupabaseService.get_feature_importance()
        if fi:
            _engine.load_feature_importance(fi)
            logger.info("Feature importance reloaded", count=len(fi))
            return {"status": "ok", "attributes_loaded": len(fi)}
        return {"status": "no_data", "message": "No feature importance found in DB"}
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/engine/rebuild-faiss")
async def rebuild_faiss(
    background_tasks: BackgroundTasks,
    admin:            dict = Depends(verify_admin),
):
    async def _rebuild():
        try:
            from atlas_engine.faiss_index import build_index
            ok = build_index()
            logger.info("FAISS rebuild complete", success=ok)
        except Exception as e:
            logger.error("FAISS rebuild failed", error=str(e))

    background_tasks.add_task(_rebuild)
    return {
        "status":  "started",
        "message": "FAISS index rebuilding in background.",
    }


@router.get("/engine/selftest")
async def engine_selftest(admin: dict = Depends(verify_admin)):
    """
    Quick internal sanity test — run 5 mini-games and return accuracy.
    Used to verify engine after deployments.
    """
    import random
    from app.services.supabase_service import SupabaseService
    from atlas_engine.inference_engine import InferenceEngine

    places    = SupabaseService.get_all_active_places("country")
    questions = SupabaseService.get_all_questions("country")

    if not places or not questions:
        return {"status": "error", "message": "No data in database"}

    engine  = InferenceEngine()
    fi      = SupabaseService.get_feature_importance()
    if fi:
        engine.load_feature_importance(fi)

    sample  = random.sample(places, min(5, len(places)))
    results = []

    for target in sample:
        session = engine.start_game(places, questions)

        for _ in range(40):
            q = engine.get_next_question(session)
            if q is None:
                break

            attr  = q["attribute"]
            value = q.get("value")
            iv    = target.get("attributes", {}).get(attr)

            if iv is None:
                ans = "dontknow"
            elif isinstance(iv, bool) or isinstance(value, bool):
                ans = "yes" if bool(iv) == bool(value) else "no"
            elif isinstance(iv, list):
                ans = "yes" if str(value).lower().strip() in {
                    str(x).lower().strip() for x in iv
                } else "no"
            else:
                ans = "yes" if str(iv).lower().strip() == str(value).lower().strip() else "no"

            result = engine.process_answer(session, ans)
            if result["should_stop"]:
                break

        pred    = engine.get_prediction(session)
        guessed = pred["prediction"]["name"] if pred["prediction"] else None
        correct = bool(guessed and guessed.lower() == target["name"].lower())

        results.append({
            "target":     target["name"],
            "guessed":    guessed,
            "correct":    correct,
            "questions":  pred["questions_asked"],
            "confidence": pred["confidence"],
        })

    n        = len(results)
    accuracy = sum(1 for r in results if r["correct"]) / n * 100 if n else 0

    return {
        "status":      "ok",
        "accuracy":    f"{accuracy:.0f}%",
        "correct":     sum(1 for r in results if r["correct"]),
        "total":       n,
        "results":     results,
    }