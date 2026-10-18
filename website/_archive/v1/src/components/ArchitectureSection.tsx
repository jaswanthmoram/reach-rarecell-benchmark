import React, { useState } from 'react';
import {
  Cpu,
  ShieldCheck,
  CheckCircle2,
  GitBranch,
  RefreshCw,
  Layers,
  Terminal,
} from 'lucide-react';
import {
  EVIDENCE_ARMS,
  PIPELINE_PHASES,
  CIRCULARITY_DATA,
  GLOBAL_STATS,
} from '../data/benchmarkData';

export const ArchitectureSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'evidence' | 'circularity' | 'phases'>('evidence');

  return (
    <section id="architecture" className="py-16 border-b border-[#E4E4E7] bg-[#FFFFFF]">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FAFAFA] border border-[#E4E4E7] px-3 py-1 text-[11px] font-mono font-semibold text-[#52525B] mb-3 shadow-2xs">
              <span className="text-[#2563EB] font-bold">04</span>
              <span className="text-[#D4D4D8]">//</span>
              <span>4-ARM SILVER-STANDARD TIERING (§3.2) & 12-PHASE PIPELINE</span>
              <span className="text-[#D4D4D8]">•</span>
              <ShieldCheck className="h-3.5 w-3.5 text-[#2563EB]" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0B0B]">
              4-Arm Evidence Tiering, Non-Circularity Audit & 12-Phase Pipeline
            </h2>
            <p className="mt-2 text-sm text-[#3F3F46] max-w-3xl leading-relaxed">
              REACH constructs decontaminated{' '}
              <strong className="text-[#065F46] font-semibold">P_HC (High-Confidence Malignant)</strong> and{' '}
              <strong className="text-[#1D4ED8] font-semibold">B_HC (High-Confidence Benign)</strong> cell pools by intersecting 4 orthogonal evidence streams, verified via a 3-arm non-CNV circularity audit (Table 9a).
            </p>
          </div>

          {/* Sub-navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[#F4F4F5] p-1 border border-[#E4E4E7] self-start">
            <button
              type="button"
              onClick={() => setActiveTab('evidence')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'evidence'
                  ? 'bg-[#0B0B0B] text-white shadow-2xs'
                  : 'text-[#3F3F46] hover:text-[#0B0B0B]'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              4-Arm Tiering (P_HC / B_HC)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('circularity')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'circularity'
                  ? 'bg-[#0B0B0B] text-white shadow-2xs'
                  : 'text-[#3F3F46] hover:text-[#0B0B0B]'
              }`}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Table 9a Circularity (ρ = 0.648)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('phases')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'phases'
                  ? 'bg-[#0B0B0B] text-white shadow-2xs'
                  : 'text-[#3F3F46] hover:text-[#0B0B0B]'
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              12-Phase Pipeline & Resume CLI
            </button>
          </div>
        </div>

        {/* Tab 1: 4-Arm Evidence Tiering + Architecture Vector Schematic */}
        {activeTab === 'evidence' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 5 Cols: Vector Architecture Schematic + Pool Partition Rules */}
            <div className="lg:col-span-5 rounded-2xl bg-[#FAFAFA] border border-[#E4E4E7] p-4 shadow-xs space-y-4">
              <div className="overflow-hidden rounded-xl border border-[#E4E4E7] bg-[#FFFFFF]">
                <div className="px-3.5 py-2 border-b border-[#E4E4E7] bg-[#FAFAFA] flex items-center justify-between text-[11px] font-mono">
                  <span className="font-bold text-[#0B0B0B]">
                    REACH Architecture Schematic (SVG)
                  </span>
                  <span className="text-[#1D4ED8] font-semibold">Phase 01 → Phase 12</span>
                </div>
                <div className="p-2 bg-[#FFFFFF]">
                  <img
                    src="/figures/architecture.svg"
                    alt="REACH 12-Phase Pipeline and 4-Arm Tiering Architecture"
                    className="w-full h-auto object-contain max-h-[250px] mx-auto"
                  />
                </div>
              </div>

              {/* Pool Partition Formula (§3.2) */}
              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                <div className="rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] p-3">
                  <div className="text-[10px] text-[#065F46] font-bold">P_HC POOL</div>
                  <div className="text-xs font-bold text-[#0B0B0B] mt-0.5">Malignant</div>
                  <div className="text-[10px] text-[#065F46]/90 mt-0.5 leading-snug">
                    Author+ & ≥2/3 non-author arms
                  </div>
                </div>
                <div className="rounded-xl bg-[#FFFBEB] border border-[#FDE68A] p-3">
                  <div className="text-[10px] text-[#92400E] font-bold">EXCLUDED</div>
                  <div className="text-xs font-bold text-[#0B0B0B] mt-0.5">Buffer</div>
                  <div className="text-[10px] text-[#92400E]/90 mt-0.5 leading-snug">
                    P_MC / B_MC discordant cells
                  </div>
                </div>
                <div className="rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] p-3">
                  <div className="text-[10px] text-[#1D4ED8] font-bold">B_HC POOL</div>
                  <div className="text-xs font-bold text-[#0B0B0B] mt-0.5">Benign Bg</div>
                  <div className="text-[10px] text-[#1D4ED8]/90 mt-0.5 leading-snug">
                    Score ≤0.35 & diploid normal
                  </div>
                </div>
              </div>
            </div>

            {/* Right 7 Cols: 4 Orthogonal Evidence Cards */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {EVIDENCE_ARMS.map((arm) => (
                <div
                  key={arm.arm}
                  className="rounded-2xl bg-[#FAFAFA] border border-[#E4E4E7] p-4 hover:border-[#2563EB]/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="rounded-md bg-[#EFF6FF] border border-[#BFDBFE] px-2.5 py-0.5 font-mono text-xs font-bold text-[#1D4ED8]">
                        {arm.arm}
                      </span>
                      <span className="font-mono text-[11px] text-[#065F46] font-semibold">
                        {arm.weight}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-bold text-[#0B0B0B]">
                      {arm.name}
                    </h3>
                    <div className="font-mono text-[11px] text-[#2563EB] font-medium mt-1 mb-2">
                      {arm.metric}
                    </div>
                    <p className="text-xs text-[#3F3F46] leading-relaxed">
                      {arm.description}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-[#E4E4E7] flex items-center justify-between text-[11px] font-mono text-[#52525B]">
                    <span className="inline-flex items-center gap-1 text-[#065F46] font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#059669]" /> Active Across Cohorts
                    </span>
                    <span>Phase 03</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: CNV Circularity Sensitivity Audit (Table 9a) */}
        {activeTab === 'circularity' && (
          <div className="rounded-2xl bg-[#FAFAFA] border border-[#E4E4E7] p-5 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-5 space-y-3">
                <div className="inline-flex items-center gap-2 rounded-md bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-1 font-mono text-xs font-bold text-[#065F46]">
                  Table 9a • Spearman ρ = {GLOBAL_STATS.circularitySpearmanRho} (p = {GLOBAL_STATS.circularityP})
                </div>
                <h3 className="font-display text-xl font-bold text-[#0B0B0B]">
                  3-Arm (No-CNV) vs. 4-Arm (Full) Circularity Audit
                </h3>
                <p className="text-xs text-[#3F3F46] leading-relaxed">
                  To verify that incorporating chromosomal CNV burden (Arm 2) into ground-truth tiering does not circularly inflate CNV-sensitive detectors, all labels were re-derived using only <strong className="text-[#0B0B0B]">Arms 1, 3, and 4 (Zero CNV input)</strong>.
                </p>
                <p className="text-xs text-[#3F3F46] leading-relaxed">
                  The top-4 ranking hierarchy (<code className="text-[#065F46] font-semibold">hvg_logreg</code> #1, <code className="text-[#92400E] font-semibold">CaSee</code> #2, <code className="text-[#1D4ED8] font-semibold">FiRE</code> #3, <code className="text-[#0F766E] font-semibold">expr_threshold</code> #4) is <strong className="text-[#0B0B0B]">100% invariant (ΔRank = 0)</strong>.
                </p>
              </div>

              <div className="lg:col-span-7 overflow-x-auto rounded-xl border border-[#E4E4E7] bg-[#FFFFFF]">
                <table className="w-full text-left border-collapse font-mono tabular-nums text-xs">
                  <thead>
                    <tr className="border-b border-[#E4E4E7] bg-[#F4F4F5] text-[10px] uppercase text-[#52525B]">
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">4-Arm Full Mean AP</th>
                      <th className="py-2.5 px-3">3-Arm No-CNV Mean AP</th>
                      <th className="py-2.5 px-3">Full Rank</th>
                      <th className="py-2.5 px-3">No-CNV Rank</th>
                      <th className="py-2.5 px-3 text-right">Rank Shift (Δ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E4E7]">
                    {CIRCULARITY_DATA.map((row) => (
                      <tr key={row.method} className="hover:bg-[#FAFAFA]">
                        <td className="py-2 px-3 font-bold text-[#0B0B0B]">{row.method}</td>
                        <td className="py-2 px-3 text-[#1D4ED8] font-semibold">
                          {row.fullAP.toFixed(3)}
                        </td>
                        <td className="py-2 px-3 text-[#065F46] font-semibold">
                          {row.noCnvAP.toFixed(3)}
                        </td>
                        <td className="py-2 px-3 text-[#3F3F46]">#{row.fullRank}</td>
                        <td className="py-2 px-3 text-[#3F3F46]">#{row.noCnvRank}</td>
                        <td className="py-2 px-3 text-right">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold border ${
                              row.rankShift === 0
                                ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
                                : 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]'
                            }`}
                          >
                            {row.rankShift === 0
                              ? '0 (Invariant)'
                              : row.rankShift > 0
                              ? `+${row.rankShift}`
                              : row.rankShift}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: 12-Phase Automated Pipeline Architecture with Checkpoint Resume CLI */}
        {activeTab === 'phases' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {PIPELINE_PHASES.map((p, idx) => (
              <div
                key={p.phase}
                className="rounded-xl bg-[#FAFAFA] border border-[#E4E4E7] p-4 hover:border-[#2563EB]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 rounded bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 font-mono text-[11px] font-bold text-[#1D4ED8]">
                      <GitBranch className="h-3 w-3" /> {p.phase}
                    </span>
                    <span className="font-mono text-[10px] text-[#71717A]">
                      Step {idx + 1}/12
                    </span>
                  </div>
                  <h4 className="font-display text-sm font-bold text-[#0B0B0B] mb-1">
                    {p.title}
                  </h4>
                  <p className="text-xs text-[#3F3F46] leading-relaxed mb-3">{p.desc}</p>
                </div>
                {p.cmd && (
                  <div className="pt-2.5 border-t border-[#E4E4E7] flex items-center gap-1.5 font-mono text-[10px] text-[#065F46]">
                    <Terminal className="h-3 w-3 shrink-0" />
                    <code className="truncate">{p.cmd}</code>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
