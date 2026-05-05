"""GuessMyPlace Backend — FastAPI v2.0.0"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import game, admin, health
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 GuessMyPlace Backend starting — Atlas Engine v2.0.0")
    yield
    logger.info("👋 Backend stopped")

app = FastAPI(
    title="GuessMyPlace API",
    description="Atlas GMP Engine — AI that guesses any place on Earth",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(game.router,   prefix="/api/v2", tags=["game"])
app.include_router(admin.router,  prefix="/api/admin", tags=["admin"])