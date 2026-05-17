"""Health check endpoints — DB, Redis, engine status."""

from fastapi import APIRouter
from app.models.schemas import HealthResponse
from app.services.supabase_service import get_client
from app.services.redis_service import RedisService
from app.utils.logger import setup_logger

logger = setup_logger(__name__)
router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    try:
        get_client().table("places").select("id").limit(1).execute()
        db_status = "ok"
    except Exception as e:
        logger.warning("DB health check failed", error=str(e))
        db_status = "error"

    try:
        if RedisService._client:
            await RedisService._client.ping()
            cache_status = "ok"
        else:
            cache_status = "unavailable"
    except Exception:
        cache_status = "error"

    return HealthResponse(
        status="healthy" if db_status == "ok" else "degraded",
        version="2.0.0",
        engine="Atlas GMP Engine v2.0.0",
        db=db_status,
        cache=cache_status,
    )


@router.get("/health/detailed")
async def health_detailed():
    """
    Detailed health — used by frontend AtlasCharacter for aging.
    Returns place counts by type + question count.
    """
    client = get_client()
    data_stats: dict[str, dict] = {}
    total_places = 0

    # Count by type
    PLACE_TYPES = [
        "country", "city", "landmark", "natural",
        "historical", "religious", "geographic", "tourist_spot"
    ]

    for ptype in PLACE_TYPES:
        try:
            res = client.table("places").select(
                "id", count="exact"
            ).eq("is_active", True).eq("type", ptype).execute()
            count = res.count or 0
            data_stats[ptype] = {"count": count}
            total_places += count
        except Exception:
            data_stats[ptype] = {"count": 0}

    # Question count
    try:
        q_res = client.table("questions").select(
            "id", count="exact"
        ).eq("is_active", True).execute()
        total_questions = q_res.count or 0
    except Exception:
        total_questions = 0

    # Latest accuracy
    try:
        acc_res = client.table("analytics_daily").select(
            "bot_test_accuracy, date"
        ).order("date", desc=True).limit(1).execute()
        latest_accuracy = acc_res.data[0]["bot_test_accuracy"] if acc_res.data else None
    except Exception:
        latest_accuracy = None

    return {
        "status":           "ok",
        "version":          "2.0.0",
        "engine":           "Atlas GMP Engine v2.0.0",
        "data_stats":       data_stats,
        "total_places":     total_places,
        "total_questions":  total_questions,
        "latest_accuracy":  latest_accuracy,
    }