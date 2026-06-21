#!/usr/bin/env bash
set -euo pipefail
mkdir -p External-Methods && cd External-Methods

# 1. scCAD (verified URL: github.com/xuyp-csu/scCAD — Xu et al. 2024, Nat Commun)
mkdir -p scCAD
[ -d "scCAD/scCAD-1.0.0" ] || git clone --depth 1 https://github.com/xuyp-csu/scCAD.git scCAD/scCAD-1.0.0
# Create scCAD_patched.py from scCAD.py (wrapper imports scCAD_patched, not scCAD)
if [ -f "scCAD/scCAD-1.0.0/scCAD.py" ] && [ ! -f "scCAD/scCAD-1.0.0/scCAD_patched.py" ]; then
  cp scCAD/scCAD-1.0.0/scCAD.py scCAD/scCAD-1.0.0/scCAD_patched.py
  echo "NOTE: Created scCAD_patched.py as copy of scCAD.py."
fi

# 2. DeepScena
mkdir -p DeepScena
[ -d "DeepScena/DeepScena-1.0.1" ] || git clone --depth 1 https://github.com/shaoqiangzhang/DeepScena.git DeepScena/DeepScena-1.0.1

# 3. scMalignantFinder (and download its Zenodo model reference)
mkdir -p scMalignantFinder
[ -d "scMalignantFinder/scMalignantFinder-main" ] || git clone --depth 1 https://github.com/Jonyyqn/scMalignantFinder.git scMalignantFinder/scMalignantFinder-main
mkdir -p scMalignantFinder/scMalignantFinder-main/pretrained_model
cd scMalignantFinder/scMalignantFinder-main/pretrained_model
[ -f "model.joblib" ] || wget -O model.joblib "https://zenodo.org/records/17888140/files/model.joblib?download=1"
[ -f "ordered_feature.tsv" ] || wget -O ordered_feature.tsv "https://zenodo.org/records/17888140/files/ordered_feature.tsv?download=1"
cd ../../..

# 4. CaSee
[ -d "CaSee-main" ] || git clone --depth 1 https://github.com/yuansh3354/CaSee.git CaSee-main

echo "Cloned external methods. Pre-installing R packages if R is available..."
if command -v Rscript &> /dev/null; then
  Rscript -e 'if (!requireNamespace("devtools", quietly=TRUE)) install.packages("devtools", repos="https://cloud.r-project.org")'
  Rscript -e 'if (!requireNamespace("FiRE", quietly=TRUE)) install.packages("FiRE", repos="https://cloud.r-project.org")'
  Rscript -e 'if (!requireNamespace("CellSIUS", quietly=TRUE)) devtools::install_github("Novartis/CellSIUS")'
  Rscript -e 'if (!requireNamespace("RareQ", quietly=TRUE)) devtools::install_github("fabotao/RareQ")'
fi
