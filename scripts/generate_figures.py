#!/usr/bin/env python3
"""Convenience wrapper around rarecellbenchmark.figures."""
import argparse
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="Generate benchmark figures")
    parser.add_argument("--all", action="store_true", help="Generate all figures")
    parser.add_argument("--leaderboard", action="store_true", help="Generate leaderboard figure")
    parser.add_argument("--runtime", action="store_true", help="Generate runtime figure")
    parser.add_argument("--pipeline", action="store_true", help="Generate pipeline schematic (Fig 8)")
    parser.add_argument("--track-design", action="store_true", help="Generate track design schematic (Fig 9)")
    parser.add_argument("--method-audit", action="store_true", help="Generate method QC audit (Fig 10)")
    parser.add_argument("--output-dir", type=Path, required=True, help="Output directory")
    args = parser.parse_args()

    try:
        from rarecellbenchmark import figures
    except ImportError:
        print("Warning: rarecellbenchmark package not installed. Using stub figure generator.")
        figures = None

    args.output_dir.mkdir(parents=True, exist_ok=True)

    # Schematic figures (self-contained, no data needed)
    if args.all or args.pipeline:
        if figures is not None:
            out = args.output_dir / "Fig8_REACH_Pipeline_Overview.pdf"
            figures.plot_pipeline(out)
            print(f"Pipeline schematic saved: {out}")
        else:
            print("Stub: pipeline schematic")

    if args.all or args.track_design:
        if figures is not None:
            out = args.output_dir / "Fig9_Track_Design.pdf"
            figures.plot_track_design(out)
            print(f"Track design saved: {out}")
        else:
            print("Stub: track design")

    if args.all or args.method_audit:
        if figures is not None:
            out = args.output_dir / "Fig10_Method_QC_Audit.pdf"
            figures.plot_method_audit(out)
            print(f"Method audit saved: {out}")
        else:
            print("Stub: method audit")

    # Data-driven figures (require evaluation results)
    data_figs = []
    if args.all or args.leaderboard:
        data_figs.append("leaderboard")
    if args.all or args.runtime:
        data_figs.append("runtime")

    if data_figs:
        print(f"Data-driven figures requested: {data_figs}")
        print("Note: These require evaluation results in data/results/.")
        if figures is not None and hasattr(figures, "generate"):
            figures.generate(data_figs, output_dir=args.output_dir)
        else:
            for fig in data_figs:
                out = args.output_dir / f"{fig}.png"
                out.write_text("stub image data")
                print(f"Stub figure written to {out}")

    if not any([args.all, args.leaderboard, args.runtime, args.pipeline, args.track_design, args.method_audit]):
        print("No figures requested. Use --all, --leaderboard, --runtime, --pipeline, --track-design, or --method-audit.")
        return

    print("Figure generation complete.")


if __name__ == "__main__":
    main()
