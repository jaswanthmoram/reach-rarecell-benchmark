import { Button, Container, Icon, Mark } from '../ui';
import { ROUTES, href, requestedPath, type RoutePath } from './router';
import { MOD_KEY, openCommandPalette } from './theme';

const SUGGEST: RoutePath[] = ['/leaderboard', '/tracks', '/docs', '/'];

/** Unknown hash: say what was asked for, offer the four most likely destinations and search. */
export default function NotFound() {
  const asked = requestedPath();
  return (
    <Container className="py-20 md:py-28">
      <div className="rise mx-auto flex max-w-[640px] flex-col items-center text-center">
        <span className="mb-6 grid size-20 place-items-center rounded-full border border-dashed border-line-strong bg-surface">
          <Mark size={44} found={false} />
        </span>
        <p className="label mb-3">No route · 404</p>
        <h1 className="balance text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-ink md:text-[2.5rem]">Nothing was found at this address</h1>
        <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-ink-2">
          The site has no page at <code className="rounded-chip border border-line bg-sunk px-1.5 py-0.5 font-mono text-[13px] text-ink [overflow-wrap:anywhere]">#{asked}</code>.
          The link may be from an older version. Search, or pick up from one of these:
        </p>
        <div className="mt-6">
          <Button onClick={() => openCommandPalette(asked.replace(/^\//, '').replace(/[-/]/g, ' '))} icon="magnifying-glass">
            Search the site <span className="font-mono text-[11px] opacity-70">{MOD_KEY} K</span>
          </Button>
        </div>
      </div>
      <ul className="mx-auto mt-12 grid max-w-[880px] gap-3 sm:grid-cols-2">
        {SUGGEST.map((p) => {
          const r = ROUTES.find((x) => x.path === p)!;
          return (
            <li key={p}>
              <a href={href(p)} className="group flex h-full items-start gap-3 rounded-card border border-line bg-surface p-4 transition-colors duration-150 hover:border-line-strong">
                <span className="grid size-9 shrink-0 place-items-center rounded-chip border border-line text-ink-3 transition-colors duration-150 group-hover:text-ink"><Icon name={r.icon} size={18} /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-ink">{r.label}<Icon name="arrow-right" size={13} className="text-ink-3 transition-transform duration-150 group-hover:translate-x-0.5" /></span>
                  <span className="mt-0.5 block text-xs leading-snug text-ink-2">{r.desc}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </Container>
  );
}
