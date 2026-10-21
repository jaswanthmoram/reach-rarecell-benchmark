FROM python:3.11-slim

WORKDIR /app

# Install system deps including R + headers for R package compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    build-essential \
    r-base \
    r-base-dev \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev \
    libfontconfig1-dev \
    libharfbuzz-dev \
    libfribidi-dev \
    libfreetype6-dev \
    libpng-dev \
    libtiff5-dev \
    libjpeg-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python package
COPY . .
RUN pip install --no-cache-dir '.[dev]'

# Install R packages for FiRE, CellSIUS, RareQ
RUN Rscript /app/setup/install_r_packages.R

LABEL org.opencontainers.image.source=https://github.com/jaswanthmoram/reach-rarecell-benchmark
LABEL org.opencontainers.image.description="REACH Benchmark container with R-based methods (FiRE, CellSIUS, RareQ)"
LABEL org.opencontainers.image.licenses=MIT
LABEL org.opencontainers.image.version=1.2.0

CMD ["rcb", "--help"]