FROM python:3.11-slim

# Set work directory
WORKDIR /app

# Copy backend code
COPY . . 

# Install Python dependencies
RUN pip install fastapi uvicorn[standard] SQLAlchemy passlib[bcrypt] PyJWT requests

# Create directory for SQLite DB file and set permissions
RUN mkdir -p /app/data

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
