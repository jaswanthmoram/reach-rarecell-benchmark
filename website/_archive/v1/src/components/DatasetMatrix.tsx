import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  Microscope,
  ShieldCheck,
  Activity,
  Award,
} from 'lucide-react';
import { DATASETS_DATA } from '../data/benchmarkData';

export const DatasetMatrix: React.FC = () => {
  const [filterType, setFilterType] = useState<'ALL' | 'Solid Tumor' | 'Hematologic / CTC'>('ALL');
  const [viewTab, setViewTab] = useState<'cohorts' | 'cnv'>('cohorts');

  const filteredDatasets = DATASETS_DATA.filter((d) =>
    filterType === 'ALL' ? true : d.tissueCategory === filterType
  );

  const cnvDatasets = DATASETS_DATA.filter((d) => d.cnvAUROC !== undefined).sort(
    (a, b) => (b.cnvAUROC || 0) - (a.cnvAUROC || 0)
  );

  return (
    <section id="datasets" className="py-16 border-b border-[#E4E4E7] bg-[#FAFAFA] relative">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Top Banner + Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-8">
          <div className="lg:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FFFFFF] border border-[#E4E4E7] px-3 py-1 text-[11px] font-mono font-semibold text-[#52525B] shadow-2xs">
              <span className="text-[#2563EB] font-bold">05</span>
              <span className="text-[#D4D4D8]">//</span>
              <span>10 HUMAN ONCOLOGY COHORTS (§2.1 & TABLE 6a / 9b)</span>
              <span className="text-[#D4D4D8]">•</span>
              <Database className="h-3.5 w-3.5 text-[#059669]" />
              <span>359,739 SINGLE CELLS</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0B0B]">
              10-Cohort Oncology Atlas, Per-Dataset Winners & Real Chromosomal CNV
            </h2>
            <p className="text-sm text-[#3F3F46] leading-relaxed">
              Spanning <strong className="text-[#0B0B0B] font-semibold">8 solid tumor microenvironments (346,162 cells)</strong> and{' '}
              <strong className="text-[#0B0B0B] font-semibold">2 liquid-biopsy CTC cohorts (13,577 cells)</strong> across 10x Chromium and Smart-seq2 platforms. Real chromosomal copy-number burden was validated across{' '}
              <strong className="text-[#065F46] font-semibold">57,811 cells (pooled AUROC = 0.782, specificity = 89.5%)</strong>.
            </p>

            {/* View Switcher */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-1 rounded-xl bg-[#F4F4F5] p-1 border border-[#E4E4E7]">
                <button
                  type="button"
                  onClick={() => setViewTab('cohorts')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    viewTab === 'cohorts'
                      ? 'bg-[#0B0B0B] text-white shadow-2xs'
                      : 'text-[#3F3F46] hover:text-[#0B0B0B]'
                  }`}
                >
                  <Microscope className="h-3.5 w-3.5" />
                  10 Oncology Cohorts & Winners (Table 6a)
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab('cnv')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    viewTab === 'cnv'
                      ? 'bg-[#059669] text-white shadow-2xs'
                      : 'text-[#3F3F46] hover:text-[#0B0B0B]'
                  }`}
                >
                  <Activity className="h-3.5 w-3.5" />
                  Real CNV Concordance (Table 9b • 57,811 Cells)
                </button>
              </div>

              {viewTab === 'cohorts' && (
                <div className="flex items-center gap-1.5">
                  {(['ALL', 'Solid Tumor', 'Hematologic / CTC'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFilterType(cat)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-colors ${
                        filterType === cat
                          ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8] font-semibold'
                          : 'bg-[#FFFFFF] border-[#E4E4E7] text-[#3F3F46] hover:bg-[#F4F4F5] hover:text-[#0B0B0B]'
                      }`}
                    >
                      {cat === 'ALL' ? 'All 10 Cohorts' : cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right 4 Cols: Code-Native Telemetry Summary Card */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl bg-[#FFFFFF] border border-[#E4E4E7] p-4 shadow-xs grid grid-cols-2 gap-2.5 font-mono tabular-nums">
              <div className="rounded-xl bg-[#FAFAFA] border border-[#E4E4E7] p-3">
                <div className="text-[10px] text-[#52525B] uppercase font-bold">Total Cells</div>
                <div className="text-lg font-bold text-[#0B0B0B] mt-0.5">359,739</div>
                <div className="text-[10px] text-[#2563EB]">10 Curated Cohorts</div>
              </div>
              <div className="rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] p-3">
                <div className="text-[10px] text-[#065F46] uppercase font-bold">Real CNV Audit</div>
                <div className="text-lg font-bold text-[#065F46] mt-0.5">0.782</div>
                <div className="text-[10px] text-[#065F46]">Pooled AUROC (57.8k)</div>
              </div>
              <div className="rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] p-3">
                <div className="text-[10px] text-[#1D4ED8] uppercase font-bold">Solid Tumors</div>
                <div className="text-sm font-bold text-[#0B0B0B] mt-0.5">8 Cohorts</div>
                <div className="text-[10px] text-[#1D4ED8]">346,162 TME Cells</div>
              </div>
              <div className="rounded-xl bg-[#FFF1F2] border border-[#FECDD3] p-3">
                <div className="text-[10px] text-[#9F1239] uppercase font-bold">Blood / CTCs</div>
                <div className="text-sm font-bold text-[#0B0B0B] mt-0.5">2 Cohorts</div>
                <div className="text-[10px] text-[#9F1239]">13,577 Liquid Cells</div>
              </div>
            </div>
          </div>
        </div>

        {/* View 1: 10 Cohorts Matrix */}
        {viewTab === 'cohorts' && (
          <div className="overflow-hidden rounded-2xl border border-[#E4E4E7] bg-[#FFFFFF] shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E4E4E7] bg-[#F4F4F5]/80 text-[11px] font-mono uppercase tracking-wider text-[#52525B]">
                    <th className="py-3 px-4">Cohort ID & Accession</th>
                    <th className="py-3 px-3">Malignancy & Category</th>
                    <th className="py-3 px-3">Platform</th>
                    <th className="py-3 px-3">Cells & Genes</th>
                    <th className="py-3 px-3">Real CNV AUROC</th>
                    <th className="py-3 px-3">Table 6a Winners (Overall / Unsup)</th>
                    <th className="py-3 px-4">Evaluation Tracks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E7] text-xs">
                  {filteredDatasets.map((ds) => (
                    <tr key={ds.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-[#0B0B0B] text-sm">{ds.name}</div>
                        <div className="text-[11px] text-[#2563EB] font-medium">{ds.accession}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-[#0B0B0B]">{ds.cancerType}</div>
                        <span
                          className={`mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-mono font-semibold border ${
                            ds.tissueCategory === 'Solid Tumor'
                              ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
                              : 'bg-[#FFF1F2] text-[#9F1239] border-[#FECDD3]'
                          }`}
                        >
                          {ds.tissueCategory}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-xs text-[#3F3F46]">
                        <div className="font-semibold text-[#0B0B0B]">{ds.platform}</div>
                        <div className="text-[10px] text-[#71717A]">{ds.purityTier} Purity</div>
                      </td>
                      <td className="py-3.5 px-3 font-mono tabular-nums text-xs">
                        <div className="font-bold text-[#0B0B0B]">{ds.cells} cells</div>
                        <div className="text-[11px] text-[#52525B]">
                          {ds.genes.toLocaleString()} genes
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono tabular-nums">
                        {ds.cnvAUROC ? (
                          <div>
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold border ${
                                ds.cnvAUROC >= 0.88
                                  ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
                                  : 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
                              }`}
                            >
                              {ds.cnvAUROC.toFixed(3)}
                            </span>
                            <div className="text-[10px] text-[#52525B] mt-0.5">
                              n = {ds.cnvCells?.toLocaleString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-[#71717A]">Track B Only</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-[11px]">
                        {ds.bestOverallMethod ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-[#52525B]">All:</span>
                              <span className="font-bold text-[#065F46]">{ds.bestOverallMethod}</span>
                              <span className="text-[#52525B]">({ds.bestOverallAP?.toFixed(3)})</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Award className="w-3 h-3 text-[#2563EB] shrink-0" />
                              <span className="font-bold text-[#1D4ED8]">{ds.bestUnsupMethod}</span>
                              <span className="text-[#52525B]">({ds.bestUnsupAP?.toFixed(3)})</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#71717A]">Blood Track D / Null C</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                          {ds.tracks.map((t) => (
                            <span
                              key={t}
                              className={`rounded px-1.5 py-0.5 font-mono text-[10px] border ${
                                t === 'Track F'
                                  ? 'bg-[#FFF1F2] text-[#9F1239] border-[#FECDD3] font-bold'
                                  : 'bg-[#F4F4F5] text-[#3F3F46] border-[#E4E4E7]'
                              }`}
                            >
                              {t.replace('Track ', '')}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View 2: Real Chromosomal CNV Concordance Table (Table 9b) */}
        {viewTab === 'cnv' && (
          <div className="rounded-2xl bg-[#FFFFFF] border border-[#E4E4E7] p-5 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4E4E7] pb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-[#0B0B0B] flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#059669]" />
                  Table 9b: Real Chromosomal CNV Concordance Across 57,811 Cells (cnv_concordance.csv)
                </h3>
                <p className="text-xs text-[#52525B] mt-1">
                  100-gene sliding-window autosomal CNV burden evaluated against curated malignancy annotations across 9 cohorts.
                </p>
              </div>
              <div className="rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] px-4 py-2 font-mono tabular-nums text-xs shrink-0">
                <div className="text-[10px] text-[#065F46] font-bold uppercase">
                  Overall Pooled (57,811 Cells)
                </div>
                <div className="text-sm font-bold text-[#0B0B0B] mt-0.5">
                  AUROC = 0.782 • Spec = 89.5% • Sens = 55.6%
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#E4E4E7]">
              <table className="w-full text-left border-collapse font-mono tabular-nums text-xs">
                <thead>
                  <tr className="border-b border-[#E4E4E7] bg-[#F4F4F5] text-[10px] uppercase text-[#52525B]">
                    <th className="py-3 px-4">Cohort</th>
                    <th className="py-3 px-3">Evaluated Cells</th>
                    <th className="py-3 px-3">Malignant (n_pos)</th>
                    <th className="py-3 px-3">Diploid Ref (n_neg)</th>
                    <th className="py-3 px-3">Sensitivity</th>
                    <th className="py-3 px-3">Specificity</th>
                    <th className="py-3 px-3">MCC</th>
                    <th className="py-3 px-4">CNV AUROC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E7]">
                  {cnvDatasets.map((ds) => (
                    <tr key={ds.id} className="hover:bg-[#FAFAFA]">
                      <td className="py-2.5 px-4 font-bold text-[#0B0B0B]">
                        {ds.name}
                        {ds.id === 'hnscc_puram' && (
                          <span className="ml-2 rounded bg-[#ECFDF5] px-1.5 py-0.5 text-[9px] text-[#065F46] border border-[#A7F3D0]">
                            Symbol Fixed
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[#3F3F46]">{ds.cnvCells?.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-[#9F1239] font-semibold">
                        {ds.cnvPos?.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-[#1D4ED8] font-semibold">
                        {ds.cnvNeg?.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-[#0B0B0B]">
                        {((ds.cnvSensitivity || 0) * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-[#065F46] font-bold">
                        {((ds.cnvSpecificity || 0) * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-[#0B0B0B]">{ds.cnvMCC?.toFixed(3)}</td>
                      <td className="py-2.5 px-4 w-56">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#0B0B0B] w-12">
                            {ds.cnvAUROC?.toFixed(3)}
                          </span>
                          <div className="flex-1 h-2 bg-[#F4F4F5] rounded-full overflow-hidden border border-[#E4E4E7]">
                            <div
                              className="h-full bg-[#059669] rounded-full"
                              style={{ width: `${(ds.cnvAUROC || 0) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#3F3F46]">
              <CheckCircle2 className="h-4 w-4 text-[#059669] shrink-0" />
              <span>
                High specificity (75.9%–99.6%) across all 9 cohorts ensures that Arm 2 CNV scoring cleanly separates aneuploid malignant subclones from diploid stromal/immune cells.
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
