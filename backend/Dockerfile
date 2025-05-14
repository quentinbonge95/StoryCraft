# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# copy just requirements first for caching
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy code
COPY . .

# ensure folder for SQLite exists
RUN mkdir -p /app/db

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
