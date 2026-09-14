"""
WorldMap AI — Geospatial API
FastAPI application entry point.

Architecture principle: AI interprets questions.
Deterministic geospatial engines calculate answers.
"""

from __future__ import annotations

import time
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
import uvicorn
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from config import settings
from db.connection import engine, init_db
from routers import calculations, countries, geometry, projections

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan — initialise DB pool on startup."""
    logger.info("WorldMap AI API starting", version=settings.app_version)
    await init_db()
    yield
    logger.info("WorldMap AI API shutting down")
    await engine.dispose()


app = FastAPI(
    title="WorldMap AI — Geospatial API",
    description=(
        "Deterministic geospatial calculation service for WorldMap AI. "
        "All geographic facts are computed from versioned authoritative datasets. "
        "AI interprets questions; this service calculates answers."
    ),
    version=settings.app_version,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Request-ID"],
)


# ── Request ID + latency middleware ───────────────────────────────
@app.middleware("http")
async def request_middleware(request: Request, call_next: object) -> Response:
    import uuid
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start = time.perf_counter()
    response: Response = await call_next(request)  # type: ignore[operator]
    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Duration-Ms"] = str(duration_ms)
    logger.info(
        "request",
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        duration_ms=duration_ms,
        request_id=request_id,
    )
    return response


# ── Routers ───────────────────────────────────────────────────────
PREFIX = "/api/v1"
app.include_router(countries.router, prefix=PREFIX)
app.include_router(projections.router, prefix=PREFIX)
app.include_router(calculations.router, prefix=PREFIX)
app.include_router(geometry.router, prefix=PREFIX)


# ── Health endpoint ───────────────────────────────────────────────
@app.get("/api/v1/health", tags=["health"])
async def health() -> dict:
    """Service health check. Returns API status and dataset availability."""
    from db.connection import get_dataset_status
    dataset_status = await get_dataset_status()
    return {
        "status": "ok",
        "version": settings.app_version,
        "datasets": dataset_status,
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_debug,
        log_level=settings.log_level.lower(),
    )
