# Plan: Round 5 — live heroes, per-page sub-sessions, Design-canvas previews

**Complexity**: Large · **Status**: user said proceed ("/plan and make perfect … now")

## Requirements (from the user)
1. Run one more critic loop (brief, craft, slop-monster) on live-site version 3 and fix what it finds.
2. Match the other design artifacts (VasthraShree Seller Hub canvas): a Design canvas with a "Start here" index,
   one canvas page per site page, and per page a high-fi artboard plus states artboards.
3. Redesign every hero: live, moving backgrounds (moving dots, layered live backgrounds, optional video loop via
   ElevenLabs/Higgsfield), more modern, full animation, best UI/UX motion.
4. One sub-session per page (10), each free to use subagents; every page/preview uses the full shared navbar.
5. Resume the smoke-test sub-session where it stopped (message sent).
6. Republish the live site artifact.

## Patterns to mirror
| Category | Source | Pattern |
|---|---|---|
| Page files | `src/pages/<Page>.tsx` + `src/pages/<page>/*` | one owner per page folder |
| Primitives | `src/ui/primitives.tsx`, `src/ui/index.ts` | shared, owned by the main session |
| Motion | `src/styles/tokens.css` (`rise`, loader keyframes, reduced-motion reset) | transform/opacity only |
| Art | `ThemedArt` light/dark pairs in `public/images/<page>-hero-*` | static fallback for live heroes |
| Canvas | Seller Hub `project/canvas.json` (pages, boards, notes, order) | index + per-page high-fi + states |
| Tests | none for frontend | verification = tsc, oxlint, renders, critics |

## Architecture
- **`LiveField` engine** (`src/ui/LiveField.tsx`, main session): one canvas renderer for animated dot fields.
  Theme-aware (reads CSS vars), DPR-aware, pauses off-screen (IntersectionObserver) and when the tab is hidden,
  static frame under `prefers-reduced-motion`. Pages pass a `layout` (points + behaviours); built-in layouts:
  `embedding`, `lanes`, `forest`, `specimens`, `flow`, `rings`, `grid`, `paths`. Pages may write their own.
- **`LiveHero`** (`src/ui/LiveHero.tsx`): composes layers back to front: static `ThemedArt` (poster frame and
  no-JS fallback) → `LiveField` → optional `<video>` loop (muted, playsInline, poster = art) → text slot.
- **Design canvas** "REACH Benchmark · Web" (new Design artifact): pages `index`, one per site page, `system`.
  The main session creates the canvas with the full index and placeholder boards; each page session then publishes
  only its own board files (re-read the index before changing its own entries; retry on refusal).

## Phases
1. Main: write this plan, build `LiveField` + `LiveHero`, verify one render (done before sessions start).
2. Main: create the Design canvas with index, notes, page list and placeholder boards.
3. Ten page sub-sessions (shared checkout, disjoint files), each:
   a. critic loop on its v3 page (brief, craft, slop-monster), b. redesign the hero with `LiveHero` + a page layout,
   c. fix sections, d. build canvas artboards (`<Page>-1-HiFi.dc.html` interactive page preview with full navbar
   and animated hero; `<Page>-2-States.dc.html` loading/empty/error/edge cases/mobile), e. tsc + oxlint + renders.
4. Main: integrate, run full checks, rebuild and republish the live site artifact; link both artifacts.

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| 10 sessions editing one checkout | High | strict file ownership; shared files only by main session |
| Canvas index write conflicts | Medium | pre-declared boards; sessions change only their entries; re-read and retry |
| Canvas animation cost / battery | Medium | pause off-screen + hidden tab; cap particles by viewport; DPR ≤ 2 |
| Motion sickness / a11y | Medium | reduced-motion static frame; no parallax on scroll by default |
| Video weight in artifact (16 MB page / 15 MB file) | Medium | ≤ 2 MB loops, webm+mp4, poster first; optional |
| Credits (ElevenLabs/Higgsfield) | Medium | canvas animation is primary; video only where it clearly adds value |

## Acceptance
- [ ] Every page hero is live (moving dots / layered fields), static under reduced motion, both themes, 320px+
- [ ] Critic findings for v3 fixed per page; tsc + oxlint clean; no em dashes
- [ ] Design canvas has index + 10 page sections with high-fi and states artboards, all with the full navbar
- [ ] Live site artifact republished; smoke-test session resumed
