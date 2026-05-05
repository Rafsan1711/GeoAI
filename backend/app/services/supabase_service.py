"""
Supabase service — all DB operations.
"""

from typing import Optional
from supabase import create_client, Client
from app.core.config import settings
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

_client: Optional[Client] = None


def get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    return _client


class SupabaseService:

    # ── Places ─────────────────────────────────────────────

    @staticmethod
    def get_all_active_places(place_type: Optional[str] = None) -> list[dict]:
        """Fetch all active places (optionally filtered by type)."""
        try:
            client = get_client()
            query = client.table("places").select(
                "id, name, type, subtype, emoji, description, fun_fact, "
                "interesting_facts, attributes, data_quality_score"
            ).eq("is_active", True)
            
            if place_type:
                query = query.eq("type", place_type)
            
            result = query.execute()
            logger.info("Places loaded", count=len(result.data), type=place_type or "all")
            return result.data
        except Exception as e:
            logger.error("Failed to load places", error=str(e))
            return []

    @staticmethod
    def get_place_by_id(place_id: str) -> Optional[dict]:
        try:
            result = get_client().table("places").select("*").eq("id", place_id).single().execute()
            return result.data
        except Exception:
            return None

    @staticmethod
    def get_place_by_name(name: str) -> Optional[dict]:
        try:
            result = get_client().table("places").select("*").ilike("name", name).limit(1).execute()
            return result.data[0] if result.data else None
        except Exception:
            return None

    @staticmethod
    def upsert_place(place_data: dict) -> Optional[dict]:
        try:
            result = get_client().table("places").upsert(
                place_data, on_conflict="name"
            ).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error("Place upsert failed", error=str(e))
            return None

    # ── Questions ──────────────────────────────────────────

    @staticmethod
    def get_all_questions(place_type: Optional[str] = None) -> list[dict]:
        try:
            client = get_client()
            query = client.table("questions").select("*").eq("is_active", True).order("stage")
            result = query.execute()
            
            if place_type:
                # Filter: questions with empty applicable_types (=all) OR matching type
                filtered = [
                    q for q in result.data
                    if not q.get("applicable_types") or place_type in q.get("applicable_types", [])
                ]
                return filtered
            return result.data
        except Exception as e:
            logger.error("Failed to load questions", error=str(e))
            return []

    @staticmethod
    def update_question_stats(question_id: str, info_gain: float):
        try:
            client = get_client()
            current = client.table("questions").select(
                "times_asked, avg_info_gain"
            ).eq("id", question_id).single().execute()
            
            if current.data:
                n = current.data["times_asked"] + 1
                old_avg = current.data["avg_info_gain"]
                new_avg = ((old_avg * (n - 1)) + info_gain) / n
                client.table("questions").update({
                    "times_asked": n,
                    "avg_info_gain": round(new_avg, 4)
                }).eq("id", question_id).execute()
        except Exception as e:
            logger.warning("Question stats update failed", error=str(e))

    # ── Feature Importance ─────────────────────────────────

    @staticmethod
    def get_feature_importance() -> dict[str, float]:
        try:
            result = get_client().table("feature_importance").select(
                "attribute, importance_score"
            ).execute()
            return {row["attribute"]: row["importance_score"] for row in result.data}
        except Exception as e:
            logger.warning("Feature importance load failed", error=str(e))
            return {}

    @staticmethod
    def update_feature_importance(attribute: str, score: float, decisive_increment: int = 0):
        try:
            get_client().table("feature_importance").upsert({
                "attribute": attribute,
                "importance_score": round(score, 4),
                "times_decisive": decisive_increment
            }, on_conflict="attribute,place_type").execute()
        except Exception as e:
            logger.warning("Feature importance update failed", error=str(e))

    # ── Analytics ──────────────────────────────────────────

    @staticmethod
    def log_game_result(session_data: dict):
        try:
            get_client().table("game_sessions").insert(session_data).execute()
        except Exception as e:
            logger.warning("Game result log failed", error=str(e))

    @staticmethod
    def get_daily_analytics(limit: int = 30) -> list[dict]:
        try:
            result = get_client().table("analytics_daily").select("*").order(
                "date", desc=True
            ).limit(limit).execute()
            return result.data
        except Exception:
            return []

    @staticmethod
    def upsert_daily_analytics(date_str: str, data: dict):
        try:
            data["date"] = date_str
            get_client().table("analytics_daily").upsert(
                data, on_conflict="date"
            ).execute()
        except Exception as e:
            logger.warning("Analytics upsert failed", error=str(e))

    # ── Admin ──────────────────────────────────────────────

    @staticmethod
    def get_or_create_admin(firebase_uid: str, email: str) -> dict:
        client = get_client()
        existing = client.table("admin_users").select("*").eq(
            "firebase_uid", firebase_uid
        ).execute()
        
        if existing.data:
            client.table("admin_users").update(
                {"last_login": "now()"}
            ).eq("firebase_uid", firebase_uid).execute()
            return existing.data[0]
        
        # First admin ever = super admin
        count = client.table("admin_users").select("id", count="exact").execute()
        is_first = (count.count == 0)
        
        result = client.table("admin_users").insert({
            "firebase_uid": firebase_uid,
            "email": email,
            "is_super_admin": is_first
        }).execute()
        return result.data[0]