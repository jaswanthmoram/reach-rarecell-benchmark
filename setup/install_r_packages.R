#!/usr/bin/env Rscript

# REACH Benchmark -- R package installation script
# Installs R dependencies for FiRE, CellSIUS, RareQ

if (!requireNamespace("remotes", quietly = TRUE)) {
    install.packages("remotes", repos = "http://cran.r-project.org")
}

cran_packages <- c("FiRE", "Seurat", "Matrix", "dplyr", "readr")
for (pkg in cran_packages) {
    if (!requireNamespace(pkg, quietly = TRUE)) {
        tryCatch(
            install.packages(pkg, repos = "http://cran.r-project.org"),
            error = function(e) message(sprintf("Failed to install %s: %s", pkg, e$message))
        )
    }
}

github_packages <- list(
    c("Novartis", "CellSIUS"),
    c("fabotao", "RareQ")
)

for (repo in github_packages) {
    pkg_name <- repo[2]
    if (!requireNamespace(pkg_name, quietly = TRUE)) {
        tryCatch(
            remotes::install_github(paste(repo, collapse = "/")),
            error = function(e) message(sprintf("Failed to install %s: %s", pkg_name, e$message))
        )
    }
}

cat("\nR package installation complete.\n")
cat("Installed packages:\n")
for (pkg in c("FiRE", "Seurat", "CellSIUS", "RareQ")) {
    status <- if (requireNamespace(pkg, quietly = TRUE)) "OK" else "MISSING"
    cat(sprintf("  %s: %s\n", pkg, status))
}
