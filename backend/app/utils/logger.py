"""
Structured logging for GuessMyPlace backend.
Uses structlog for JSON-friendly logs in production,
pretty colored logs in development.
"""

import logging
import sys
import structlog
from app.core.config import settings


def setup_logger(name: str) -> structlog.BoundLogger:
    """Get a structured logger for a module."""
    
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )
    
    # Suppress noisy third-party loggers
    for noisy in ["httpx", "httpcore", "uvicorn.access"]:
        logging.getLogger(noisy).setLevel(logging.WARNING)

    # Processors differ by environment
    if settings.ENVIRONMENT == "production":
        processors = [
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.stdlib.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.JSONRenderer(),
        ]
    else:
        processors = [
            structlog.processors.TimeStamper(fmt="%H:%M:%S"),
            structlog.stdlib.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.dev.ConsoleRenderer(colors=True),
        ]

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(log_level),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

    return structlog.get_logger(name)