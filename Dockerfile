# WH40k Colony Manager - Backend Docker Image
# Multi-stage build for production-ready backend

# ============================================
# Stage 1: Dependencies
# ============================================
FROM python:3.12-slim-bookworm AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast dependency management
# Note: Using pip without --only-binary since uv is a pre-built wheel
RUN pip install uv

# Copy dependency files
COPY pyproject.toml uv.lock* README.md ./

# Install dependencies to a virtual environment
# Note: --frozen uses locked versions from uv.lock (addressing SonarQube docker:S8544)
# Using --no-build-isolation to prevent setup script execution (addressing docker:S8541)
RUN uv venv /app/.venv && \
    UV_PROJECT_ENVIRONMENT=/app/.venv uv sync --frozen --no-dev --no-build-isolation

# ============================================
# Stage 2: Runtime
# ============================================
FROM python:3.12-slim-bookworm AS runtime

# Create non-root user for security
RUN groupadd -r colony && useradd -r -g colony colony

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Copy application code
COPY colony_manager/ ./colony_manager/
COPY config/ ./config/
COPY alembic/ ./alembic/
COPY alembic.ini ./

# Set environment variables
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

# Change ownership to non-root user
RUN chown -R colony:colony /app

USER colony

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')" || exit 1

# Run with uvicorn
CMD ["uvicorn", "colony_manager.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]