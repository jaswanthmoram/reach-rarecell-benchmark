import type { MethodResult } from '../../data/benchmarkData';
import { VIEWS, roleLabel, type Tier, type ViewId } from './model';

const cell = (v: string | number | null) => {
  const s = v === null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV of exactly the rows and order currently on screen. */
export function toCsv(rows: MethodResult[], view: ViewId, tier: Tier): string {
  const def = VIEWS[view];
  const head = view === 'rank'
    ? ['method', 'role', 'within_unit_rank_mean', 'within_unit_rank_ci_low', 'within_unit_rank_ci_high']
    : ['leaderboard_rank', 'method', 'role', ...(view === 'overall' ? [] : [def.column(tier).toLowerCase().replace(/[^a-z0-9]+/g, '_')]), 'median_ap', 'bootstrap_mean_ap', 'boot_ap_ci_low', 'boot_ap_ci_high', 'mean_ap', 'sd_ap', 'auroc', 'topk_f1', 'runtime_s'];
  const body = rows.map((m) => (view === 'rank'
    ? [m.method, roleLabel(m), m.rankMean, m.rankCILow, m.rankCIHigh]
    : [m.publishedRankNum, m.method, roleLabel(m), ...(view === 'overall' ? [] : [def.get(m, tier)]), m.medianAP, m.bootstrapMeanAP, m.bootAPLow ?? null, m.bootAPHigh ?? null, m.meanAP, m.stdAP, m.auroc, m.topKF1, m.runtimeS]));
  return [head, ...body].map((r) => r.map(cell).join(',')).join('\n');
}

/** True inside an embedding frame (e.g. the artifact viewer), where sandboxing blocks downloads without throwing. */
export function isFramed(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/** Starts a download of `text`. Throws if the browser refuses to build the file; the caller reports it. */
export function downloadCsv(text: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
