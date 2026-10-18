import { useState, type ReactNode, type CSSProperties } from 'react';
import { Icon } from './Icon';
import type { IconName } from './iconNames';
import { Container } from './Layout';
import { useToast } from './toastContext';
import { asset, methodColor } from './util';


const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/* ---------- Layout ---------- */
interface SectionProps { id?: string; label?: string; title?: ReactNode; lead?: ReactNode; children?: ReactNode; className?: string; aside?: ReactNode }
export function Section({ id, label, title, lead, children, className, aside }: SectionProps) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined} className={cx('py-16 md:py-24', className)}>
      <Container>
        {(label || title) && (
          <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-[68ch]">
              {label && <p className="label mb-3">{label}</p>}
              {title && <h2 id={id ? `${id}-h` : undefined} className="text-2xl font-semibold tracking-[-0.02em] text-ink md:text-4xl">{title}</h2>}
              {lead && <p className="mt-4 text-base leading-relaxed text-ink-2 md:text-lg">{lead}</p>}
            </div>
            {aside}
          </div>
        )}
        {children}
      </Container>
    </section>
  );
}

/**
 * Theme-aware art: `base` is a path without suffix; loads `<base>-light.webp` / `<base>-dark.webp`.
 * A file that fails to load is removed (no broken-image icon); `onFail` lets a parent drop the frame too.
 */
export function ThemedArt({ base, alt, size, className, eager, onFail, style }: { base: string; alt: string; size: [number, number]; className?: string; eager?: boolean; onFail?: () => void; style?: CSSProperties }) {
  const [failed, setFailed] = useState<{ light?: boolean; dark?: boolean }>({});
  const common = { style, width: size[0], height: size[1], loading: eager ? ('eager' as const) : ('lazy' as const), decoding: 'async' as const };
  const fail = (k: 'light' | 'dark') => () => { setFailed((f) => ({ ...f, [k]: true })); onFail?.(); };
  return (
    <>
      {!failed.light && <img src={asset(`${base}-light.webp`)} alt={alt} {...common} onError={fail('light')} className={cx('dark:hidden', className)} />}
      {!failed.dark && <img src={asset(`${base}-dark.webp`)} alt={alt} {...common} onError={fail('dark')} className={cx('hidden dark:block', className)} />}
    </>
  );
}

interface PageHeaderProps { label: string; title: ReactNode; lead: ReactNode; art?: string; artAlt?: string; artSize?: [number, number]; children?: ReactNode; titleAs?: 'h1' | 'h2'; artFocus?: { scale: number; x: number } }
/**
 * Interior page header. Compact on purpose: the working surface must start by ~300px at 1440x900.
 * Art sits in an 8px hairline card inside the container (never bleeding to the viewport edge or under the nav),
 * cropped toward its focal subject on the right. Phones get the same card, full width and shorter, above the text.
 * If the art file is missing the card is dropped. Only Home gets a display-size hero.
 * `titleAs="h2"` is for previews (the System page), never for a page.
 */
export function PageHeader({ label, title, lead, art, artAlt = '', artSize = [1600, 900], children, titleAs = 'h1', artFocus = { scale: 1.4, x: 88 } }: PageHeaderProps) {
  const [artFailed, setArtFailed] = useState(false);
  const showArt = Boolean(art) && !artFailed;
  const Title = titleAs;
  const square = artSize[0] === artSize[1];
  return (
    <header className="border-b border-line">
      <Container className={cx('grid gap-6 py-8 md:py-10', showArt && 'md:grid-cols-[minmax(0,1fr)_340px] md:items-center md:gap-10 lg:grid-cols-[minmax(0,1fr)_400px]')}>
        {showArt && art && (
          <figure className="rise order-first overflow-hidden rounded-card border border-line md:order-last [animation-delay:80ms]">
            <ThemedArt base={art} alt={artAlt} size={artSize} eager onFail={() => setArtFailed(true)}
              className={cx('w-full object-cover', square ? 'aspect-[16/7] object-center md:aspect-[16/10]' : 'aspect-[16/7] object-cover md:aspect-[16/10]')}  style={square ? undefined : { transform: `scale(${artFocus.scale})`, transformOrigin: `${artFocus.x}% 50%` }} />
          </figure>
        )}
        <div className="rise min-w-0 max-w-[640px]">
          <p className="label mb-3">{label}</p>
          <Title className="balance text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-ink md:text-[2.5rem]">{title}</Title>
          <p className="mt-3 max-w-[62ch] text-base leading-relaxed text-ink-2">{lead}</p>
          {children && <div className="mt-5 flex flex-wrap gap-2">{children}</div>}
        </div>
      </Container>
    </header>
  );
}

/** Method identity: a coloured mark beside the (ink) name. Colour never carries meaning alone. */
export function MethodDot({ id, size = 8, dashed }: { id: string; size?: number; dashed?: boolean }) {
  return dashed
    ? <span aria-hidden="true" className="inline-block shrink-0 rounded-full border-[1.5px] border-dashed" style={{ width: size + 2, height: size + 2, borderColor: methodColor(id) }} />
    : <span aria-hidden="true" className="inline-block shrink-0 rounded-full" style={{ width: size, height: size, background: methodColor(id) }} />;
}
export function MethodName({ id, name, reference, className }: { id: string; name: string; reference?: boolean; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-2 font-mono text-[13px] text-ink', className)}>
      <MethodDot id={id} dashed={reference} />{name}
    </span>
  );
}

/* ---------- Actions ---------- */
type BtnVariant = 'primary' | 'secondary' | 'ghost';
interface ButtonProps { children: ReactNode; href?: string; onClick?: () => void; variant?: BtnVariant; size?: 'sm' | 'md'; icon?: IconName; iconRight?: IconName; external?: boolean; className?: string; ariaLabel?: string; disabled?: boolean; type?: 'button' | 'submit' }
const BTN: Record<BtnVariant, string> = {
  primary: 'bg-ink text-canvas hover:bg-ink/85',
  secondary: 'border border-line-strong bg-surface text-ink hover:border-ink/40',
  ghost: 'text-ink-2 hover:bg-sunk hover:text-ink',
};
export function Button({ children, href, onClick, variant = 'primary', size = 'md', icon, iconRight, external, className, ariaLabel, disabled, type = 'button' }: ButtonProps) {
  const cls = cx(
    'group inline-flex items-center justify-center gap-2 rounded-chip font-medium transition-[background,border,color,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-45',
    size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm',
    BTN[variant], className,
  );
  const inner = (
    <>
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 14 : 16} className="transition-transform duration-150 group-hover:translate-x-0.5" />}
    </>
  );
  if (href) return <a href={href} className={cls} aria-label={ariaLabel} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>{inner}</a>;
  return <button type={type} onClick={onClick} disabled={disabled} className={cls} aria-label={ariaLabel}>{inner}</button>;
}

/** Copies `text`. Inline "Copied" swap always; pass `toast` to also raise a toast (`true` = default wording). */
export function CopyButton({ text, label = 'Copy', toast }: { text: string; label?: string; toast?: boolean | string }) {
  const [done, setDone] = useState(false);
  const notify = useToast();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true); setTimeout(() => setDone(false), 1600);
      if (toast) notify({ title: typeof toast === 'string' ? toast : 'Copied to clipboard', tone: 'ok' });
    } catch {
      setDone(false);
      if (toast) notify({ title: 'Copy failed', description: 'The browser blocked clipboard access. Select the text and copy it by hand.', tone: 'bad' });
    }
  };
  return (
    <button type="button" onClick={copy} className="relative inline-flex h-7 items-center gap-1.5 rounded-chip px-2 before:absolute before:-inset-y-2 before:inset-x-0 before:content-[''] text-xs font-medium text-ink-2 transition-colors hover:bg-sunk hover:text-ink" aria-live="polite">
      <Icon name={done ? 'check' : 'copy'} size={13} className={done ? 'text-ok' : ''} />
      {done ? 'Copied' : label}
    </button>
  );
}

/* ---------- Display ---------- */
type BadgeTone = 'neutral' | 'accent' | 'ok' | 'warn' | 'bad' | 'signal';
const TONE: Record<BadgeTone, string> = {
  neutral: 'border-line bg-sunk text-ink-2',
  accent: 'border-accent/25 bg-accent-tint text-accent-ink',
  ok: 'border-ok/25 text-ok',
  warn: 'border-warn/30 text-warn',
  bad: 'border-bad/30 text-bad',
  signal: 'border-signal/30 bg-signal-tint text-signal',
};
export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: BadgeTone; className?: string }) {
  return <span className={cx('inline-flex h-5 items-center gap-1 whitespace-nowrap rounded-chip border px-1.5 font-mono text-[11px] leading-none', TONE[tone], className)}>{children}</span>;
}

/** Track letter chip: tracks are letters, never colours. */
export function TrackChip({ letter, className }: { letter: string; className?: string }) {
  return <span className={cx('inline-grid size-6 place-items-center rounded-chip border border-line-strong bg-surface font-mono text-xs font-semibold text-ink', className)}>{letter}</span>;
}

/** Never a bare number: label → value → context. */
export function Stat({ label, value, context, href }: { label: ReactNode; value: ReactNode; context: ReactNode; href?: string }) {
  return (
    <div className="flex flex-col gap-2 border-t border-line pt-4">
      <span className="label">{label}</span>
      <span className="text-3xl font-semibold tracking-[-0.03em] text-ink tabular md:text-4xl">{value}</span>
      <span className="text-xs leading-snug text-ink-2">{href ? <a href={href} className="underline decoration-line-strong underline-offset-2 hover:text-accent">{context}</a> : context}</span>
    </div>
  );
}

export function Card({ children, className, href }: { children: ReactNode; className?: string; href?: string }) {
  const cls = cx('block rounded-card border border-line bg-surface p-5 transition-colors duration-150', href && 'hover:border-line-strong focus-visible:border-accent', className);
  return href ? <a href={href} className={cls}>{children}</a> : <div className={cls}>{children}</div>;
}

export function CodeBlock({ code: raw, lang = 'bash', title }: { code: string; lang?: string; title?: string }) {
  const code = raw.replace(/^\n+|\s+$/g, '');
  return (
    <div className="overflow-hidden rounded-card border border-line bg-sunk dark:border-line-strong dark:bg-surface">
      <div className="flex items-center justify-between border-b border-line px-3 py-1.5 dark:border-line-strong">
        <span className="label">{title ?? lang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-ink"><code>{code.split('\n').map((line, i) => {
        // Shell comments read as secondary text so the commands stand out.
        const at = line.search(/(^|\s)#\s/);
        return <span key={i}>{i > 0 && '\n'}{at < 0 ? line : <>{line.slice(0, at)}<span className="text-ink-3">{line.slice(at)}</span></>}</span>;
      })}</code></pre>
    </div>
  );
}

/** Segmented tabs (role=tablist, arrow-key navigation). */
export function Tabs<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  const move = (dir: number) => {
    const i = options.findIndex((o) => o.value === value);
    onChange(options[(i + dir + options.length) % options.length].value);
  };
  return (
    <div role="tablist" aria-label={label} className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1 [scrollbar-width:none]"
      onKeyDown={(e) => { if (e.key === 'ArrowRight') move(1); if (e.key === 'ArrowLeft') move(-1); }}>
      {options.map((o) => (
        <button key={o.value} role="tab" type="button" aria-selected={o.value === value} tabIndex={o.value === value ? 0 : -1}
          onClick={() => onChange(o.value)}
          className={cx('h-8 shrink-0 whitespace-nowrap rounded-full px-3 text-xs font-medium transition-colors duration-150', o.value === value ? 'bg-ink text-canvas' : 'text-ink-2 hover:text-ink')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Value dot + interval whisker on a shared domain. The leaderboard differentiator:
 * overlapping intervals read as ties, so no single row is crowned.
 */
export function CIBar({ value, low, high, domain = [0, 1], highlight, label, color, dashed, className }: { value: number; low?: number; high?: number; domain?: [number, number]; highlight?: boolean; label: string; color?: string; dashed?: boolean; className?: string }) {
  const pct = (v: number) => Math.max(0, Math.min(100, ((v - domain[0]) / (domain[1] - domain[0])) * 100));
  const mark = color ?? (highlight ? 'var(--accent)' : 'var(--ink-2)');
  const hasCI = low !== undefined && high !== undefined;
  return (
    <div className={cx('relative h-5 w-full min-w-16', className)} role="img" aria-label={label}>
      <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
      {hasCI && (
        <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full opacity-35"
          style={{ left: `${pct(low)}%`, width: `max(2px, ${pct(high) - pct(low)}%)`, background: mark }} />
      )}
      {hasCI && [low, high].map((v, i) => (
        <div key={i} className="absolute top-1/2 h-2.5 w-px -translate-y-1/2" style={{ left: `${pct(v)}%`, background: mark }} />
      ))}
      <div className={cx('absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface', dashed && 'border-[1.5px] border-dashed bg-surface')}
        style={{ left: `${pct(value)}%`, ...(dashed ? { borderColor: mark } : { background: mark }) }} />
    </div>
  );
}
