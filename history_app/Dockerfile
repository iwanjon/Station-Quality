# Use latest Python 3.13 on Alpine
# FROM python:3-alpine3.13
FROM python:3.13-alpine3.22

# Prevent Python from writing .pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Set working directory
WORKDIR /app

# Install system dependencies (tzdata optional for correct timezone)
RUN apk add --no-cache \
    build-base \
    libffi-dev \
    openssl-dev \
    tzdata\
    curl
# System deps for Tkinter
RUN apk add --no-cache tcl tk

# (Optional: fonts if your app renders text)
# RUN apk add --no-cache ttf-dejavu font-noto

# Copy dependency list first for better caching
COPY requirements.txt .

# Upgrade pip and install Python packages
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy your FastAPI app source
COPY . .

# Expose default FastAPI port
EXPOSE 8000

# Run FastAPI using Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
