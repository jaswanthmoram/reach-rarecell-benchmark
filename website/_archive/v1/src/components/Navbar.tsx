import React, { useState, useEffect } from 'react';
import {
  Dna,
  GitBranch,
  Database,
  Menu,
  X,
  ArrowUpRight,
  Trophy,
  Grid,
  Compass,
  Cpu,
  HardDrive,
  ShieldCheck,
  Image as ImageIcon,
  Terminal,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from 'lucide-react';
import { GLOBAL_STATS } from '../data/benchmarkData';

interface NavbarProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

interface NavGroup {
  groupLabel: string;
  items: {
    id: string;
    index: string;
    href: string;
    label: string;
    badge?: string;
    icon: React.FC<{ className?: string }>;
  }[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    groupLabel: 'BENCHMARK CORE',
    items: [
      { id: 'overview', index: '00', href: '#overview', label: 'Overview & Abstract', icon: Sparkles },
      { id: 'leaderboard', index: '01', href: '#leaderboard', label: 'Track A Leaderboard', badge: '10 Methods', icon: Trophy },
      { id: 'heatmap', index: '02', href: '#heatmap', label: '8×10 Cohort Matrix', badge: 'Table 6b', icon: Grid },
      { id: 'tracks', index: '03', href: '#tracks', label: '6 Tracks (A–F)', badge: '1,125 Units', icon: Compass },
    ],
  },
  {
    groupLabel: 'SYSTEM & COHORTS',
    items: [
      { id: 'architecture', index: '04', href: '#architecture', label: '12-Phase Pipeline', badge: '4-Arm Gate', icon: Cpu },
      { id: 'datasets', index: '05', href: '#datasets', label: '10 Cohorts & CNV', badge: '359.7k Cells', icon: HardDrive },
      { id: 'audit', index: '06', href: '#audit', label: '17-Method Audit', badge: 'Figure 3', icon: ShieldCheck },
    ],
  },
  {
    groupLabel: 'ARTIFACTS & EXTENSION',
    items: [
      { id: 'figures', index: '07', href: '#figures', label: 'Manuscript Figures', badge: '12 × 300 DPI', icon: ImageIcon },
      { id: 'reproduce', index: '08', href: '#reproduce', label: 'Register & Resume CLI', badge: '§3.8 + Snapshots', icon: Terminal },
      { id: 'citation', index: '09', href: '#citation', label: 'Zenodo & Citation', badge: '5 DOIs', icon: BookOpen },
    ],
  },
];

export const Navbar: React.FC<NavbarProps> = ({ sidebarCollapsed, onToggleSidebar }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>('overview');

  useEffect(() => {
    const sectionIds = NAV_GROUPS.flatMap((g) => g.items.map((item) => item.id));
    const handleScroll = () => {
      const scrollPos = window.scrollY + 140;
      let current = 'overview';
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollPos) {
          current = id;
        }
      }
      setActiveId(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Minimal Uncongested Top Header Bar (h-14) */}
      <header className="sticky top-0 z-50 h-14 border-b border-[#E4E4E7] bg-white/95 backdrop-blur-md">
        <div className="flex h-full items-center justify-between px-4 sm:px-6">
          {/* Left: Sidebar Toggle + Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="hidden lg:inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#E4E4E7] bg-[#FAFAFA] text-[#52525B] hover:border-[#0B0B0B] hover:text-[#0B0B0B] transition-colors"
              title={sidebarCollapsed ? 'Expand navigation rail' : 'Collapse navigation rail'}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>

            <a href="#overview" className="flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B0B0B] text-white group-hover:bg-[#2563EB] transition-colors">
                <Dna className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-extrabold tracking-[-0.02em] text-[#0B0B0B]">
                  REACH
                </span>
                <span className="rounded bg-[#F4F4F5] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#2563EB] border border-[#E4E4E7]">
                  v1.3.0
                </span>
                <span className="hidden md:inline-block text-xs text-[#71717A] font-medium">
                  Rare-Cell Evaluation Across Cancer Heterogeneity
                </span>
              </div>
            </a>
          </div>

          {/* Center-Right: Publication Status Pill */}
          <div className="hidden xl:flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] px-2.5 py-0.5 font-mono text-[11px] font-medium text-[#065F46] border border-[#A7F3D0]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#059669]" />
              {GLOBAL_STATS.journalCitation}
            </span>
            <span className="font-mono text-[11px] text-[#71717A] tabular-nums">
              359,739 cells · 1,125 units/method · 11,250 evaluations
            </span>
          </div>

          {/* Right: Quick Action Buttons + Mobile Menu Trigger */}
          <div className="flex items-center gap-2">
            <a
              href="#reproduce"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-[#EFF6FF] px-2.5 py-1.5 text-xs font-semibold text-[#1D4ED8] border border-[#BFDBFE] hover:bg-[#DBEAFE] transition-colors"
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Register / Resume CLI</span>
            </a>

            <a
              href={`https://github.com/${GLOBAL_STATS.githubRepo}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-[#18181B] border border-[#E4E4E7] hover:border-[#0B0B0B] transition-colors"
            >
              <GitBranch className="h-3.5 w-3.5 text-[#52525B]" />
              <span>GitHub</span>
            </a>

            <a
              href={`https://doi.org/${GLOBAL_STATS.zenodoConceptDoi}`}
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 rounded-lg bg-[#0B0B0B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2563EB] transition-colors"
              title="Zenodo Concept DOI (5 Deposits)"
            >
              <Database className="h-3.5 w-3.5" />
              <span>Zenodo</span>
              <ArrowUpRight className="h-3 w-3 opacity-80" />
            </a>

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="inline-flex lg:hidden items-center justify-center rounded-lg border border-[#E4E4E7] bg-white p-1.5 text-[#18181B] hover:bg-[#F4F4F5]"
              aria-label="Toggle Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Persistent Desktop Left Sidebar Rail */}
      <aside
        className={`fixed top-14 bottom-0 left-0 z-40 hidden lg:flex w-64 flex-col justify-between border-r border-[#E4E4E7] bg-white transition-transform duration-200 ${
          sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.groupLabel}>
              <div className="px-2.5 pb-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#71717A]">
                {group.groupLabel}
              </div>
              <nav className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeId === item.id;
                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      onClick={() => setActiveId(item.id)}
                      className={`group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#EFF6FF] text-[#1D4ED8] font-semibold shadow-2xs border border-[#BFDBFE]'
                          : 'text-[#3F3F46] hover:bg-[#F4F4F5] hover:text-[#0B0B0B] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`h-3.5 w-3.5 shrink-0 ${
                            isActive ? 'text-[#2563EB]' : 'text-[#71717A] group-hover:text-[#0B0B0B]'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge ? (
                        <span
                          className={`ml-2 shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] ${
                            isActive
                              ? 'bg-white text-[#1D4ED8] border border-[#BFDBFE]'
                              : 'bg-[#F4F4F5] text-[#71717A]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-[#A1A1AA]">{item.index}</span>
                      )}
                    </a>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom Sidebar Telemetry Card */}
        <div className="border-t border-[#E4E4E7] bg-[#FAFAFA] p-3.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#18181B] mb-2">
            <span>Empirical Summary</span>
            <span className="font-mono text-[10px] text-[#059669]">DOI: 1878538</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
            <div className="rounded bg-white px-2 py-1.5 border border-[#E4E4E7]">
              <div className="text-[#71717A]">Top Overall</div>
              <div className="font-bold text-[#0B0B0B]">hvg_logreg (1.000)</div>
            </div>
            <div className="rounded bg-white px-2 py-1.5 border border-[#E4E4E7]">
              <div className="text-[#71717A]">Top Published</div>
              <div className="font-bold text-[#2563EB]">FiRE #1 (0.313)</div>
            </div>
            <div className="rounded bg-white px-2 py-1.5 border border-[#E4E4E7]">
              <div className="text-[#71717A]">Top Excl-Degen</div>
              <div className="font-bold text-[#059669]">CaSee (0.606)</div>
            </div>
            <div className="rounded bg-white px-2 py-1.5 border border-[#E4E4E7]">
              <div className="text-[#71717A]">Track A vs B</div>
              <div className="font-bold text-[#D97706]">ρ = 0.042</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 top-14 z-50 lg:hidden bg-black/25 backdrop-blur-xs" onClick={() => setMobileOpen(false)}>
          <div
            className="h-full w-72 max-w-[85vw] bg-white border-r border-[#E4E4E7] p-4 overflow-y-auto flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              {NAV_GROUPS.map((group) => (
                <div key={group.groupLabel}>
                  <div className="px-2 pb-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#71717A]">
                    {group.groupLabel}
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <a
                          key={item.id}
                          href={item.href}
                          onClick={() => {
                            setActiveId(item.id);
                            setMobileOpen(false);
                          }}
                          className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-[#18181B] hover:bg-[#EFF6FF] hover:text-[#1D4ED8]"
                        >
                          <span className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5 text-[#2563EB]" />
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className="rounded bg-[#F4F4F5] px-1.5 py-0.5 font-mono text-[10px] text-[#52525B]">
                              {item.badge}
                            </span>
                          )}
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[#E4E4E7] flex gap-2">
              <a
                href={`https://doi.org/${GLOBAL_STATS.zenodoConceptDoi}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0B0B0B] px-3 py-2 text-xs font-semibold text-white"
              >
                <Database className="h-3.5 w-3.5" />
                Zenodo
              </a>
              <a
                href={`https://github.com/${GLOBAL_STATS.githubRepo}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#F4F4F5] px-3 py-2 text-xs font-semibold text-[#0B0B0B] border border-[#D4D4D8]"
              >
                <GitBranch className="h-3.5 w-3.5" />
                GitHub
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
