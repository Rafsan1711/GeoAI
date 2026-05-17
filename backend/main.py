"""
GuessMyPlace Backend — FastAPI v2.0.0
Atlas GMP Engine
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api import game, admin, health
from app.services.redis_service import RedisService
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 55)
    logger.info("  GuessMyPlace Backend — Starting")
    logger.info(f"  Environment : {settings.ENVIRONMENT}")
    logger.info(f"  Atlas Engine: v2.0.0")
    logger.info("=" * 55)

    # Redis
    await RedisService.initialize()

    # Pre-load feature importance into engine
    try:
        from app.services.supabase_service import SupabaseService
        from app.api.game import _engine
        fi = SupabaseService.get_feature_importance()
        if fi:
            _engine.load_feature_importance(fi)
            logger.info(f"Feature importance loaded: {len(fi)} attributes")
        else:
            logger.warning("No feature importance found in DB — using defaults")
    except Exception as e:
        logger.warning("Feature importance preload failed", error=str(e))

    # Load FAISS index if available
    try:
        from atlas_engine.faiss_index import load_index
        loaded = load_index()
        if loaded:
            logger.info("FAISS semantic index loaded")
        else:
            logger.info("FAISS index not found — semantic search disabled")
    except Exception as e:
        logger.info("FAISS not available", error=str(e))

    logger.info("✅ Backend ready")
    yield

    # Cleanup
    await RedisService.close()
    logger.info("👋 Backend stopped")


app = FastAPI(
    title="GuessMyPlace API",
    description="Atlas GMP Engine — AI that guesses any place on Earth",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global exception handler ──────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        "Unhandled exception",
        path=request.url.path,
        method=request.method,
        error=str(exc),
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


# ── Routers ───────────────────────────────────────────────────
app.include_router(health.router, tags=["health"])
app.include_router(game.router,   prefix="/api/v2",    tags=["game"])
app.include_router(admin.router,  prefix="/api/admin", tags=["admin"])