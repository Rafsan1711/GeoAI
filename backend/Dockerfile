# backend/Dockerfile — REPLACE পুরো file

FROM python:3.11-slim

ENV PORT=7860
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Build tools — needed for C++ extension and sentence-transformers
RUN apt-get update && apt-get install -y \
    build-essential \
    g++ \
    cmake \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download embedding model at build time
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy application
COPY . .

# Build C++ extension (optional, graceful fallback if fails)
RUN cd atlas_engine/cpp && \
    pip install pybind11 && \
    python setup.py build_ext --inplace && \
    echo "✅ C++ extension built" || \
    echo "⚠️ C++ build failed, Python fallback will be used"

EXPOSE 7860

# Single worker — important for HF Space
CMD ["uvicorn", "main:app", \
     "--host", "0.0.0.0", \
     "--port", "7860", \
     "--workers", "1", \
     "--log-level", "info"]