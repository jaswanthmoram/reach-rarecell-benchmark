import { useState } from 'react';
import { Button, EmptyState, Section, Stat, asset, fmt, useToast } from '../ui';
import { href } from '../app/router';
import { DATASET_METHOD_MATRIX, GLOBAL_STATS as G, LEADERBOARD_DATA, PAIRWISE_COMPARISONS } from '../data/benchmarkData';
import {
  BOARD_ORDER, GROUPS, compactP, isDefaultState, isReference, selectRows,
  type Group, type SortState, type Tier, type ViewId,
} from './leaderboard/model';
import { TableFoot, Toolbar } from './leaderboard/Toolbar';
import { RankTable } from './leaderboard/RankTable';
import { RankUncertainty } from './leaderboard/RankUncertainty';
import { CliffGrid, DatasetHeatmap, PairwiseList } from './leaderboard/Heatmaps';
import { downloadCsv, isFramed, toCsv } from './leaderboard/csv';
import { LeaderboardHero } from './leaderboard/Hero';

const ALL_GROUPS = new Set<Group>(GROUPS.map((g) => g.value));
const jump = (id: string) => () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/* Numbers quoted in copy, read from the data file. */
const vsFiRE = (b: string) => PAIRWISE_COMPARISONS.find((p) => p.methodA === 'FiRE' && p.methodB === b)?.pAdjusted ?? 'n/a';
const FDR = (b: string) => compactP(vsFiRE(b));
const FDR_EXPR = FDR('expr_threshold');
const FDR_SCMF = FDR('scMalignantFinder');
const NS_COUNT = PAIRWISE_COMPARISONS.filter((p) => !p.significant).length;
const COHORTS = new Set(DATASET_METHOD_MATRIX.map((c) => c.dataset)).size;

/** FiRE's weakest cohort and the best ranked detector there: the per-cohort lead quotes data, not the heading. */
const RANKED_IDS = BOARD_ORDER.filter((m) => !isReference(m)).map((m) => m.method);
const fireCells = DATASET_METHOD_MATRIX.filter((c) => c.method === 'FiRE' && c.meanAP !== null);
const FIRE_LOW = fireCells.reduce<(typeof fireCells)[number] | undefined>((a, c) => (!a || (c.meanAP ?? 1) < (a.meanAP ?? 1) ? c : a), undefined);
const BEST_THERE = FIRE_LOW && DATASET_METHOD_MATRIX
  .filter((c) => c.dataset === FIRE_LOW.dataset && RANKED_IDS.includes(c.method) && c.meanAP !== null)
  .sort((a, b) => (b.meanAP ?? 0) - (a.meanAP ?? 0))[0];

const linkBtn = 'font-medium text-ink underline decoration-line-strong underline-offset-2 transition-colors duration-150 hover:text-accent hover:decoration-accent';

/** How to read the table: marks first, then what the order does and does not settle. */
function ReadingLead() {
  return (
    <p className="mt-6 max-w-[68ch] text-sm leading-relaxed text-ink-2">
      Dots are bootstrap mean AP with 95% bootstrap intervals (2,000 resamples, Figure 4a), on the same axis as the chart above;
      dashed marks are the four unranked rows. Neighbouring rows stay unordered unless the{' '}
      <button type="button" onClick={jump('pairwise')} className={linkBtn}>pairwise tests</button> separate them, and every rank
      compares lineages, so it says nothing about intra-lineage performance (Track F).
    </p>
  );
}

function Board() {
  const [view, setView] = useState<ViewId>('overall');
  const [tier, setTier] = useState<Tier>('t1');
  const [sort, setSort] = useState<SortState | null>(null);
  const [groups, setGroups] = useState<Set<Group>>(ALL_GROUPS);
  const [query, setQuery] = useState('');
  const toast = useToast();

  const sel = { view, tier, sort, groups, query };
  const rows = selectRows(sel);

  const changeView = (v: ViewId) => { setView(v); setSort(null); };
  const toggleGroup = (g: Group) => setGroups((prev) => {
    const next = new Set(prev);
    if (next.has(g)) next.delete(g); else next.add(g);
    return next;
  });
  const reset = () => { setView('overall'); setTier('t1'); setSort(null); setGroups(ALL_GROUPS); setQuery(''); };
  const exportCsv = () => {
    const name = `reach-leaderboard-${view}${view === 'tier' ? `-${tier}` : ''}.csv`;
    try {
      if (isFramed()) throw new Error('framed');
      downloadCsv(toCsv(rows, view, tier), name);
      toast({ title: `Exported ${rows.length} rows as CSV`, description: name, tone: 'ok' });
    } catch {
      toast({
        title: 'Export is unavailable in this preview',
        description: 'Downloads are blocked here. Open the site in its own tab to save the CSV.',
        tone: 'bad',
      });
    }
  };

  return (
    <Section id="board" className="scroll-mt-16 !pb-12 !pt-2">
      <h2 id="board-h" className="sr-only">Leaderboard table</h2>
      <Toolbar view={view} onView={changeView} tier={tier} onTier={setTier} groups={groups} onToggleGroup={toggleGroup}
        query={query} onQuery={setQuery} />

      {rows.length === 0 ? (
        <EmptyState className="mt-6" icon="magnifying-glass"
          title={query.trim() ? <>No method matches &ldquo;{query.trim()}&rdquo;</> : 'No rows to show'}
          action={<Button variant="secondary" size="sm" onClick={reset}>Clear search and filters</Button>}>
          {query.trim()
            ? <>Search looks at method names, paradigms, mechanisms and roles{groups.size < GROUPS.length ? ', inside the groups that are switched on' : ''}. Try a shorter term such as &ldquo;graph&rdquo; or &ldquo;baseline&rdquo;.</>
            : 'Both row groups are switched off. Turn one back on to see the board.'}
        </EmptyState>
      ) : view === 'rank' ? (
        <RankUncertainty rows={rows} />
      ) : (
        <RankTable rows={rows} view={view} tier={tier} sort={sort} onSort={setSort} />
      )}

      <TableFoot view={view} tier={tier} shown={rows.length} total={LEADERBOARD_DATA.length}
        onExport={exportCsv} onReset={reset} canReset={!isDefaultState(sel)} canExport={rows.length > 0} />
      {view !== 'rank' && <ReadingLead />}
    </Section>
  );
}

function GlobalTests() {
  return (
    <Section id="omnibus" label="Global tests" title="Do the methods differ at all?" className="!py-16 md:!py-20"
      lead={`Before any pairwise claim: do within-unit ranks differ across the ${G.friedmanN} common Track A units, and does the synthetic track predict the patient track?`}>
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={<>Friedman <span className="normal-case">χ²</span></>} value={G.friedmanChi2.toFixed(2)}
          context={<>df 9 · p {G.friedmanPAsPrinted} as printed · N = {G.friedmanN} units, k = {G.methodsIncluded} methods. Ranks differ.</>} />
        <Stat label="Iman–Davenport F" value={G.imanDavenportF.toFixed(2)}
          context={<>df 9 and 1,251 · p {G.imanDavenportPAsPrinted}. Agrees with Friedman.</>} />
        <Stat label="Nemenyi critical difference" value={G.nemenyiCD.toFixed(2)}
          context="Mean ranks closer than this cannot be separated (Figure 4b)." />
        <Stat label={<>Spearman <span className="normal-case">ρ</span>, Track B vs A</>} value={G.trackABSpearmanRho.toFixed(3)}
          context={<>p = {G.trackABSpearmanP.toFixed(3)}. The synthetic rank does not predict the patient rank.</>} />
      </div>
    </Section>
  );
}

const PAPER_FIGURES = [
  {
    n: 3, src: 'figures/paper/fig-3.webp', w: 1391, h: 1409,
    title: 'Method audit, Track A leaderboard and multimetric summary',
    caption: '(a) Inclusion and QC audit of 17 candidate methods. (b) Track A AP per unit for all ten methods, ordered by median AP. (c) Multimetric summary: AP, AUROC, nAP, fallback and degenerate rates, runtime.',
  },
  {
    n: 4, src: 'figures/paper/fig-4.webp', w: 1653, h: 1975,
    title: 'Bootstrap AP intervals, critical-difference ranks and rarity tiers',
    caption: `(a) Bootstrap intervals on Track A AP. (b) Critical-difference view of within-unit ranks (CD = ${G.nemenyiCD}, N = ${G.friedmanN}). (c) AP across rarity tiers T1 to T4 and prevalence sensitivity.`,
  },
];

function PaperFigures() {
  return (
    <Section id="paper-figures" label="Published figures" title="The same results, as printed"
      lead={`Figures 3 and 4 of ${G.journalCitation}.`}
      aside={<Button variant="secondary" size="sm" href={href('/figures')} iconRight="arrow-right">All figures</Button>}>
      <div className="grid gap-6 md:grid-cols-2">
        {PAPER_FIGURES.map((f) => (
          <figure key={f.n} className="group flex flex-col overflow-hidden rounded-card border border-line bg-surface transition-colors duration-150 hover:border-line-strong">
            <a href={asset(f.src)} target="_blank" rel="noopener noreferrer"
              className="relative grid aspect-[5/6] place-items-center bg-[#fafafa] p-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent">
              <img src={asset(f.src)} alt={`Figure ${f.n}. ${f.title}. ${f.caption}`} width={f.w} height={f.h} loading="lazy" decoding="async"
                className="max-h-full w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]" />
              <span className="absolute bottom-3 right-3 rounded-chip border border-[#e2e4e8] bg-white/90 px-2 py-1 font-mono text-[11px] text-[#4a5160] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                Open full size
              </span>
            </a>
            <figcaption className="flex flex-col gap-1.5 border-t border-line p-4">
              <span className="label">Paper figure {f.n} · {G.journalShort} {G.year}</span>
              <span className="text-sm font-medium text-ink">{f.title}</span>
              <span className="text-sm leading-relaxed text-ink-2">{f.caption}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}

export default function Leaderboard() {
  const cohortNote = FIRE_LOW?.meanAP != null && BEST_THERE?.meanAP != null && BEST_THERE.method !== 'FiRE'
    ? ` FiRE, ranked 1 by median AP, scores ${fmt.ap(FIRE_LOW.meanAP)} on ${FIRE_LOW.dataset}, where ${BEST_THERE.method} scores ${fmt.ap(BEST_THERE.meanAP)}.`
    : '';
  return (
    <>
      <LeaderboardHero fdrExpr={FDR_EXPR} fdrScmf={FDR_SCMF} onJump={jump} />

      <Board />
      <div className="border-t border-line"><GlobalTests /></div>

      <div className="border-t border-line">
        <Section id="pairwise" label="Pairwise significance · Tables 6b and 7" title="Which differences hold up"
          lead={`Cliff's δ for every pair of methods (Table 7), and Wilcoxon signed-rank tests of every method against FiRE on the ${G.trackACommonUnits} common units (Table 6b), including FiRE against the naive expression-burden baseline. ${NS_COUNT} of the ${PAIRWISE_COMPARISONS.length} comparisons below are not significant.`}>
          <div className="grid min-w-0 grid-cols-1 gap-12">
            <CliffGrid />
            <PairwiseList />
          </div>
        </Section>
      </div>

      <div className="border-t border-line">
        <Section id="per-dataset" label={`Per-cohort mean AP · ${COHORTS} cohorts`} title="The order moves by cancer type"
          lead={`Mean AP for each solid-tumour cohort, 20 units each.${cohortNote}`}>
          <div className="grid min-w-0 grid-cols-1"><DatasetHeatmap /></div>
        </Section>
      </div>

      <div className="border-t border-line"><PaperFigures /></div>
    </>
  );
}
