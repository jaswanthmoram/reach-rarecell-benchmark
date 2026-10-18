import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Award } from 'lucide-react';
import {
  DATASET_METHOD_MATRIX,
  LEADERBOARD_DATA,
  DATASETS_DATA,
} from '../data/benchmarkData';

const METHOD_COLUMNS = [
  'hvg_logreg',
  'CaSee',
  'FiRE',
  'expr_threshold',
  'scMalignantFinder',
  'cellsius',
  'RareQ',
  'scCAD',
  'random_baseline',
  'DeepScena',
] as const;

const TRACK_A_DATASETS = DATASETS_DATA.filter((d) => d.trackAUnits > 0);

export const HeatmapExplorer: React.FC = () => {
  const [selectedCell, setSelectedCell] = useState<{
    datasetId: string;
    method: string;
  }>({
    datasetId: 'ov_izar_tirosh',
    method: 'CaSee',
  });

  const activeCell =
    DATASET_METHOD_MATRIX.find(
      (c) => c.dataset === selectedCell.datasetId && c.method === selectedCell.method
    ) || DATASET_METHOD_MATRIX[0];

  const activeDatasetMeta =
    DATASETS_DATA.find((d) => d.id === selectedCell.datasetId) || DATASETS_DATA[0];
  const activeMethodMeta =
    LEADERBOARD_DATA.find((m) => m.method === selectedCell.method) ||
    LEADERBOARD_DATA[1];

  const activeScore = activeCell.meanAP ?? 0;
  const activeStatus = activeCell.status;

  const getCellStyle = (val: number | null, status: 'ok' | 'fallback' | 'degenerate') => {
    if (status === 'fallback' || val === null) {
      return 'bg-[#FFF1F2] text-[#9F1239] border-[#FECDD3] hover:border-[#E11D48]';
    }
    if (status === 'degenerate') {
      return 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A] hover:border-[#D97706]';
    }
    if (val >= 0.75) {
      return 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0] font-bold hover:border-[#059669]';
    }
    if (val >= 0.5) {
      return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE] font-semibold hover:border-[#2563EB]';
    }
    if (val >= 0.25) {
      return 'bg-[#F0FDFA] text-[#0F766E] border-[#99F6E4] font-medium hover:border-[#0D9488]';
    }
    return 'bg-[#F4F4F5] text-[#52525B] border-[#E4E4E7] hover:border-[#A1A1AA]';
  };

  return (
    <section id="heatmap" className="py-14 border-b border-[#E4E4E7] bg-[#FAFAFA]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#E4E4E7] px-3 py-1 text-[11px] font-mono font-semibold text-[#52525B] mb-2">
              <span className="text-[#2563EB] font-bold">02 // COHORT × METHOD MATRIX</span>
              <span>•</span>
              <span>Table 6a &amp; Table 6b (Figure 5a)</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0B0B]">
              8 × 10 Dataset × Method Median AP Matrix
            </h2>
            <p className="mt-1.5 text-sm text-[#52525B] max-w-3xl">
              Median AP varies 23-fold across cancer types—from <strong className="text-[#0B0B0B]">ov_izar_tirosh (0.996 best non-ceiling)</strong> to <strong className="text-[#0B0B0B]">pdac_peng (0.043)</strong>. Click any cell to inspect cohort biology, top detector, and degenerate/fallback diagnostics.
            </p>
          </div>

          {/* Color Scale Legend */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-mono bg-white p-2 rounded-xl border border-[#E4E4E7]">
            <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] font-semibold">
              ≥0.75 High
            </span>
            <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] font-semibold">
              0.50–0.74
            </span>
            <span className="px-2 py-0.5 rounded bg-[#F0FDFA] text-[#0F766E] border border-[#99F6E4] font-semibold">
              0.25–0.49
            </span>
            <span className="px-2 py-0.5 rounded bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] font-semibold">
              Degen (Const)
            </span>
            <span className="px-2 py-0.5 rounded bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3] font-semibold">
              Fallback (N/A)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 Cols: 8x10 Interactive Matrix */}
          <div className="lg:col-span-8 overflow-x-auto rounded-xl border border-[#E4E4E7] bg-white p-3.5 shadow-2xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#E4E4E7]">
                  <th className="py-2 px-2.5 text-left font-mono text-[10.5px] uppercase text-[#52525B] font-semibold">
                    Dataset (20u / cohort)
                  </th>
                  {METHOD_COLUMNS.map((m) => (
                    <th
                      key={m}
                      className="py-2 px-1 text-center font-mono text-[10px] text-[#0B0B0B] font-bold"
                    >
                      <div className="truncate max-w-[66px] mx-auto" title={m}>
                        {m === 'scMalignantFinder'
                          ? 'scMalig'
                          : m === 'expr_threshold'
                          ? 'expr_thr'
                          : m === 'random_baseline'
                          ? 'random'
                          : m === 'hvg_logreg'
                          ? 'hvg_log'
                          : m}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E7]">
                {TRACK_A_DATASETS.map((ds) => (
                  <tr key={ds.id} className="hover:bg-[#FAFAFA]">
                    <td className="py-2 px-2.5 whitespace-nowrap">
                      <div className="font-mono text-xs font-bold text-[#0B0B0B]">
                        {ds.id}
                      </div>
                      <div className="text-[10px] font-mono text-[#71717A]">
                        {ds.cancerType.split(' (')[0]} · {ds.platform}
                      </div>
                    </td>

                    {METHOD_COLUMNS.map((method) => {
                      const cell = DATASET_METHOD_MATRIX.find(
                        (c) => c.dataset === ds.id && c.method === method
                      );
                      const val = cell?.meanAP ?? null;
                      const status = cell?.status ?? 'ok';
                      const isSelected =
                        selectedCell.datasetId === ds.id &&
                        selectedCell.method === method;

                      return (
                        <td key={method} className="p-1 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedCell({ datasetId: ds.id, method })
                            }
                            className={`w-full rounded-md border py-1.5 px-1 font-mono tabular-nums text-[11px] transition-all ${getCellStyle(
                              val,
                              status
                            )} ${
                              isSelected
                                ? 'ring-2 ring-[#0B0B0B] scale-[1.03] z-10 shadow-xs'
                                : ''
                            }`}
                          >
                            <div>{val !== null ? val.toFixed(3) : 'N/A'}</div>
                            {status !== 'ok' && (
                              <div className="text-[8px] uppercase font-bold">
                                {status === 'fallback' ? 'Fallbk' : 'Degen'}
                              </div>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right 4 Cols: Selected Cell Diagnostic Inspector */}
          <div className="lg:col-span-4 rounded-xl border border-[#E4E4E7] bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#2563EB] font-bold">
                  Table 6b Cell Inspector
                </span>
                <h3 className="font-display text-lg font-bold text-[#0B0B0B] mt-0.5">
                  {activeDatasetMeta.id} × {selectedCell.method}
                </h3>
              </div>
              <div className="text-right font-mono tabular-nums">
                <div className="text-xl font-extrabold text-[#2563EB]">
                  {activeCell.meanAP !== null ? activeScore.toFixed(3) : 'N/A'}
                </div>
                <div className="text-[10px] text-[#52525B]">Median AP</div>
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-3 gap-2 font-mono tabular-nums text-center">
              <div className="rounded-lg bg-[#FAFAFA] border border-[#E4E4E7] p-2">
                <div className="text-[10px] text-[#71717A]">Med AUROC</div>
                <div className="text-xs font-bold text-[#0B0B0B]">
                  {activeCell.meanAUROC !== null ? activeCell.meanAUROC.toFixed(3) : '—'}
                </div>
              </div>
              <div className="rounded-lg bg-[#FAFAFA] border border-[#E4E4E7] p-2">
                <div className="text-[10px] text-[#71717A]">Top-k F1</div>
                <div className="text-xs font-bold text-[#0B0B0B]">
                  {activeCell.meanF1 !== null ? activeCell.meanF1.toFixed(3) : '—'}
                </div>
              </div>
              <div className="rounded-lg bg-[#FAFAFA] border border-[#E4E4E7] p-2">
                <div className="text-[10px] text-[#71717A]">Runtime</div>
                <div className="text-xs font-bold text-[#0B0B0B]">
                  {activeCell.meanRuntime !== null ? `${activeCell.meanRuntime.toFixed(1)}s` : '—'}
                </div>
              </div>
            </div>

            {/* Status Diagnostic Banner */}
            {activeStatus !== 'ok' ? (
              <div
                className={`rounded-lg p-3 border text-xs ${
                  activeStatus === 'fallback'
                    ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]'
                    : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                }`}
              >
                <div className="font-mono font-bold flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {activeStatus === 'fallback'
                    ? 'Pre-Processing Fallback (20 Cohort Units)'
                    : 'Degenerate Constant-Score Output (20 Cohort Units)'}
                </div>
                <p className="text-[11px] leading-relaxed">
                  {activeStatus === 'fallback'
                    ? 'On ov_izar_tirosh (GSE146026), internal gene filtering in scMalignantFinder triggered the benchmark fallback handler across all 20 cohort units.'
                    : 'Method emitted constant (zero-variance) score vectors on this cohort, yielding baseline AUROC = 0.500 and prevalence-level AP.'}
                </p>
              </div>
            ) : (
              <div className="rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] p-3 text-xs text-[#065F46]">
                <div className="font-mono font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#059669] shrink-0" />
                  Valid Execution Across All 20 Cohort Units (4 Tiers × 5 Seeds)
                </div>
              </div>
            )}

            {/* Table 6a Cohort Leaders */}
            <div className="rounded-lg bg-[#FAFAFA] border border-[#E4E4E7] p-3 space-y-1.5 text-xs">
              <div className="font-mono text-[10px] font-bold uppercase text-[#52525B] flex items-center gap-1">
                <Award className="h-3 w-3 text-[#2563EB]" /> Table 6a Cohort Winners ({activeDatasetMeta.id})
              </div>
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-[#52525B]">Best Overall:</span>
                <span className="font-bold text-[#059669]">{activeDatasetMeta.bestOverallMethod}</span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-[#52525B]">Best Non-Ceiling:</span>
                <span className="font-bold text-[#2563EB]">{activeDatasetMeta.bestUnsupMethod}</span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-[#52525B]">Cells / Platform:</span>
                <span className="font-semibold text-[#0B0B0B]">
                  {activeDatasetMeta.cells} · {activeDatasetMeta.platform}
                </span>
              </div>
            </div>

            {/* Detector Mechanism Note */}
            <div className="rounded-lg bg-[#FAFAFA] border border-[#E4E4E7] p-3 text-[11px] text-[#52525B] flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-[#2563EB] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[#0B0B0B]">{activeMethodMeta.method}:</strong>{' '}
                {activeMethodMeta.failureMode}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
