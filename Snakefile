# Snakemake workflow for the public REACH checkout.
#
# Default targets are the lightweight snapshot-derived outputs tracked in Git.
# Full raw/processed/prediction archives are external release assets; use the
# explicit full_data_* rules only after restoring those archives.

SNAPSHOT_DIR = "data/results/snapshots/paper_v1"
PHASE11_DIR = "data/results/tables/phase11"
PHASE12_DIR = "data/results/figures/phase12"

SNAPSHOTS = [
    "data/results/snapshots/paper_v1/results_per_unit.csv",
    "data/results/snapshots/paper_v1/results_per_method.csv",
    "data/results/snapshots/paper_v1/results_per_dataset.csv",
    "data/results/snapshots/paper_v1/degenerate_predictions_report.csv",
]

PHASE11_TABLES = [
    f"{PHASE11_DIR}/leaderboard.csv",
    f"{PHASE11_DIR}/rank_ci.csv",
    f"{PHASE11_DIR}/global_tests.csv",
    f"{PHASE11_DIR}/pairwise_tests.csv",
    f"{PHASE11_DIR}/per_dataset_summary.csv",
    f"{PHASE11_DIR}/unit_metrics_sample.csv",
]

PHASE12_FIGURES = [
    f"{PHASE12_DIR}/Fig0_Phase11_Summary_Heatmap.png",
    f"{PHASE12_DIR}/Fig1_Leaderboard.png",
    f"{PHASE12_DIR}/Fig2_Sensitivity_Robustness.png",
    f"{PHASE12_DIR}/Fig3_Critical_Difference.png",
    f"{PHASE12_DIR}/Fig4_AP_Prevalence.png",
    f"{PHASE12_DIR}/Fig5_TrackC_Null_Calibration.png",
    f"{PHASE12_DIR}/Fig6_Runtime_Scalability_Pareto.png",
    f"{PHASE12_DIR}/Fig7_Rank_Bootstrap_Forest.png",
]


rule all:
    input:
        SNAPSHOTS,
        PHASE11_TABLES,
        PHASE12_FIGURES,


rule public_phase11:
    input:
        SNAPSHOTS,
    output:
        PHASE11_TABLES,
    params:
        output_dir=PHASE11_DIR,
    shell:
        "python scripts/phase11_statistics.py --from-snapshots --output-dir {params.output_dir}"


rule public_phase12:
    input:
        SNAPSHOTS,
        f"{PHASE11_DIR}/leaderboard.csv",
    output:
        PHASE12_FIGURES,
    shell:
        "python scripts/reproduce_from_snapshots.py"


rule toy_data:
    output:
        "data/toy/toy_expression.h5ad",
        "data/toy/toy_labels.parquet",
        "data/toy/toy_manifest.json",
    shell:
        "python scripts/create_toy_data.py --out-dir data/toy"


rule toy_smoke:
    input:
        "data/toy/toy_expression.h5ad",
        "data/toy/toy_labels.parquet",
        "data/toy/toy_manifest.json",
    output:
        touch("data/results/toy_smoke.ok"),
    shell:
        "rcb smoke-test && touch {output}"


rule full_data_phase11:
    input:
        "data/predictions/.gitkeep",
        "data/tracks/.gitkeep",
    output:
        touch("data/results/full_data_phase11.requires_archives"),
    shell:
        "python scripts/run_phase.py --phase 11"
