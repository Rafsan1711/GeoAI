"""
Redis service — game session storage.
Each session stored as a JSON hash with 2-hour TTL.
"""

import json
import redis.asyncio as aioredis
from typing import Optional
from app.core.config import settings
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

SESSION_TTL = 7200  # 2 hours in seconds
SESSION_PREFIX = "gmp:session:"


class RedisService:
    _pool: Optional[aioredis.ConnectionPool] = None
    _client: Optional[aioredis.Redis] = None

    @classmethod
    async def initialize(cls):
        """Call once at startup."""
        try:
            cls._pool = aioredis.ConnectionPool.from_url(
                settings.REDIS_URL,
                max_connections=20,
                decode_responses=True,
            )
            cls._client = aioredis.Redis(connection_pool=cls._pool)
            await cls._client.ping()
            logger.info("Redis connected", url=settings.REDIS_URL[:30] + "...")
        except Exception as e:
            logger.warning("Redis unavailable, sessions will be in-memory", error=str(e))
            cls._client = None

    @classmethod
    async def close(cls):
        if cls._client:
            await cls._client.aclose()

    @classmethod
    def _key(cls, session_id: str) -> str:
        return f"{SESSION_PREFIX}{session_id}"

    @classmethod
    async def save_session(cls, session_id: str, data: dict) -> bool:
        if not cls._client:
            return False
        try:
            key = cls._key(session_id)
            await cls._client.setex(key, SESSION_TTL, json.dumps(data, default=str))
            return True
        except Exception as e:
            logger.error("Redis save failed", session_id=session_id, error=str(e))
            return False

    @classmethod
    async def load_session(cls, session_id: str) -> Optional[dict]:
        if not cls._client:
            return None
        try:
            key = cls._key(session_id)
            raw = await cls._client.get(key)
            if raw:
                await cls._client.expire(key, SESSION_TTL)   # reset TTL on access
                return json.loads(raw)
            return None
        except Exception as e:
            logger.error("Redis load failed", session_id=session_id, error=str(e))
            return None

    @classmethod
    async def delete_session(cls, session_id: str) -> bool:
        if not cls._client:
            return False
        try:
            await cls._client.delete(cls._key(session_id))
            return True
        except Exception as e:
            logger.error("Redis delete failed", session_id=session_id, error=str(e))
            return False

    @classmethod
    async def session_exists(cls, session_id: str) -> bool:
        if not cls._client:
            return False
        try:
            return bool(await cls._client.exists(cls._key(session_id)))
        except Exception:
            return False