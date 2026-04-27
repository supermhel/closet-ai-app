# Multi-stage build for Closet AI Detection Service
# Stage 1: Builder stage for dependencies and models
FROM pytorch/pytorch:2.2.1-cuda12.1-cudnn8-runtime AS builder

# Set working directory
WORKDIR /build

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create model directory and download the model directly into it
RUN mkdir -p /build/models && \
    python -c "from ultralytics import YOLO; model = YOLO('yolov8s.pt'); import shutil; shutil.move('yolov8s.pt', '/build/models/yolov8s.pt')"

# Stage 2: Runtime stage with minimal dependencies
FROM pytorch/pytorch:2.2.1-cuda12.1-cudnn8-runtime

# Set working directory
WORKDIR /app

# Install runtime system dependencies only
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /opt/conda /opt/conda

# Set the PATH environment variable to include conda's bin directory
ENV PATH="/opt/conda/bin:$PATH"

# Copy the model from the builder stage to the final app directory
COPY --from=builder /build/models /app/models

# Copy application code
COPY . .

# Create health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/ || exit 1

# Expose the port the app runs on
EXPOSE 8000

# Set environment variable for Python unbuffered output
ENV PYTHONUNBUFFERED=1

# Run with gunicorn for production
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "--workers", "2", "--timeout", "120", "main:app"]
