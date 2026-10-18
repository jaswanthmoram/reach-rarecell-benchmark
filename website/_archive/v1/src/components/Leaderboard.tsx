import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  Clock,
  GitCompare,
  TrendingDown,
  Award,
  Search,
  Grid,
  Filter,
} from 'lucide-react';
import {
  LEADERBOARD_DATA,
  PAIRWISE_COMPARISONS,
  CLIFF_DELTA_METHODS,
  CLIFF_DELTA_MATRIX,
  GLOBAL_STATS,
  type MethodResult,
} from '../data/benchmarkData';

type SortKey =
  | 'overallRank'
  | 'medianAP'
  | 'meanAP'
  | 'auroc'
  | 't4AP'
  | 'trackFMedianAP'
  | 'nAPSlope'
  | 'runtimeS';

export const Leaderboard: React.FC = () => {
  const [sortKey, setSortKey] = useState<SortKey>('overallRank');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [scopeMode, setScopeMode] = useState<'ALL_10' | 'PUBLISHED_6'>('ALL_10');
  const [excludeDegenerate, setExcludeDegenerate] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<
    'bootstrapCI' | 'tierDecay' | 'syntheticVsReal' | 'cliffDelta'
  >('bootstrapCI');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === 'overallRank' || key === 'runtimeS');
    }
  };

  const getActiveAP = (row: MethodResult) =>
    excludeDegenerate ? row.exclDegenerateMedianAP : row.medianAP;

  const filteredAndSorted = useMemo(() => {
    return LEADERBOARD_DATA.filter((item) => {
      if (scopeMode === 'PUBLISHED_6' && item.publishedRankNum === null) return false;
      if (
        searchQuery.trim() &&
        !item.method.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.paradigm.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.roleRankLabel.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      const valA = sortKey === 'medianAP' ? getActiveAP(a) : a[sortKey];
      const valB = sortKey === 'medianAP' ? getActiveAP(b) : b[sortKey];
      return sortAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    });
  }, [sortKey, sortAsc, scopeMode, excludeDegenerate, searchQuery]);

  const getRoleBadgeStyle = (cat: MethodResult['category']) => {
    switch (cat) {
      case 'Supervised Ceiling':
        return 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]';
      case 'Exploratory (Preprint)':
        return 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]';
      case 'Published Tool':
        return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]';
      case 'Naive Baseline':
        return 'bg-[#F4F4F5] text-[#3F3F46] border-[#D4D4D8]';
    }
  };

  return (
    <section id="leaderboard" className="py-14 border-b border-[#E4E4E7] bg-white">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FAFAFA] border border-[#E4E4E7] px-3 py-1 text-[11px] font-mono font-semibold text-[#52525B] mb-2">
              <span className="text-[#2563EB] font-bold">01 // LEADERBOARD</span>
              <span>•</span>
              <span>Table 1a &amp; Table 1b (Front. Bioinform. 6:1878538)</span>
              <span>•</span>
              <span className="text-[#059669]">Friedman p = {GLOBAL_STATS.friedmanP}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0B0B]">
              Track A Primary Leaderboard: Overall (#1–#10) &amp; Role Rankings
            </h2>
            <p className="mt-1.5 text-sm text-[#52525B] max-w-3xl">
              Evaluated across <strong className="text-[#0B0B0B]">160 Track A spike-in units</strong> (8 solid tumor cohorts × 4 rarity tiers × 5 seeds; 140 common non-degenerate units). Toggle between all 10 benchmarked methods (including supervised ceilings and baselines) or the 6 ranked peer-reviewed detectors, and inspect degenerate-unit exclusion sensitivity.
            </p>
          </div>
        </div>

        {/* Control Bar: Scope Toggle + Degenerate Unit Toggle + Search */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#FAFAFA] border border-[#E4E4E7] p-3">
          {/* Left: Scope Toggle (All 10 vs Published 6) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg bg-white p-1 border border-[#E4E4E7] shadow-2xs">
              <button
                type="button"
                onClick={() => setScopeMode('ALL_10')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  scopeMode === 'ALL_10'
                    ? 'bg-[#0B0B0B] text-white'
                    : 'text-[#52525B] hover:text-[#0B0B0B]'
                }`}
              >
                All 10 Methods (Overall &amp; Supervised #1–#10)
              </button>
              <button
                type="button"
                onClick={() => setScopeMode('PUBLISHED_6')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  scopeMode === 'PUBLISHED_6'
                    ? 'bg-[#2563EB] text-white'
                    : 'text-[#52525B] hover:text-[#0B0B0B]'
                }`}
              >
                Ranked Published Detectors Only (#1–#6)
              </button>
            </div>

            {/* Degenerate Exclusion Toggle */}
            <button
              type="button"
              onClick={() => setExcludeDegenerate(!excludeDegenerate)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border transition-colors ${
                excludeDegenerate
                  ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
                  : 'bg-white text-[#3F3F46] border-[#E4E4E7] hover:border-[#0B0B0B]'
              }`}
              title="Toggle exclusion of zero-variance degenerate units (CaSee 0.512 → 0.606, scMalignantFinder 0.235 → 0.290, RareQ 0.196 → 0.208)"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>
                {excludeDegenerate
                  ? 'Showing: Non-Degenerate Units Only (§3.1.2)'
                  : 'Exclude Degenerate Units (CaSee → 0.606)'}
              </span>
            </button>
          </div>

          {/* Right: Search Input */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search method or paradigm..."
              className="rounded-lg bg-white border border-[#E4E4E7] pl-8 pr-3 py-1.5 text-xs text-[#0B0B0B] placeholder:text-[#71717A] focus:outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>

        {/* Main Uncongested Leaderboard Table */}
        <div className="overflow-x-auto rounded-xl border border-[#E4E4E7] bg-white shadow-2xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E4E4E7] bg-[#F4F4F5] text-[10.5px] font-mono uppercase tracking-wider text-[#52525B] whitespace-nowrap">
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => handleSort('overallRank')}
                    className="inline-flex items-center gap-1 font-bold text-[#0B0B0B] hover:text-[#2563EB]"
                    title="Overall rank across all 10 methods + 2,000-resample bootstrap 95% CI (Figure 4b)"
                  >
                    Overall Rank [95% CI] <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-3 px-3">Role / Published Rank</th>
                <th className="py-3 px-3">Method &amp; Paradigm</th>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => handleSort('medianAP')}
                    className="inline-flex items-center gap-1 font-bold text-[#1D4ED8] hover:text-[#0B0B0B]"
                  >
                    {excludeDegenerate ? 'Excl-Degen Med AP' : 'Track A Med AP [IQR]'}{' '}
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-3 px-3">
                  <button
                    type="button"
                    onClick={() => handleSort('meanAP')}
                    className="inline-flex items-center gap-1 font-semibold hover:text-[#0B0B0B]"
                  >
                    Mean AP [Bootstrap CI] <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-3 px-2.5">
                  <button
                    type="button"
                    onClick={() => handleSort('auroc')}
                    className="inline-flex items-center gap-1 font-semibold hover:text-[#0B0B0B]"
                  >
                    Med AUROC <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-3 px-2.5">
                  <button
                    type="button"
                    onClick={() => handleSort('nAPSlope')}
                    className="inline-flex items-center gap-1 font-semibold hover:text-[#0B0B0B]"
                    title="Rarity sensitivity slope of normalized AP across T1 (5%) to T4 (0.1%)"
                  >
                    nAP Slope <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-3 px-2.5">
                  <button
                    type="button"
                    onClick={() => handleSort('trackFMedianAP')}
                    className="inline-flex items-center gap-1 font-semibold text-[#065F46] hover:text-[#0B0B0B]"
                    title="Track F Intra-Lineage Median AP (Malignant vs Normal Epithelial)"
                  >
                    Track F AP <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-3 px-2.5" title="Degenerate (zero-variance) / Fallback units in Track A (160 units)">
                  Degen / Fall
                </th>
                <th className="py-3 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('runtimeS')}
                    className="inline-flex items-center gap-1 font-semibold hover:text-[#0B0B0B] ml-auto"
                  >
                    Runtime <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7] text-xs">
              {filteredAndSorted.map((row) => {
                const activeAP = getActiveAP(row);
                const apDelta = row.exclDegenerateMedianAP - row.medianAP;
                const barWidth = Math.max(3, Math.round(activeAP * 100));

                return (
                  <tr key={row.id} className="hover:bg-[#FAFAFA] transition-colors">
                    {/* Overall Rank + Bootstrap 95% CI */}
                    <td className="py-3 px-3 font-mono tabular-nums whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex h-6 w-7 items-center justify-center rounded font-bold text-xs border ${
                            row.overallRank === 1
                              ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
                              : row.overallRank === 2
                              ? 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]'
                              : row.overallRank <= 5
                              ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
                              : 'bg-[#F4F4F5] text-[#52525B] border-[#E4E4E7]'
                          }`}
                        >
                          #{row.overallRank}
                        </span>
                        <span className="text-[11px] text-[#52525B] font-semibold">
                          {row.bootstrapRankCI}
                        </span>
                      </div>
                    </td>

                    {/* Role & Published Rank Badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold ${getRoleBadgeStyle(
                          row.category
                        )}`}
                      >
                        {row.roleRankLabel}
                      </span>
                    </td>

                    {/* Method & Paradigm */}
                    <td className="py-3 px-3 max-w-[230px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[#0B0B0B] text-[13px]">
                          {row.method}
                        </span>
                        <span className="rounded bg-[#F4F4F5] px-1.5 py-0.5 font-mono text-[9.5px] text-[#52525B] border border-[#E4E4E7]">
                          {row.language.split(' ')[0]}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#71717A] truncate" title={row.paradigm}>
                        {row.paradigm}
                      </div>
                    </td>

                    {/* Track A Median AP + Visual Bar */}
                    <td className="py-3 px-3 font-mono tabular-nums min-w-[165px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#0B0B0B] text-[13px]">
                          {activeAP.toFixed(3)}
                        </span>
                        {excludeDegenerate && apDelta > 0.001 ? (
                          <span className="rounded bg-[#ECFDF5] px-1.5 py-0.5 text-[10px] font-bold text-[#065F46] border border-[#A7F3D0]">
                            +{apDelta.toFixed(3)}
                          </span>
                        ) : (
                          <span className="text-[10.5px] text-[#71717A]">
                            ±{row.stdAP.toFixed(3)}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-[#F4F4F5] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            row.category === 'Supervised Ceiling'
                              ? 'bg-[#059669]'
                              : row.category === 'Exploratory (Preprint)'
                              ? 'bg-[#D97706]'
                              : row.category === 'Published Tool'
                              ? 'bg-[#2563EB]'
                              : 'bg-[#52525B]'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </td>

                    {/* Mean AP + Bootstrap 95% CI */}
                    <td className="py-3 px-3 font-mono tabular-nums whitespace-nowrap">
                      <div className="font-semibold text-[#0B0B0B]">{row.meanAP.toFixed(3)}</div>
                      <div className="text-[10px] text-[#71717A]">{row.bootstrapMeanAP}</div>
                    </td>

                    {/* Median AUROC */}
                    <td className="py-3 px-2.5 font-mono tabular-nums whitespace-nowrap text-[#18181B] font-medium">
                      {row.auroc.toFixed(3)}
                    </td>

                    {/* nAP Slope */}
                    <td className="py-3 px-2.5 font-mono tabular-nums whitespace-nowrap">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                          row.nAPSlope >= -0.025
                            ? 'bg-[#ECFDF5] text-[#065F46]'
                            : row.nAPSlope <= -0.1
                            ? 'bg-[#FFF1F2] text-[#9F1239]'
                            : 'bg-[#F4F4F5] text-[#3F3F46]'
                        }`}
                      >
                        {row.nAPSlope > 0 ? `+${row.nAPSlope.toFixed(3)}` : row.nAPSlope.toFixed(3)}
                      </span>
                    </td>

                    {/* Track F Intra-Lineage AP */}
                    <td className="py-3 px-2.5 font-mono tabular-nums whitespace-nowrap">
                      <span
                        className={`font-bold ${
                          row.trackFMedianAP >= 0.9
                            ? 'text-[#059669]'
                            : row.trackFMedianAP <= 0.05
                            ? 'text-[#E11D48]'
                            : 'text-[#0B0B0B]'
                        }`}
                      >
                        {row.trackFMedianAP.toFixed(3)}
                      </span>
                    </td>

                    {/* Degenerate / Fallback Units */}
                    <td className="py-3 px-2.5 font-mono tabular-nums whitespace-nowrap text-[11px]">
                      {row.degeneratePct > 0 || row.fallbackPct > 0 ? (
                        <span className="rounded bg-[#FFFBEB] px-1.5 py-0.5 text-[#92400E] border border-[#FDE68A] font-semibold">
                          D:{row.trackADegenerate.split(' ')[0]} / F:{row.trackAFallback.split(' ')[0]}
                        </span>
                      ) : (
                        <span className="text-[#71717A]">0 / 0</span>
                      )}
                    </td>

                    {/* Runtime */}
                    <td className="py-3 px-3 font-mono tabular-nums whitespace-nowrap text-right text-[#3F3F46]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3 text-[#A1A1AA]" />
                        {row.runtimeS.toFixed(1)}s
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 4 Interactive Deep-Dive Analytical Tabs */}
        <div className="mt-6 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4E4E7] pb-3.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                {
                  id: 'bootstrapCI',
                  label: 'Bootstrap Rank CIs (Fig 4b & Table 1b)',
                  icon: Award,
                },
                {
                  id: 'tierDecay',
                  label: 'Rarity Tier Decay T1→T4 (Fig 4c)',
                  icon: TrendingDown,
                },
                {
                  id: 'syntheticVsReal',
                  label: 'Patient Track A vs. Synthetic Track B (ρ = 0.042)',
                  icon: GitCompare,
                },
                {
                  id: 'cliffDelta',
                  label: "10×10 Cliff's δ Matrix & Wilcoxon (Table 7)",
                  icon: Grid,
                },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id as typeof activeTab)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border ${
                      activeTab === t.id
                        ? 'bg-[#0B0B0B] text-white border-[#0B0B0B]'
                        : 'bg-white text-[#3F3F46] border-[#E4E4E7] hover:text-[#0B0B0B]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
            <span className="font-mono text-[11px] text-[#52525B]">
              2,000-Resample Bootstrap · Holm/BH-Adjusted Wilcoxon
            </span>
          </div>

          {/* TAB 1: Bootstrap Rank CIs & Critical-Difference View */}
          {activeTab === 'bootstrapCI' && (
            <div className="pt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 rounded-xl border border-[#E4E4E7] bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-[#0B0B0B]">
                    Figure 4b: 2,000-Resample Bootstrap 95% Confidence Intervals on Overall Rank (1–10)
                  </span>
                  <span className="font-mono text-[10px] text-[#2563EB] font-semibold">
                    140 Common Units
                  </span>
                </div>
                <div className="space-y-2">
                  {LEADERBOARD_DATA.map((m) => {
                    const leftPct = ((m.rankCILow - 1) / 9) * 100;
                    const widthPct = Math.max(4, ((m.rankCIHigh - m.rankCILow) / 9) * 100);
                    const pointPct = ((m.overallRank - 1) / 9) * 100;
                    return (
                      <div key={m.id} className="grid grid-cols-12 items-center gap-2 text-xs">
                        <div className="col-span-4 flex items-center gap-1.5 font-mono">
                          <span className="font-bold text-[#0B0B0B] w-6">#{m.overallRank}</span>
                          <span className="font-semibold text-[#18181B] truncate">{m.method}</span>
                        </div>
                        <div className="col-span-5 relative h-5 rounded bg-[#F4F4F5] border border-[#E4E4E7]">
                          <div
                            className="absolute top-1 bottom-1 rounded bg-[#93C5FD]"
                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          />
                          <div
                            className="absolute top-0.5 bottom-0.5 w-2 -ml-1 rounded-full bg-[#1D4ED8]"
                            style={{ left: `${pointPct}%` }}
                            title={`${m.method}: Rank #${m.overallRank} ${m.bootstrapRankCI}`}
                          />
                        </div>
                        <div className="col-span-3 text-right font-mono text-[11px] text-[#52525B]">
                          Rank <strong className="text-[#0B0B0B]">{m.bootstrapRankCI}</strong> ·{' '}
                          {m.medianAP.toFixed(3)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-2 border-t border-[#E4E4E7] flex justify-between font-mono text-[10px] text-[#71717A]">
                  <span>Rank #1 (Best)</span>
                  <span>Rank #5</span>
                  <span>Rank #10 (Lowest)</span>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-3">
                <div className="rounded-xl border border-[#E4E4E7] bg-white p-4">
                  <h4 className="font-display text-sm font-bold text-[#0B0B0B] mb-2">
                    Why Both Overall (#1–#10) &amp; Role Ranks (#1–#6) Matter
                  </h4>
                  <ul className="space-y-2 text-xs text-[#3F3F46] leading-relaxed">
                    <li>
                      • <strong className="text-[#0B0B0B]">#1 Overall (`hvg_logreg`, [1–1]):</strong>{' '}
                      5-fold cross-validated logistic regression sets the empirical ceiling (Med AP = 0.768), proving substantial rare-cell signal remains uncaptured by current unsupervised tools.
                    </li>
                    <li>
                      • <strong className="text-[#0B0B0B]">#2 Overall (`CaSee`, [2–2]):</strong>{' '}
                      Preprint contextual adaptive scorer reaches 0.512 AP across all 160 units and <strong className="text-[#059669]">0.606 AP</strong> on the 140 non-degenerate units.
                    </li>
                    <li>
                      • <strong className="text-[#0B0B0B]">#3–#5 Overlapping Cluster (`FiRE` [3–4], `expr_threshold` [3–5], `scMalignantFinder` [3–6]):</strong>{' '}
                      #1 published detector <code className="font-mono text-[#2563EB]">FiRE</code> (0.371) and the 5-gene baseline <code className="font-mono">expr_threshold</code> (0.348) have overlapping bootstrap rank CIs (<code className="font-mono">p_adj = 0.653</code>).
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Rarity Tier Decay (T1 -> T4) */}
          {activeTab === 'tierDecay' && (
            <div className="pt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 rounded-xl border border-[#E4E4E7] bg-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-[#0B0B0B]">
                    Figure 4c: Performance Across Rarity Tiers T1 (5%) → T4 (0.1%)
                  </span>
                  <span className="font-mono text-[10px] text-[#9F1239] bg-[#FFF1F2] px-2 py-0.5 rounded border border-[#FECDD3]">
                    T4 = 2 Rare Cells / 2,000
                  </span>
                </div>
                <svg viewBox="0 0 600 230" className="w-full h-auto">
                  {[0, 0.25, 0.5, 0.75, 1.0].map((tick) => {
                    const y = 200 - tick * 165;
                    return (
                      <g key={tick}>
                        <line x1={50} y1={y} x2={560} y2={y} stroke="#E4E4E7" strokeDasharray="3 3" />
                        <text x={42} y={y + 3} textAnchor="end" className="fill-[#71717A] font-mono text-[10px]">
                          {tick.toFixed(2)}
                        </text>
                      </g>
                    );
                  })}
                  {[
                    { x: 90, label: 'T1: 5% (100 cells)' },
                    { x: 240, label: 'T2: 1% (20 cells)' },
                    { x: 390, label: 'T3: 0.5% (10 cells)' },
                    { x: 540, label: 'T4: 0.1% (2 cells)' },
                  ].map((t) => (
                    <g key={t.label}>
                      <line x1={t.x} y1={35} x2={t.x} y2={200} stroke="#F4F4F5" />
                      <text x={t.x} y={218} textAnchor="middle" className="fill-[#0B0B0B] font-mono text-[10px] font-semibold">
                        {t.label}
                      </text>
                    </g>
                  ))}
                  {LEADERBOARD_DATA.slice(0, 7).map((m) => {
                    const xs = [90, 240, 390, 540];
                    const pts = [m.t1AP, m.t2AP, m.t3AP, m.t4AP];
                    const color =
                      m.method === 'hvg_logreg'
                        ? '#059669'
                        : m.method === 'CaSee'
                        ? '#D97706'
                        : m.method === 'FiRE'
                        ? '#2563EB'
                        : m.method === 'expr_threshold'
                        ? '#52525B'
                        : m.method === 'scMalignantFinder'
                        ? '#0D9488'
                        : m.method === 'cellsius'
                        ? '#E11D48'
                        : '#7C3AED';
                    const poly = pts.map((v, idx) => `${xs[idx]},${200 - v * 165}`).join(' ');
                    return (
                      <g key={m.id}>
                        <polyline fill="none" stroke={color} strokeWidth="2.2" points={poly} />
                        {pts.map((v, idx) => (
                          <circle key={idx} cx={xs[idx]} cy={200 - v * 165} r="3.5" fill={color} stroke="#fff" strokeWidth="1" />
                        ))}
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="lg:col-span-5 rounded-xl border border-[#E4E4E7] bg-white p-4">
                <h4 className="font-display text-sm font-bold text-[#0B0B0B] mb-2">
                  Rarity Sensitivity Slopes (nAP per Tier Step)
                </h4>
                <div className="space-y-1.5 font-mono text-xs">
                  {LEADERBOARD_DATA.slice(0, 8).map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-1 border-b border-[#F4F4F5] last:border-0">
                      <span className="font-bold text-[#0B0B0B]">{m.method}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-[#71717A]">
                          T1 {m.t1AP.toFixed(2)} → T4 {m.t4AP.toFixed(3)}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10.5px] font-bold ${
                            m.nAPSlope >= -0.025
                              ? 'bg-[#ECFDF5] text-[#065F46]'
                              : m.nAPSlope <= -0.1
                              ? 'bg-[#FFF1F2] text-[#9F1239]'
                              : 'bg-[#F4F4F5] text-[#3F3F46]'
                          }`}
                        >
                          {m.nAPSlope.toFixed(3)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Track A (Patient) vs Track B (Synthetic) Rank Reordering */}
          {activeTab === 'syntheticVsReal' && (
            <div className="pt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 overflow-x-auto rounded-xl border border-[#E4E4E7] bg-white">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#E4E4E7] bg-[#F4F4F5] text-[10px] uppercase text-[#52525B]">
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Track A Med AP</th>
                      <th className="py-2.5 px-3">Track A Rank</th>
                      <th className="py-2.5 px-3">Track D (CTC/Blood) AP</th>
                      <th className="py-2.5 px-3">Track B (Synthetic) Rank</th>
                      <th className="py-2.5 px-3">Rank Shift (B → A)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E4E7]">
                    {LEADERBOARD_DATA.map((m) => {
                      const shift = m.trackBRank - m.trackARank;
                      return (
                        <tr key={m.id} className="hover:bg-[#FAFAFA]">
                          <td className="py-2 px-3 font-bold text-[#0B0B0B]">{m.method}</td>
                          <td className="py-2 px-3 font-semibold text-[#1D4ED8]">{m.medianAP.toFixed(3)}</td>
                          <td className="py-2 px-3 font-bold">#{m.trackARank}</td>
                          <td className="py-2 px-3 text-[#52525B]">{m.trackDAP.toFixed(3)}</td>
                          <td className="py-2 px-3">#{m.trackBRank}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10.5px] font-bold ${
                                shift > 1
                                  ? 'bg-[#ECFDF5] text-[#065F46]'
                                  : shift < -1
                                  ? 'bg-[#FFF1F2] text-[#9F1239]'
                                  : 'bg-[#F4F4F5] text-[#52525B]'
                              }`}
                            >
                              {shift > 0 ? `+${shift} places on Patient` : shift < 0 ? `${shift} places on Patient` : '0 (Unchanged)'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="lg:col-span-4 rounded-xl border border-[#E4E4E7] bg-white p-4 space-y-2.5">
                <div className="inline-flex items-center gap-1.5 rounded bg-[#FFFBEB] px-2 py-0.5 font-mono text-[10px] font-bold text-[#92400E] border border-[#FDE68A]">
                  TABLE 1b // SPEARMAN ρ = 0.042 (p = 0.907)
                </div>
                <h4 className="font-display text-sm font-bold text-[#0B0B0B]">
                  Substantial Rank Reordering Between Synthetic &amp; Patient Data
                </h4>
                <p className="text-xs text-[#52525B] leading-relaxed">
                  Methods achieving near-perfect AP on clean Splatter synthetic data (Track B) drop sharply on heterogeneous patient cohorts (Track A): <code className="font-mono text-[#0B0B0B]">RareQ</code> drops from <strong className="text-[#9F1239]">#2 (0.996) to #7 (0.196)</strong>, and <code className="font-mono text-[#0B0B0B]">scCAD</code> drops from <strong className="text-[#9F1239]">#4 (0.875) to #8 (0.130)</strong>.
                </p>
                <p className="text-xs text-[#52525B] leading-relaxed">
                  Conversely, <code className="font-mono text-[#059669]">scMalignantFinder</code> rises from <strong className="text-[#059669]">#10 on synthetic to #5 overall (#3 published)</strong> because its pan-cancer gene signatures require genuine biological transcriptional programs absent in Splatter simulations.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: 10x10 Cliff's Delta Matrix (Table 7) & Key Wilcoxon Tests */}
          {activeTab === 'cliffDelta' && (
            <div className="pt-4 space-y-4">
              <div className="overflow-x-auto rounded-xl border border-[#E4E4E7] bg-white p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-[#0B0B0B]">
                    Table 7: Pairwise Cliff&apos;s δ Effect-Size Matrix Across Track A (Row vs. Column; Positive = Row Superior)
                  </span>
                  <span className="font-mono text-[10px] text-[#52525B]">
                    |δ| &lt; 0.147 negligible · &lt; 0.33 small · &lt; 0.474 medium · ≥ 0.474 large
                  </span>
                </div>
                <table className="w-full border-collapse font-mono text-[10.5px]">
                  <thead>
                    <tr className="border-b border-[#E4E4E7] bg-[#F4F4F5] text-[#52525B]">
                      <th className="py-1.5 px-2 text-left">Method</th>
                      {CLIFF_DELTA_METHODS.map((m) => (
                        <th key={m} className="py-1.5 px-1.5 text-center truncate max-w-[68px]" title={m}>
                          {m.slice(0, 7)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E4E7]">
                    {CLIFF_DELTA_METHODS.map((rowM, rIdx) => (
                      <tr key={rowM} className="hover:bg-[#FAFAFA]">
                        <td className="py-1.5 px-2 font-bold text-[#0B0B0B] whitespace-nowrap">{rowM}</td>
                        {CLIFF_DELTA_MATRIX[rIdx].map((val, cIdx) => {
                          const isDiag = rIdx === cIdx;
                          const bg = isDiag
                            ? 'bg-[#F4F4F5] text-[#A1A1AA]'
                            : val >= 0.474
                            ? 'bg-[#DBEAFE] text-[#1E40AF] font-bold'
                            : val >= 0.147
                            ? 'bg-[#EFF6FF] text-[#1D4ED8]'
                            : val <= -0.474
                            ? 'bg-[#FFE4E6] text-[#9F1239] font-bold'
                            : val <= -0.147
                            ? 'bg-[#FFF1F2] text-[#BE123C]'
                            : 'bg-white text-[#71717A]';
                          return (
                            <td key={cIdx} className={`py-1.5 px-1.5 text-center ${bg}`}>
                              {isDiag ? '0.000' : val > 0 ? `+${val.toFixed(3)}` : val.toFixed(3)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Key Pairwise Wilcoxon Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {PAIRWISE_COMPARISONS.slice(0, 3).map((pw) => (
                  <div key={`${pw.methodA}-${pw.methodB}`} className="rounded-lg border border-[#E4E4E7] bg-white p-3">
                    <div className="flex items-center justify-between font-mono text-[11px] font-bold text-[#0B0B0B] mb-1">
                      <span>
                        {pw.methodA} vs. {pw.methodB}
                      </span>
                      <span className="text-[#2563EB]">δ = {pw.cliffsDelta.toFixed(3)}</span>
                    </div>
                    <div className="font-mono text-[10px] text-[#059669] mb-1">
                      Wilcoxon p_adj = {pw.pAdjusted} (p_raw = {pw.pRaw})
                    </div>
                    <p className="text-[11px] text-[#52525B] leading-snug">{pw.interpretation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
