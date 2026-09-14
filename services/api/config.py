"""Application configuration via environment variables (Pydantic Settings)."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_version: str = "0.1.0"

    # Database
    database_url: str = "postgresql+asyncpg://worldmap:worldmap@localhost:5432/worldmap"

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_debug: bool = False

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    # Data
    data_directory: Path = Path("./datasets")
    natural_earth_version: str = "5.1.2"

    # Logging
    log_level: str = "INFO"

    @property
    def data_dir(self) -> Path:
        self.data_directory.mkdir(parents=True, exist_ok=True)
        return self.data_directory


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
