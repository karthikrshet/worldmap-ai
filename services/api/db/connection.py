"""
Database connection and session management.
Uses SQLAlchemy async engine with asyncpg driver.
"""

from __future__ import annotations

from typing import AsyncGenerator

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from config import settings

logger = structlog.get_logger(__name__)

engine = create_async_engine(
    settings.database_url,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    echo=settings.api_debug,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: yields a database session."""
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Verify database connectivity on startup."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Database connection established")
    except Exception as exc:
        logger.error("Database connection failed", error=str(exc))
        raise


async def get_dataset_status() -> list[dict]:
    """Return list of ingested datasets for health check."""
    try:
        async with async_session_factory() as session:
            result = await session.execute(
                text(
                    """
                    SELECT name, provider, version, license, retrieved_at, entity_count
                    FROM datasets
                    ORDER BY retrieved_at DESC
                    LIMIT 10
                    """
                )
            )
            rows = result.mappings().all()
            return [dict(r) for r in rows]
    except Exception as exc:
        logger.warning("Could not fetch dataset status", error=str(exc))
        return []
