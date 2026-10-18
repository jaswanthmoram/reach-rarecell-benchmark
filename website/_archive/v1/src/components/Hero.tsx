import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Layers,
  Terminal,
  TrendingDown,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { GLOBAL_STATS } from '../data/benchmarkData';

export const Hero: React.FC = () => {
  const [visualMode, setVisualMode] = useState<'interactive' | 'fig1' | 'fig4'>('interactive');

  return (
    <section
      id="overview"
      className="relative overflow-hidden border-b border-[#E4E4E7] bg-[#FAFAFA] bg-architectural-grid pt-8 pb-12 lg:pt-10 lg:pb-14"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        {/* Main Hero Split Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Left Column: Clean Editorial Scientific Typography */}
          <div className="xl:col-span-7 space-y-5">
            {/* Publication Provenance Pill */}
            <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-white border border-[#E4E4E7] px-3 py-1 text-xs font-medium text-[#18181B] shadow-2xs">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#2563EB]">
                {GLOBAL_STATS.journalCitation}
              </span>
              <span className="text-[#D4D4D8]">•</span>
              <span className="text-[#52525B]">SRM University-AP</span>
              <span className="text-[#D4D4D8]">•</span>
              <a
                href={`https://doi.org/${GLOBAL_STATS.zenodoConceptDoi}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#059669] hover:underline"
              >
                Zenodo {GLOBAL_STATS.zenodoConceptDoi}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <h1
              className="font-display font-extrabold tracking-[-0.03em] text-[#0B0B0B] leading-[1.08]"
              style={{ fontSize: 'clamp(2rem, 3.4vw, 3.1rem)', textWrap: 'balance' }}
            >
              Benchmarking Rare Malignant Cell Detection in Single-Cell RNA-Seq
            </h1>

            <p className="text-[15px] sm:text-base text-[#3F3F46] leading-[1.6] max-w-[64ch]">
              <strong className="font-semibold text-[#0B0B0B]">REACH</strong> evaluates{' '}
              <strong className="font-semibold text-[#0B0B0B]">10 computational methods</strong> (auditing 17 published tools) across{' '}
              <strong className="font-semibold text-[#0B0B0B]">10 human oncology datasets (359,739 cells)</strong> and{' '}
              <strong className="font-semibold text-[#0B0B0B]">6 complementary tracks (1,125 units/method; 11,250 evaluations)</strong>, anchored by 4-arm evidence validation and independent chromosomal CNV testing across 57,811 cells.
            </p>

            {/* Primary CTA Row */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <a
                href="#leaderboard"
                className="inline-flex items-center gap-2 rounded-lg bg-[#0B0B0B] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-[#2563EB] transition-colors"
              >
                <span>Track A Leaderboard (Overall & Role Ranks)</span>
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#reproduce"
                className="inline-flex items-center gap-2 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#1D4ED8] hover:bg-[#DBEAFE] transition-colors"
              >
                <Terminal className="h-4 w-4" />
                <span>Register Method & Snapshot CLI</span>
              </a>
              <a
                href="#heatmap"
                className="inline-flex items-center gap-2 rounded-lg bg-white border border-[#D4D4D8] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#18181B] hover:border-[#0B0B0B] transition-colors"
              >
                <Layers className="h-4 w-4 text-[#2563EB]" />
                <span>8×10 Cohort Matrix</span>
              </a>
            </div>

            {/* 6-KPI Exposed-Hairline Scale Strip */}
            <div className="pt-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 rounded-xl border border-[#E4E4E7] bg-white divide-y sm:divide-y-0 sm:divide-x divide-[#E4E4E7] shadow-2xs overflow-hidden">
                {[
                  { label: 'Cohorts', value: '10', sub: '8 Solid + MM + CTC' },
                  { label: 'Single Cells', value: '359,739', sub: '10x & Smart-seq2' },
                  { label: 'Eval Tracks', value: '6 (A–F)', sub: '1,125 units/method' },
                  { label: 'Evaluations', value: '11,250', sub: '10 methods × 1,125' },
                  { label: 'Method Audit', value: '10/17', sub: '10 run · 7 excluded' },
                  { label: 'CNV Cells', value: '57,811', sub: 'AUROC = 0.782' },
                ].map((stat) => (
                  <div key={stat.label} className="px-2.5 py-2.5">
                    <div className="font-mono text-sm sm:text-base font-bold text-[#0B0B0B] tabular-nums tracking-tight whitespace-nowrap">
                      {stat.value}
                    </div>
                    <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[#2563EB] whitespace-nowrap">
                      {stat.label}
                    </div>
                    <div className="text-[10px] text-[#71717A] truncate">{stat.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Clean Vector Telemetry & Manuscript Figure Switcher */}
          <div className="xl:col-span-5">
            <div className="rounded-xl bg-white border border-[#E4E4E7] p-4 shadow-xs">
              {/* Mode Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#E4E4E7]">
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#0B0B0B]">
                  {visualMode === 'interactive'
                    ? 'Track A Hierarchy (Overall #1–#10 & Role Ranks)'
                    : visualMode === 'fig1'
                    ? 'Figure 1: REACH Study Design (300 DPI Proof)'
                    : 'Figure 4: Track A AP & Bootstrap Rank CIs'}
                </span>
                <div className="flex items-center gap-1 rounded-lg bg-[#F4F4F5] p-0.5 border border-[#E4E4E7]">
                  {[
                    { id: 'interactive', label: 'Rank Hierarchy' },
                    { id: 'fig1', label: 'Figure 1' },
                    { id: 'fig4', label: 'Figure 4' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setVisualMode(tab.id as 'interactive' | 'fig1' | 'fig4')}
                      className={`rounded-md px-2.5 py-1 text-[10px] font-mono font-semibold uppercase transition-colors ${
                        visualMode === tab.id
                          ? 'bg-[#0B0B0B] text-white'
                          : 'text-[#52525B] hover:text-[#0B0B0B]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual Content Area */}
              {visualMode === 'interactive' ? (
                <div className="space-y-2.5">
                  <div className="text-xs text-[#52525B] flex items-center justify-between">
                    <span>Track A Primary Evaluation (160 Units; 140 Common Units)</span>
                    <span className="font-mono text-[10px] text-[#059669] font-semibold">
                      Friedman p = 8.0e-144
                    </span>
                  </div>

                  {/* Crisp Code-Native Bar Hierarchy for Top 6 Overall Methods */}
                  <div className="space-y-1.5">
                    {[
                      {
                        overall: '#1',
                        role: 'Ceiling',
                        name: 'hvg_logreg',
                        ap: 1.000,
                        note: 'Mean 0.909 · 5-fold CV ceiling [CI: 1–1]',
                        color: '#059669',
                        bg: '#ECFDF5',
                      },
                      {
                        overall: '#2',
                        role: 'Exploratory',
                        name: 'CaSee',
                        ap: 0.512,
                        note: '0.606 excl. 20 degenerate units [CI: 2–2]',
                        color: '#D97706',
                        bg: '#FFFBEB',
                      },
                      {
                        overall: '#3',
                        role: '#1 Published',
                        name: 'FiRE',
                        ap: 0.313,
                        note: 'Mean 0.385 · Sketching density [CI: 3–4]',
                        color: '#2563EB',
                        bg: '#EFF6FF',
                      },
                      {
                        overall: '#4',
                        role: 'Baseline',
                        name: 'expr_threshold',
                        ap: 0.317,
                        note: '5-gene Z-score (tied w/ FiRE, BH-FDR = 0.415)',
                        color: '#52525B',
                        bg: '#F4F4F5',
                      },
                      {
                        overall: '#5',
                        role: '#3 Published',
                        name: 'scMalignantFinder',
                        ap: 0.235,
                        note: '0.290 excl-degen · Track F #1 (1.000 AP)',
                        color: '#0D9488',
                        bg: '#F0FDFA',
                      },
                      {
                        overall: '#6',
                        role: '#2 Published',
                        name: 'CellSIUS',
                        ap: 0.259,
                        note: 'Mean 0.315 · Bimodal sub-clustering [CI: 4–6]',
                        color: '#2563EB',
                        bg: '#EFF6FF',
                      },
                    ].map((row) => (
                      <div
                        key={row.name}
                        className="rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] px-3 py-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-[11px] font-bold text-[#0B0B0B] w-6">
                              {row.overall}
                            </span>
                            <span className="font-mono font-bold text-[#0B0B0B] truncate">
                              {row.name}
                            </span>
                            <span
                              className="rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold"
                              style={{ backgroundColor: row.bg, color: row.color }}
                            >
                              {row.role}
                            </span>
                          </div>
                          <span className="font-mono text-xs font-bold text-[#0B0B0B] tabular-nums">
                            {row.ap.toFixed(3)} Med AP
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-[#E4E4E7] overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.max(8, row.ap * 100)}%`,
                                backgroundColor: row.color,
                              }}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-[#71717A] shrink-0">
                            {row.note}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : visualMode === 'fig1' ? (
                <div className="rounded-lg border border-[#E4E4E7] bg-white p-2">
                  <img
                    src="/figures/proof/Figure_01_Overview.png"
                    alt="Figure 1: Overview of the REACH benchmarking framework"
                    className="w-full h-auto max-h-[340px] object-contain mx-auto"
                  />
                  <div className="mt-2 flex items-center justify-between text-[11px] text-[#52525B] px-1">
                    <span>Figure 1 (Author&apos;s Proof): 10 datasets, 4-arm gate, 6 tracks (A–F)</span>
                    <a
                      href="#figures"
                      className="font-mono text-[10px] font-semibold text-[#2563EB] hover:underline"
                    >
                      Open in Gallery →
                    </a>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-[#E4E4E7] bg-white p-2">
                  <img
                    src="/figures/Fig4_TrackA_Results.png"
                    alt="Figure 4: Track A rare-cell detection performance"
                    className="w-full h-auto max-h-[340px] object-contain mx-auto"
                  />
                  <div className="mt-2 flex items-center justify-between text-[11px] text-[#52525B] px-1">
                    <span>Figure 4: (A) AP boxplots, (B) Bootstrap 95% rank CIs, (C) T1–T4 decay</span>
                    <a
                      href="#figures"
                      className="font-mono text-[10px] font-semibold text-[#2563EB] hover:underline"
                    >
                      Open in Gallery →
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4 Concise Empirical Takeaways (Table 1 & Section 4) */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1 rounded bg-[#EFF6FF] px-2 py-0.5 font-mono text-[10px] font-bold text-[#1D4ED8]">
                <Award className="h-3 w-3" /> FINDING 01
              </span>
              <span className="font-mono text-[11px] font-bold text-[#2563EB]">BH-FDR = 0.415</span>
            </div>
            <h3 className="font-display text-sm font-bold text-[#0B0B0B] mb-1">
              5-Gene Baseline Matches #1 Published Detector
            </h3>
            <p className="text-xs text-[#52525B] leading-relaxed">
              Naive 5-gene Z-score thresholding (<code className="font-mono text-[#0B0B0B]">expr_threshold</code>, 0.317 Med AP) is statistically indistinguishable from #1 published detector <code className="font-mono text-[#2563EB]">FiRE</code> (0.313 Med / 0.385 Mean AP).
            </p>
          </div>

          <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1 rounded bg-[#FFF1F2] px-2 py-0.5 font-mono text-[10px] font-bold text-[#9F1239]">
                <TrendingDown className="h-3 w-3" /> FINDING 02
              </span>
              <span className="font-mono text-[11px] font-bold text-[#E11D48]">0.313 → 0.019</span>
            </div>
            <h3 className="font-display text-sm font-bold text-[#0B0B0B] mb-1">
              Unsupervised Detectors Collapse on Intra-Lineage Track F
            </h3>
            <p className="text-xs text-[#52525B] leading-relaxed">
              When normal background matches the tumor epithelial lineage (Track F), <code className="font-mono text-[#9F1239]">FiRE</code> drops to 0.019 AP while <code className="font-mono text-[#059669]">scMalignantFinder</code> achieves 1.000 AP.
            </p>
          </div>

          <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1 rounded bg-[#FFFBEB] px-2 py-0.5 font-mono text-[10px] font-bold text-[#92400E]">
                <AlertTriangle className="h-3 w-3" /> FINDING 03
              </span>
              <span className="font-mono text-[11px] font-bold text-[#D97706]">ρ = 0.042 (p = 0.91)</span>
            </div>
            <h3 className="font-display text-sm font-bold text-[#0B0B0B] mb-1">
              Synthetic Benchmarks Do Not Predict Patient Rankings
            </h3>
            <p className="text-xs text-[#52525B] leading-relaxed">
              Splatter synthetic simulations (Track B) show near-zero rank correlation with real patient cohorts (Track A): <code className="font-mono text-[#0B0B0B]">RareQ</code> drops from #2 on synthetic to #7 overall on patient data.
            </p>
          </div>

          <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1 rounded bg-[#ECFDF5] px-2 py-0.5 font-mono text-[10px] font-bold text-[#065F46]">
                <CheckCircle2 className="h-3 w-3" /> FINDING 04
              </span>
              <span className="font-mono text-[11px] font-bold text-[#059669]">0.512 → 0.606 AP</span>
            </div>
            <h3 className="font-display text-sm font-bold text-[#0B0B0B] mb-1">
              Degenerate-Unit Filtering & CNV Validation
            </h3>
            <p className="text-xs text-[#52525B] leading-relaxed">
              Excluding 20 zero-variance units raises <code className="font-mono text-[#0B0B0B]">CaSee</code> to 0.606 AP. Independent chromosomal CNV across 57,811 cells confirms malignancy labels (AUROC = 0.782).
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
