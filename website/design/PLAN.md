# Plan: REACH website v2 — redesign from scratch

**Complexity**: Large · **Status**: approved by user ("progress accordingly"), in progress

## Summary
Replace the single-page v1 site (archived in `_archive/v1/`) with a multi-page static site built on a new
design system. Content stays sourced from `src/data/benchmarkData.ts`; paper figures stay in `public/figures/`.
Deploys unchanged via `.github/workflows/deploy-website.yml` (Vite build → GitHub Pages).

## Requirements
- New visual language, grounded in Refero + Mobbin references (`design/research/`).
- Design system: tokens (`src/styles/tokens.css`) + `design/DESIGN.md` + shared UI primitives.
- Pages: Home, Leaderboard, Tracks, Datasets, Methods, Figures, Docs, Cite.
- Generated hero/section imagery (Higgsfield, ElevenLabs creative); icons from Supericons (Phosphor family).
- Responsive 320–1920, light + dark, keyboard + reduced-motion safe.

## Patterns to mirror
| Category | Source | Pattern |
|---|---|---|
| Data | `src/data/benchmarkData.ts` | Typed `export const` arrays; pages read, never mutate |
| Build | `package.json` | `tsc -b && vite build`, oxlint |
| Deploy | `vite.config.ts` | `base` = `/reach-rarecell-benchmark/` in production |
| Tests | — | No frontend tests exist in v1; verification = build + lint + browser screenshots |

## Architecture
- Routing: hash router (~30 lines, no dependency) — GitHub Pages has no SPA rewrite, so `#/leaderboard` avoids 404s.
- Layout: `src/app/` (shell, router), `src/ui/` (primitives), `src/pages/<Page>.tsx` (one file per page).
- Icons: `public/icons.svg` sprite (Phosphor regular, chosen via Supericons) + `<Icon name>` component.

## Phases
1. Archive v1, scaffold shell + router + tokens. *(validate: `npm run build`)*
2. Research: Refero sites/styles, Mobbin web patterns → `design/research/*.md`.
3. Design system: tokens, DESIGN.md, primitives (Button, Badge, Card, Stat, Table, CodeBlock, Tabs, Figure).
4. Assets: hero + section images (Higgsfield/ElevenLabs), review at full size, optimise to WebP.
5. Pages: built in parallel by subagents, one page file each, all reading the same tokens/primitives.
6. Critique loop: brief / craft / system critics on rendered screenshots; fix biggest gap; repeat.
7. QA: 320/768/1024/1440 screenshots, both themes, a11y pass, build + lint green.

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| Parallel page builders drift from the system | High | Primitives + DESIGN.md land before pages; system-critic pass |
| Generated imagery looks like stock "AI science" | Medium | Brief images from real figure content; reject at full-size review |
| Hash routes hurt SEO | Low | Single canonical + meta per route via `document.title`; content is a research portal |
| Leaderboard table on mobile | Medium | Card-row fallback under 768px |

## Acceptance
- [ ] All 8 pages render with real data, no lorem
- [ ] `npm run build` + `npm run lint` pass
- [ ] Screenshots at 4 breakpoints × 2 themes reviewed
- [ ] Critics report no P0/P1 gaps
