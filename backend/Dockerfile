# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install required system packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    postgresql-client-15 \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user and set up directories with proper permissions
RUN useradd -m appuser && \
    mkdir -p /db && \
    chown -R appuser:appuser /app /db

# Switch to non-root user
USER appuser

# Set environment variables
ENV PYTHONPATH=/app \
    DOCKER=true \
    SQL_ECHO=false \
    PATH="/home/appuser/.local/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONFAULTHANDLER=1

# Copy requirements first for better layer caching
COPY --chown=appuser:appuser requirements.txt .

# Install Python dependencies as non-root user
RUN pip install --user --no-cache-dir -r requirements.txt alembic

# Copy application code and .env file
COPY --chown=appuser:appuser . .

# Create necessary directories
RUN mkdir -p /home/appuser/.local/state/storycraft && \
    chown -R appuser:appuser /home/appuser/.local/state/storycraft && \
    chmod -R 777 /app

# Set working directory to the app directory
WORKDIR /app/app

# Expose the port the app runs on
EXPOSE 8000

# Create a volume for database storage
VOLUME ["/db"]

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
