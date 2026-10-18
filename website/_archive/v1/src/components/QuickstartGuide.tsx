import React, { useState } from 'react';
import { ZENODO_ARCHIVES } from '../data/benchmarkData';
import {
  Terminal,
  Copy,
  Check,
  HardDrive,
  ExternalLink,
  Code2,
  PackageCheck,
  RotateCcw,
  Cpu,
  PlusCircle,
} from 'lucide-react';

export const QuickstartGuide: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'register' | 'snapshots' | 'portal' | 'dataset'
  >('register');

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const registerCliSnippet = `# 1. Copy the official method template (§3.8 Reproducible Extension Protocol)
cp src/rarecell_benchmark/methods/TEMPLATE_new_method.py \\
   src/rarecell_benchmark/methods/my_detector.py

# 2. Run unit smoke test on a single synthetic unit (~5 seconds)
pytest tests/test_methods.py -k "my_detector"

# 3. Evaluate your registered method across all 1,125 benchmark units (Tracks A-F)
rcb run-method --method my_detector --tracks A,B,C,D,E,F

# 4. Recompute Phase 11 bootstrap rankings, Wilcoxon/Cliff's delta & regenerate all 12 figures
python scripts/phase11_statistics.py --include-method my_detector
python scripts/phase12_figures.py`;

  const registerPythonSnippet = `# src/rarecell_benchmark/methods/my_detector.py
from __future__ import annotations
import anndata as ad
import numpy as np
from rarecell_benchmark.methods.base import MethodResult, register, timed_run

def _compute_scores(adata: ad.AnnData) -> np.ndarray:
    """Return 1D float64 array of length n_obs (higher = more likely rare malignant)."""
    X = adata.X.toarray() if hasattr(adata.X, "toarray") else np.asarray(adata.X)
    # Replace with your algorithm's continuous cell-level anomaly score:
    scores = np.linalg.norm(X - np.median(X, axis=0), axis=1)
    return np.asarray(scores, dtype=np.float64)

def score_my_detector(adata: ad.AnnData, **kwargs) -> MethodResult:
    scores, elapsed, peak_mb, fallback = timed_run(_compute_scores, adata)
    return MethodResult(
        scores=scores, runtime_sec=elapsed, peak_mem_mb=peak_mb,
        fallback_used=fallback, metadata={"paradigm": "custom_detector"}
    )

# Register in the global REACH method registry:
register("my_detector", score_my_detector)`;

  const snapshotResumeSnippet = `# ── A. FAST DETERMINISTIC RECONSTRUCTION FROM AUDITED SNAPSHOTS (<2 MIN) ──
# Reconstructs all 11 statistical tables & 12 300-DPI figures directly from
# pre-computed results/tables/*.csv without re-running raw AnnData inference:
python scripts/reproduce_from_snapshots.py
# Or via Makefile / Phase 11-12 flags:
make reproduce-snapshots
python scripts/phase11_statistics.py --from-snapshots
python scripts/run_all.py --from-snapshots

# ── B. CHECKPOINT RESUME FROM ANY SPECIFIC PHASE WHERE YOU LEFT OFF ──────
# Resume execution from any phase (1..12) using cached intermediate parquets:
rcb run-phase --phase 9    # Resume at Phase 09 (Method Execution)
rcb run-phase --phase 10   # Resume at Phase 10 (Metric Aggregation)
rcb run-phase --phase 11   # Resume at Phase 11 (Bootstrap & Cliff's Delta)
rcb run-phase --phase 12   # Resume at Phase 12 (300-DPI Figure Regeneration)

# ── C. DAG-CACHED INCREMENTAL RE-EXECUTION (DVC / SNAKEMAKE) ─────────────
# Automatically detects which upstream files changed and resumes only needed steps:
dvc repro
snakemake --cores 4`;

  const portalDockerSnippet = `# ── 1. INTERACTIVE BENCHMARK WEB PORTAL (NPX / VITE WORKFLOW) ────────────
cd website
npm install

# Launch live interactive development server on http://localhost:5173:
npx vite --port 5173

# Type-check & reconstruct production static bundle in website/dist/:
npx tsc -b && npx vite build

# Preview compiled production bundle locally:
npx vite preview --port 4173

# ── 2. DETERMINISTIC DOCKER CONTAINER REPRODUCTION ───────────────────────
docker build -t reach-benchmark:1.3.0 .
docker run --rm -v "$(pwd)/results:/app/results" reach-benchmark:1.3.0 \\
  python scripts/reproduce_from_snapshots.py`;

  const datasetTrackSnippet = `# ── 1. REGISTER A NEW COHORT (.h5ad) IN configs/datasets.yaml (§3.8) ─────
# Place your raw count matrix in data/raw/<cohort_id>.h5ad with obs['cell_type'],
# then run Phase 02 QC + Phase 03 4-Arm Silver-Standard Tiering (P_HC / B_HC):
rcb prepare-dataset --dataset my_new_cohort --config configs/datasets.yaml
rcb run-phase --phase 3 --dataset my_new_cohort

# ── 2. SYNTHESIZE BENCHMARK UNITS ACROSS TRACKS A, C, D, E, F ────────────
rcb build-units --dataset my_new_cohort --tracks A,C,E,F --seeds 42,43,44,45,46

# ── 3. BENCHMARK ALL 10 REGISTERED METHODS ON THE NEW COHORT ─────────────
rcb run-all --dataset my_new_cohort --output results/tables/`;

  return (
    <section id="reproduce" className="py-16 bg-[#FFFFFF] border-b border-[#E4E4E7]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAFAFA] border border-[#E4E4E7] text-[#52525B] text-[11px] font-mono font-semibold mb-3 shadow-2xs">
              <span className="text-[#2563EB] font-bold">08</span>
              <span className="text-[#D4D4D8]">//</span>
              <span>METHOD REGISTRATION (§3.8), SNAPSHOT RESUME & NPX PORTAL CLI</span>
              <span className="text-[#D4D4D8]">•</span>
              <Terminal className="w-3.5 h-3.5 text-[#059669]" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B0B0B] tracking-tight">
              Register New Methods, Resume From Checkpoints & Reconstruct From Snapshots
            </h2>
            <p className="mt-2 text-[#3F3F46] max-w-3xl text-sm leading-relaxed">
              Plug in a new rare-cell detector in 3 steps (`TEMPLATE_new_method.py`), reconstruct all 12 figures & 11 tables in under 2 minutes from audited CSV snapshots (`--from-snapshots`), or resume from any pipeline phase (`rcb run-phase --phase N` / `dvc repro`).
            </p>
          </div>

          {/* 4-Tab Workflow Switcher */}
          <div className="flex flex-wrap gap-1.5 bg-[#F4F4F5] p-1 rounded-xl border border-[#E4E4E7] self-start">
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'register'
                  ? 'bg-[#0B0B0B] text-white shadow-2xs'
                  : 'text-[#3F3F46] hover:text-[#0B0B0B]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              1. Register New Method (§3.8)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('snapshots')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'snapshots'
                  ? 'bg-[#059669] text-white shadow-2xs'
                  : 'text-[#3F3F46] hover:text-[#0B0B0B]'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              2. Resume & Snapshot Reconstruct
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('portal')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'portal'
                  ? 'bg-[#2563EB] text-white shadow-2xs'
                  : 'text-[#3F3F46] hover:text-[#0B0B0B]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              3. Web Portal (npx) & Docker
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dataset')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'dataset'
                  ? 'bg-[#0B0B0B] text-white shadow-2xs'
                  : 'text-[#3F3F46] hover:text-[#0B0B0B]'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              4. Add Cohort / Track
            </button>
          </div>
        </div>

        {/* Tab 1: Register New Method (§3.8 Protocol) */}
        {activeTab === 'register' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
            {/* Left: Python Adapter Template */}
            <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#E4E4E7] rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs">
              <div className="px-5 py-3 bg-[#F4F4F5] border-b border-[#E4E4E7] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-[#2563EB]" />
                  <span className="text-xs font-mono font-bold text-[#0B0B0B]">
                    Step 1–2: TEMPLATE_new_method.py (_compute_scores + register)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('reg-py', registerPythonSnippet)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FFFFFF] border border-[#E4E4E7] hover:bg-[#0B0B0B] hover:text-white text-xs font-mono font-semibold text-[#0B0B0B] transition-colors"
                >
                  {copiedId === 'reg-py' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#059669]" />
                      <span className="text-[#059669]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Template</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-[#1D4ED8] overflow-x-auto leading-relaxed bg-[#FAFAFA] flex-1">
                <code>{registerPythonSnippet}</code>
              </pre>
              <div className="px-5 py-2.5 bg-[#F4F4F5]/70 border-t border-[#E4E4E7] text-[11px] text-[#52525B]">
                Contract: Accepts <code>ad.AnnData</code> (cells × genes) and returns a 1D <code>float64</code> score vector of length <code>n_obs</code>.
              </div>
            </div>

            {/* Right: CLI Registration & Evaluation */}
            <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#E4E4E7] rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs">
              <div className="px-5 py-3 bg-[#F4F4F5] border-b border-[#E4E4E7] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#059669]" />
                  <span className="text-xs font-mono font-bold text-[#0B0B0B]">
                    Step 3: Smoke Test, Run 1,125 Units & Update Leaderboard
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('reg-cli', registerCliSnippet)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FFFFFF] border border-[#E4E4E7] hover:bg-[#0B0B0B] hover:text-white text-xs font-mono font-semibold text-[#0B0B0B] transition-colors"
                >
                  {copiedId === 'reg-cli' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#059669]" />
                      <span className="text-[#059669]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy CLI</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-[#0B0B0B] overflow-x-auto leading-relaxed bg-[#FAFAFA] flex-1">
                <code>{registerCliSnippet}</code>
              </pre>
              <div className="px-5 py-2.5 bg-[#F4F4F5]/70 border-t border-[#E4E4E7] flex items-center justify-between text-[11px] text-[#52525B]">
                <span>Automatically logs fallback events, degenerate scores, runtime & peak RAM</span>
                <span className="font-mono font-bold text-[#065F46]">§3.8 Protocol</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Snapshot Reconstruction & Checkpoint Resume */}
        {activeTab === 'snapshots' && (
          <div className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-2xl overflow-hidden shadow-xs mb-12">
            <div className="px-5 py-3.5 bg-[#ECFDF5] border-b border-[#A7F3D0] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#059669]" />
                <span className="text-xs font-mono font-bold text-[#065F46]">
                  Deterministic Snapshot Reconstruction (--from-snapshots) & Phase Checkpoint Resume (rcb run-phase / dvc repro)
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('snap-cli', snapshotResumeSnippet)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#FFFFFF] border border-[#A7F3D0] hover:bg-[#065F46] hover:text-white text-xs font-mono font-semibold text-[#065F46] transition-colors"
              >
                {copiedId === 'snap-cli' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied Commands</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Resume Commands</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-5 text-xs font-mono text-[#0B0B0B] overflow-x-auto leading-relaxed bg-[#FAFAFA]">
              <code>{snapshotResumeSnippet}</code>
            </pre>
            <div className="px-5 py-3 bg-[#F4F4F5]/70 border-t border-[#E4E4E7] grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono text-[#52525B]">
              <div>
                <strong className="text-[#0B0B0B]">Snapshot Mode:</strong> Rebuilds 12 figures & 11 tables in &lt;2 min without raw `.h5ad` files.
              </div>
              <div>
                <strong className="text-[#0B0B0B]">Phase Resume:</strong> <code>rcb run-phase --phase N</code> resumes from exact phase checkpoint.
              </div>
              <div>
                <strong className="text-[#0B0B0B]">DAG Cache:</strong> <code>dvc repro</code> & <code>snakemake</code> skip completed upstream stages.
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Web Portal (npx vite) & Docker CLI */}
        {activeTab === 'portal' && (
          <div className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-2xl overflow-hidden shadow-xs mb-12">
            <div className="px-5 py-3.5 bg-[#EFF6FF] border-b border-[#BFDBFE] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#2563EB]" />
                <span className="text-xs font-mono font-bold text-[#1D4ED8]">
                  Interactive Benchmark Web Portal (npx vite) & Containerized Reproduction
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('portal-cli', portalDockerSnippet)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#FFFFFF] border border-[#BFDBFE] hover:bg-[#1D4ED8] hover:text-white text-xs font-mono font-semibold text-[#1D4ED8] transition-colors"
              >
                {copiedId === 'portal-cli' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied Commands</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy npx & Docker CLI</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-5 text-xs font-mono text-[#0B0B0B] overflow-x-auto leading-relaxed bg-[#FAFAFA]">
              <code>{portalDockerSnippet}</code>
            </pre>
          </div>
        )}

        {/* Tab 4: Add Cohort or Evaluation Track */}
        {activeTab === 'dataset' && (
          <div className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-2xl overflow-hidden shadow-xs mb-12">
            <div className="px-5 py-3.5 bg-[#F4F4F5] border-b border-[#E4E4E7] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-[#0B0B0B]" />
                <span className="text-xs font-mono font-bold text-[#0B0B0B]">
                  Add a New Single-Cell Oncology Cohort (.h5ad) or Perturbation Track (§3.8)
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('ds-cli', datasetTrackSnippet)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#FFFFFF] border border-[#E4E4E7] hover:bg-[#0B0B0B] hover:text-white text-xs font-mono font-semibold text-[#0B0B0B] transition-colors"
              >
                {copiedId === 'ds-cli' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#059669]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Commands</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-5 text-xs font-mono text-[#0B0B0B] overflow-x-auto leading-relaxed bg-[#FAFAFA]">
              <code>{datasetTrackSnippet}</code>
            </pre>
          </div>
        )}

        {/* 5-Part Zenodo Archival Data Hub */}
        <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h3 className="font-display text-lg font-bold text-[#0B0B0B] flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-[#059669]" />
                5-Part Zenodo Permanent Archival Deposit Suite (Data Availability Statement, p. 22)
              </h3>
              <p className="text-xs text-[#3F3F46] mt-0.5">
                Direct DOI links to all source code, pre-computed evaluation tables (`19847108`), and harmonized `.h5ad` single-cell cohorts (`19850652`–`19851710`).
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-mono font-bold self-start">
              <PackageCheck className="w-4 h-4 text-[#059669]" />
              5 Verified Zenodo DOIs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {ZENODO_ARCHIVES.map((item) => (
              <a
                key={item.doi}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-4 rounded-xl bg-[#FFFFFF] border border-[#E4E4E7] hover:border-[#2563EB] transition-all flex flex-col justify-between hover:-translate-y-0.5 shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] font-mono text-[10px] font-bold border border-[#BFDBFE]">
                      {item.part}
                    </span>
                    <span className="text-[10px] font-mono tabular-nums text-[#52525B] font-semibold">
                      {item.sizeEstimate}
                    </span>
                  </div>
                  <h4 className="font-display text-xs sm:text-sm font-bold text-[#0B0B0B] group-hover:text-[#2563EB] transition-colors leading-snug mb-1.5">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-[#3F3F46] leading-relaxed mb-3">
                    {item.contents}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-[#E4E4E7] flex items-center justify-between text-[11px] font-mono font-semibold text-[#065F46] group-hover:text-[#2563EB]">
                  <span className="truncate">{item.doi}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-1" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
