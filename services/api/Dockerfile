FROM python:3.11-slim AS base

# Install PROJ system dependencies (required by pyproj)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libproj-dev \
    proj-data \
    proj-bin \
    libgeos-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Development target ────────────────────────────────────────────
FROM base AS dev
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ── Production target ─────────────────────────────────────────────
FROM base AS prod
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
