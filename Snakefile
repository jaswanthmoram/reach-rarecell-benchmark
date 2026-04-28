# Snakefile - REACH workflow outline
# =============================================================================
# This file defines a Snakemake workflow for the REACH pipeline.
# Full execution requires processed data and method dependencies
# (download from Zenodo: https://doi.org/10.5281/zenodo.19850652).
#
# Usage:
#   snakemake --cores 4         # run full pipeline
#   snakemake --cores 1 preprocess  # run one rule
# =============================================================================

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
configfile: "configs/datasets.yaml"

DATASETS = [d["dataset_id"] for d in config.get("datasets", []) if d.get("enabled")]
TRACKS = ["a", "b", "c", "d", "e"]
METHODS = ["random_baseline", "expr_threshold", "hvg_logreg",
           "FiRE", "DeepScena", "RareQ", "cellsius", "scCAD",
           "scMalignantFinder", "CaSee"]

# -----------------------------------------------------------------------------
# Wildcard constraints
# -----------------------------------------------------------------------------
wildcard_constraints:
    dataset_id="[a-z_]+",
    track="[a-e]",
    method_id="[a-zA-Z0-9_]+",

# -----------------------------------------------------------------------------
# Top-level target
# -----------------------------------------------------------------------------
rule all:
    input:
        "data/results/figures/phase12/Fig1_Leaderboard.png",
        "data/results/figures/phase12/Fig2_Sensitivity_Robustness.png",
        "data/results/figures/phase12/Fig3_Critical_Difference.png",
        "data/results/tables/phase11/leaderboard.csv",
        "data/results/report.md",

# -----------------------------------------------------------------------------
# Preprocess (Phase 2)
# -----------------------------------------------------------------------------
rule preprocess:
    output:
        h5ad="data/processed/{dataset_id}.h5ad",
        qc="data/interim/{dataset_id}_qc_report.json",
    params:
        dataset="{dataset_id}",
    shell:
        "python scripts/run_phase.py --phase 2 --dataset {params.dataset}"

# -----------------------------------------------------------------------------
# Validation (Phase 3)
# -----------------------------------------------------------------------------
rule validate:
    input:
        "data/processed/{dataset_id}.h5ad",
    output:
        tiers="data/validation/{dataset_id}_tier_assignments.parquet",
        report="data/validation/{dataset_id}_validation_report.json",
    shell:
        "python scripts/run_phase.py --phase 3 --dataset {wildcards.dataset_id}"

# -----------------------------------------------------------------------------
# Generate all tracks (Phases 4-8)
# -----------------------------------------------------------------------------
rule tracks:
    input:
        "data/validation/{dataset_id}_tier_assignments.parquet",
        "data/processed/{dataset_id}.h5ad",
    output:
        touch("data/tracks/{dataset_id}_complete.flag"),
    shell:
        "rcb run-track --track {wildcards.track} --dataset {wildcards.dataset_id} "

# -----------------------------------------------------------------------------
# Execute a single method on a single unit (Phase 9-10)
# -----------------------------------------------------------------------------
rule execute:
    input:
        expr="data/tracks/{track}/{dataset_id}/tier/{unit_id}_expression.h5ad",
    output:
        pred="data/predictions/{method_id}/{unit_id}_predictions.csv",
        meta="data/predictions/{method_id}/{unit_id}_runmeta.json",
    shell:
        "rcb run-method --method {wildcards.method_id} "
        "--unit-id {wildcards.unit_id} --input {input.expr} "
        "--output-dir data/predictions/{wildcards.method_id}"

# -----------------------------------------------------------------------------
# Evaluate all predictions (Phase 11)
# -----------------------------------------------------------------------------
rule evaluate:
    input:
        expand("data/predictions/{method_id}",
               method_id=METHODS),
        expand("data/tracks/{track}",
               track=TRACKS),
    output:
        metrics="data/results/all_metrics.parquet",
        leaderboard="data/results/tables/phase11/leaderboard.csv",
    shell:
        "python scripts/evaluate_results.py --track all "
        "--predictions-dir data/predictions/ "
        "--output-dir data/results/tables/phase11/"

# -----------------------------------------------------------------------------
# Generate all figures (Phase 12)
# -----------------------------------------------------------------------------
rule figures:
    input:
        "data/results/tables/phase11/leaderboard.csv",
        "data/results/all_metrics.parquet",
    output:
        expand("data/results/figures/phase12/{fig}",
               fig=["Fig0_Phase11_Summary_Heatmap.png",
                    "Fig1_Leaderboard.png",
                    "Fig2_Sensitivity_Robustness.png",
                    "Fig3_Critical_Difference.png",
                    "Fig4_AP_Prevalence.png",
                    "Fig5_TrackC_Null_Calibration.png",
                    "Fig6_Runtime_Scalability_Pareto.png",
                    "Fig7_Rank_Bootstrap_Forest.png"]),
    shell:
        "python scripts/reproduce_from_snapshots.py"

# -----------------------------------------------------------------------------
# Build markdown report
# -----------------------------------------------------------------------------
rule report:
    input:
        "data/results/tables/phase11/leaderboard.csv",
        "data/results/figures/phase12/Fig1_Leaderboard.png",
        "data/results/figures/phase12/Fig3_Critical_Difference.png",
        "data/results/all_metrics.parquet",
    output:
        "data/results/report.md",
    shell:
        "python scripts/generate_figures.py --leaderboard "
        "--output-dir data/results/figures/ && "
        "echo '# REACH Benchmark Report' > {output} && "
        "echo && date >> {output} && "
        "echo 'Leaderboard: data/results/tables/phase11/leaderboard.csv' >> {output}"
