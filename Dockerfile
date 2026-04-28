FROM python:3.11-slim

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy source and install
COPY . .
RUN pip install --no-cache-dir '.[dev]'

LABEL org.opencontainers.image.source=https://github.com/jaswanthmoram/reach-rarecell-benchmark
LABEL org.opencontainers.image.description="REACH Benchmark container"
LABEL org.opencontainers.image.licenses=MIT

# Default command
CMD ["rcb", "--help"]
