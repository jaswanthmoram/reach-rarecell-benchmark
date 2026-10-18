import type { ReactNode } from 'react';
import { Icon, type IconName } from '../../ui';
import { SysSection } from './kit';

type Rule = { title: string; icon: IconName; dos: ReactNode[]; donts: ReactNode[]; source: string };

const C = ({ children }: { children: ReactNode }) => <code className="rounded-[3px] bg-sunk px-1 font-mono text-[12px] text-ink">{children}</code>;

const RULES: Rule[] = [
  {
    title: 'Ranking', icon: 'ranking', source: 'Proof Table 4 note, p. 11',
    dos: [
      'Rank only the six published detectors, 1 to 6 by median Track A AP: FiRE, CellSIUS, scMalignantFinder (proxy), RareQ, scCAD, DeepScena.',
      'Call FiRE “the highest median AP among the ranked published detectors”.',
      <>State the FiRE vs expr_threshold result in full, with its BH-FDR value, on Home and Leaderboard only. Elsewhere link to it: “See pairwise tests” with <C>href(&apos;/leaderboard&apos;)</C>.</>,
      'Say “no significant difference”, “overlapping middle band”, “practically indistinguishable”.',
    ],
    donts: [
      'No rank number on a reference method. No “#1 overall”, no winner badge, no shared-place wording (the paper never uses it).',
      'No “best value” signal dot on any ranked number.',
    ],
  },
  {
    title: 'Method order and marks', icon: 'list-numbers', source: 'Proof Table 4 · Figure 4b',
    dos: [
      'One order in every list, chart, heatmap row or column, matrix axis and legend: hvg_logreg (ceiling) first, then the ranked six by median AP, then CaSee, expr_threshold, random_baseline.',
      'Keep the ranked six contiguous. If the ceiling has no place in a view, drop it from that view.',
      <>The ceiling and the three references are dashed in every view, mobile cards included: <C>MethodDot dashed</C>, <C>CIBar dashed</C>, <C>MethodName reference</C>.</>,
    ],
    donts: [
      'No ceiling below the ranked block, and no reference row inside it.',
      'No all-10 rank positions or place shifts except in the one chart titled “Within-unit rank, all 10 methods (Figure 4b)”. A place-shift chart takes that title or shows AP.',
    ],
  },
  {
    title: 'Numbers', icon: 'hash', source: 'DESIGN.md page rules',
    dos: [
      'Every number has a denominator or a source: “160 of 1,125 units”, “2,000 resamples (Figure 4a)”.',
      <>AP to three decimals with <C>fmt.ap</C>, runtimes in seconds to one decimal with <C>fmt.secs</C>, counts with <C>fmt.int</C>, all table numbers tabular.</>,
      'State the ordering key and n in every caption. Mono labels are 11px or larger.',
      'If two sources disagree, show the paper’s number and footnote the other.',
    ],
    donts: ['No bare hero numerals. No invented or rounded-up numbers.', 'Leaderboard ranks are inter-lineage: never present them as evidence for intra-lineage detection (Track F).'],
  },
  {
    title: 'Copy', icon: 'file-text', source: 'DESIGN.md v2.1 · tastemaker',
    dos: [
      'Plain, precise, scientific. Short sentences. Say what the thing is. Controls name their action.',
      <>Greek inside a <C>.label</C> is wrapped in <C>normal-case</C> so ρ, δ and χ² survive uppercase.</>,
      'Errors say what failed and how to recover. Empty states name the next action.',
      'One “DOI pending” per viewport: a badge on the DOI itself, plain text elsewhere.',
    ],
    donts: ['No em dashes in shipped copy: use a period, colon, comma or parentheses.', 'No “X, not Y” contrast lines. No caption that only describes what a figure plainly shows.', 'No hype words, no emoji.'],
  },
  {
    title: 'Labels, numbering, callouts', icon: 'squares-four', source: 'DESIGN.md page rules',
    dos: [
      <>A <C>PageHeader</C> or <C>Section</C> label carries what the heading lacks: a table name, a figure number, a unit count.</>,
      'Number items (01, 02, 03) only when they form a real sequence: pipeline phases, Docs steps.',
      'Callouts take a 1px hairline and a tint, or stay plain text.',
    ],
    donts: [
      'No label that restates the heading or exposes a process note (“Prototype · compare”, “proto-personas”, “Get started · 01”).',
      'No coloured left-border accent stripe on a callout.',
    ],
  },
  {
    title: 'Colour and marks', icon: 'target', source: 'DESIGN.md tokens',
    dos: [
      'Tokens only. Gray first, one accent (links, focus, selection), signal for the rare-cell motif only.',
      <>Method colour on marks only (<C>MethodDot</C>, <C>CIBar color</C>). Names stay ink. Same method, same colour, every page.</>,
      'Tracks are letter chips A to F.',
    ],
    donts: ['Signal never marks status, links or a best value.', 'Status colours are for audit and QC states only.'],
  },
  {
    title: 'Art and figures', icon: 'images-square', source: 'DESIGN.md v2.1, v2.2',
    dos: [
      <>Every illustration ships as a light and dark pair. Render with <C>PageHeader art</C> (it draws its own 8px card) or <C>ThemedArt</C>.</>,
      'Paper figures are evidence: shown on a #fafafa sheet in both themes, labelled “Figure N · Frontiers 2026”.',
      'The Figures page shows only the six published figures.',
    ],
    donts: ['No light art panel in dark mode, no text in art, no stock photos, 3D or glow.', 'Pipeline PNGs are not shown: they contradict the proof in places.'],
  },
  {
    title: 'Links and motion', icon: 'link', source: 'Router · DESIGN.md motion',
    dos: [
      <>Links to pages use <C>href(&apos;/tracks&apos;, &apos;track=f&apos;)</C>. In-page jumps use a button with <C>scrollIntoView</C>, or <C>navigate(path, {'{ anchor }'})</C> across pages.</>,
      <>Transform and opacity only; 150ms feedback, 300ms disclosure. The hero keeps one 600ms <C>rise</C>. <C>.reveal</C> is a no-op: content does not fade in on scroll.</>,
      <>Heroes move through <C>LiveHero</C> or <C>LiveField</C>: graphite cells, one signal colour for the found cell, a scrim behind the text. Paused off-screen; reduced motion draws one still frame.</>,
    ],
    donts: [<>Never <C>href=&quot;#section&quot;</C>: the hash belongs to the router.</>, 'Nothing loops without reduced-motion handling. Nothing animates layout properties.', 'No method colours, video text or sound in a hero field. No scroll-jacking.'],
  },
];

export function Rules() {
  return (
    <SysSection id="rules" title="Page rules" lead="The rules every page follows. The ranking and ordering rules follow how the paper itself reports the results.">
      <div className="grid gap-4 lg:grid-cols-2">
        {RULES.map((r) => (
          <article key={r.title} className="flex flex-col rounded-card border border-line bg-surface">
            <header className="flex items-center gap-3 border-b border-line px-5 py-3.5">
              <Icon name={r.icon} size={18} className="text-ink-3" />
              <h3 className="text-base font-semibold tracking-[-0.01em] text-ink">{r.title}</h3>
              <span className="ml-auto hidden font-mono text-[11px] text-ink-3 sm:inline">{r.source}</span>
            </header>
            <div className="grid flex-1 gap-5 px-5 py-4">
              <ul className="flex flex-col gap-2.5">
                {r.dos.map((d, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink"><Icon name="check" size={14} className="mt-[3px] shrink-0 text-ok" /><span>{d}</span></li>
                ))}
              </ul>
              <ul className="flex flex-col gap-2.5 border-t border-dashed border-line pt-4">
                {r.donts.map((d, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-2"><Icon name="x" size={14} className="mt-[3px] shrink-0 text-bad" /><span>{d}</span></li>
                ))}
              </ul>
            </div>
            <p className="border-t border-line px-5 py-2.5 font-mono text-[11px] text-ink-3 sm:hidden">{r.source}</p>
          </article>
        ))}
      </div>
    </SysSection>
  );
}
