"""Health check endpoint."""

from fastapi import APIRouter
from app.models.schemas import HealthResponse
from app.services.supabase_service import get_client
from app.services.redis_service import RedisService

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    # DB check
    try:
        get_client().table("places").select("id").limit(1).execute()
        db_status = "ok"
    except Exception:
        db_status = "error"

    # Redis check
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