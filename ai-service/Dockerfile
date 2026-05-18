# ==========================================
# RUNTIME ENVIRONMENT FOR FASTAPI AI SERVICE
# ==========================================
FROM python:3.10-slim

# Prevent Python from writing .pyc compiled files to disk and enable direct console logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install basic system build utilities to build optional binary Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Cache dependencies by copying requirements.txt first
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all python source code and training assets
COPY . .

# Create a non-privileged user and create directory for model persistence
RUN adduser --disabled-password --gecos "" appuser \
    && mkdir -p /app/app/saved_models \
    && chown -R appuser:appuser /app

# Switch to the non-root secure user context
USER appuser

# FastAPI default port
EXPOSE 8000

# Start Uvicorn production ASGI server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
