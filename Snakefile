# Snakefile - REACH workflow outline
# =============================================================================
# This file defines a Snakemake workflow for the REACH pipeline.
# Full execution requires processed data and method dependencies.
# =============================================================================

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
configfile: "configs/datasets.yaml"

DATASETS = config.get("datasets", [])
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
        "data/results/figures/phase11/Fig1_Leaderboard.pdf",
        "data/results/figures/phase11/Fig2_Sensitivity_Robustness.pdf",
        "data/results/figures/phase11/Fig3_Critical_Difference.pdf",
        "data/results/report.md",

# -----------------------------------------------------------------------------
# Preprocess all datasets
# -----------------------------------------------------------------------------
rule preprocess:
    output:
        h5ad="data/processed/{dataset_id}.h5ad",
        qc="data/interim/{dataset_id}_qc_report.json",
    params:
        dataset="{dataset_id}",
    shell:
        "python src/preprocess/preprocess_dataset.py --dataset {params.dataset} "
        "--out-h5ad {output.h5ad} --out-qc {output.qc}"

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
        "python src/validate/phase3_runner.py --input {input} "
        "--out-tiers {output.tiers} --out-report {output.report}"

# -----------------------------------------------------------------------------
# Generate all tracks
# -----------------------------------------------------------------------------
rule tracks:
    input:
        expand("data/validation/{dataset_id}_tier_assignments.parquet", dataset_id=DATASETS),
    output:
        expand("data/tracks/a/{dataset_id}/t1/{dataset_id}_a_t1_001_manifest.json", dataset_id=DATASETS),
    shell:
        "python run_all.py --phase tracks"

# -----------------------------------------------------------------------------
# Execute a single method on a single unit
# -----------------------------------------------------------------------------
rule execute:
    input:
        expr="data/tracks/{track}/{dataset_id}/{tier}/{unit_id}_expression.h5ad",
    output:
        pred="results/{method_id}/{unit_id}/predictions.csv",
        meta="results/{method_id}/{unit_id}/runmeta.json",
    params:
        method="{method_id}",
    shell:
        "python src/methods/{params.method}/{params.method}_wrapper.py "
        "--input {input.expr} --out-dir results/{params.method}/{wildcards.unit_id}"

# -----------------------------------------------------------------------------
# Evaluate all methods across all units
# -----------------------------------------------------------------------------
rule evaluate:
    input:
        predictions=expand("results/{method_id}/{dataset_id}_{track}_{tier}_{rep}/predictions.csv",
                           method_id=METHODS, dataset_id=DATASETS,
                           track=TRACKS, tier=["t1","t2","t3","t4"], rep=["001"]),
        labels=expand("data/tracks/{track}/{dataset_id}/{tier}/{dataset_id}_{track}_{tier}_{rep}_labels.parquet",
                      dataset_id=DATASETS, track=TRACKS, tier=["t1","t2","t3","t4"], rep=["001"]),
    output:
        metrics="data/results/all_metrics.parquet",
        leaderboard="data/results/leaderboard.csv",
        leaderboard_faithful="data/results/leaderboard_faithful.csv",
    shell:
        "python src/evaluate/evaluate.py --predictions results/ "
        "--tracks data/tracks/ --out-metrics {output.metrics} "
        "--out-leaderboard {output.leaderboard} "
        "--out-leaderboard-faithful {output.leaderboard_faithful}"

# -----------------------------------------------------------------------------
# Generate all figures
# -----------------------------------------------------------------------------
rule figures:
    input:
        "data/results/all_metrics.parquet",
    output:
        expand("data/results/figures/phase11/{fig}",
               fig=["Fig0_Phase11_Summary_Heatmap.pdf",
                    "Fig1_Leaderboard.pdf",
                    "Fig2_Sensitivity_Robustness.pdf",
                    "Fig3_Critical_Difference.pdf",
                    "Fig4_AP_nAP_Prevalence.pdf",
                    "Fig5_TrackC_Null_Calibration.pdf",
                    "Fig6_Runtime_Scalability_Pareto.pdf",
                    "Fig7_Rank_Bootstrap_Forest.pdf"]),
    shell:
        "python src/figures/generate_figures.py --metrics {input} --out-dir data/results/figures/phase11/"

# -----------------------------------------------------------------------------
# Build markdown report
# -----------------------------------------------------------------------------
rule report:
    input:
        expand("data/results/figures/phase11/{fig}",
               fig=["Fig0_Phase11_Summary_Heatmap.pdf",
                    "Fig1_Leaderboard.pdf",
                    "Fig2_Sensitivity_Robustness.pdf",
                    "Fig3_Critical_Difference.pdf",
                    "Fig4_AP_nAP_Prevalence.pdf",
                    "Fig5_TrackC_Null_Calibration.pdf",
                    "Fig6_Runtime_Scalability_Pareto.pdf",
                    "Fig7_Rank_Bootstrap_Forest.pdf"]),
        "data/results/leaderboard.csv",
        "data/results/all_metrics.parquet",
    output:
        "data/results/report.md",
    shell:
        "python src/figures/build_report.py --figures data/results/figures/phase11/ "
        "--leaderboard data/results/leaderboard.csv --out {output}"
