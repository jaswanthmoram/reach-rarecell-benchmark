# R Environment Setup

Some method wrappers in REACH require R (>= 4.3) and specific Bioconductor packages.

## Requirements

- R >= 4.3
- Bioconductor packages as needed by individual method wrappers

## Creating renv.lock

Users should create their own `renv.lock` from their local R environment after installing the necessary Bioconductor packages:

```r
# In R
install.packages("renv")
renv::init()
# Install required Bioconductor packages
renv::snapshot()
```

This will generate a `renv.lock` file that captures the exact versions of R packages used in your environment.
