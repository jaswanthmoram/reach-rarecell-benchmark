/* Derived facts for the Home page. Every number shown on Home comes from benchmarkData through this file. */
import { href } from '../../app/router';
import {
  GLOBAL_STATS as G,
  LEADERBOARD_DATA,
  PAIRWISE_COMPARISONS,
  TRACKS_DATA,
  type MethodResult,
} from '../../data/benchmarkData';

export { G };

const find = (id: string): MethodResult | undefined => LEADERBOARD_DATA.find((r) => r.id === id || r.method === id);
const pair = (a: string, b: string) => PAIRWISE_COMPARISONS.find((p) => p.methodA === a && p.methodB === b);

/** Only the six ranked published detectors carry a leaderboard rank (proof Table 4). */
export const RANKED = LEADERBOARD_DATA
  .filter((m): m is MethodResult & { publishedRankNum: number } => m.publishedRankNum !== null)
  .sort((a, b) => a.publishedRankNum - b.publishedRankNum);

export const CEILING = find('hvg_logreg');
export const BASELINE = find('expr_threshold');
export const EXPLORATORY = find('CaSee');
export const FLOOR = find('random_baseline');
export const FIRE = find('FiRE');
export const SMF = find('scMalignantFinder');
export const RAREQ = find('RareQ');

/** Site-wide method order (rule 1): supervised ceiling, ranked 1 to 6, then the reference rows. */
export const ORDERED: MethodResult[] = [CEILING, ...RANKED, EXPLORATORY, BASELINE, FLOOR].filter((m): m is MethodResult => Boolean(m));
/** Ceiling, CaSee, expr_threshold and random_baseline carry no rank and are drawn dashed. */
export const isRef = (m: MethodResult) => m.publishedRankNum === null;

export const FIRE_VS_EXPR = pair('FiRE', 'expr_threshold');
export const FIRE_VS_SMF = pair('FiRE', 'scMalignantFinder');
export const CEILING_VS_FIRE = pair('hvg_logreg', 'FiRE');

/** "20 / 160 (12.5%)" -> 20. Units left after method-specific fallback filtering. */
const fallbackCount = (m: MethodResult) => Number(m.trackAFallback.split('/')[0].trim()) || 0;
export const unitsAfterFallback = (m: MethodResult) => G.trackAUnits - fallbackCount(m);
export const FILTERED = RANKED.filter((m) => unitsAfterFallback(m) < G.trackAUnits);

/** 95% bootstrap interval of Track A AP (2,000 resamples, proof Figure 4a); same fallback as the Leaderboard. */
export const bootCI = (m: MethodResult): [number, number] => [m.bootAPLow ?? m.bootstrapMeanAP, m.bootAPHigh ?? m.bootstrapMeanAP];

export const METHOD_COUNT = LEADERBOARD_DATA.length;
/** Track F, 0.1% prevalence tier (proof Table 5): methods at or below the expr_threshold value. */
export const TRACK_F_LOW = 0.009;
export const TRACK_F_COLLAPSED = LEADERBOARD_DATA.filter((m) => m.trackF01AP <= TRACK_F_LOW).length;

export const fdr = (s: string) => s.replace(/\s*\(NS\)/, '');
export const signed = (v: number, d = 3) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(d)}`;

export const TRACKS = [...TRACKS_DATA]
  .map((t) => ({ ...t, letter: t.code.replace('Track ', '') }))
  .sort((a, b) => a.letter.localeCompare(b.letter));

/** Deep link into the Tracks explorer (the Tracks page reads `?track=`). */
export const trackLink = (letter: string) => `${href('/tracks')}?track=${letter.toLowerCase()}`;

export const DOI_NOTE = G.doiConfirmed ? '' : 'pending';
