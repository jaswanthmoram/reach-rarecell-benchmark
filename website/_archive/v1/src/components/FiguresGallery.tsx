import React, { useState } from 'react';
import { FIGURES_DATA, type FigureInfo } from '../data/benchmarkData';
import {
  Image as ImageIcon,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Sparkles,
} from 'lucide-react';

type CategoryFilter =
  | 'All'
  | 'Primary Results'
  | 'Cross-Track & Regimes'
  | 'Statistical Rigor'
  | 'Architecture & Diagnostics';

export const FiguresGallery: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [lightboxFig, setLightboxFig] = useState<FigureInfo | null>(null);

  const categories: CategoryFilter[] = [
    'All',
    'Primary Results',
    'Cross-Track & Regimes',
    'Statistical Rigor',
    'Architecture & Diagnostics',
  ];

  const filteredFigures =
    selectedCategory === 'All'
      ? FIGURES_DATA
      : FIGURES_DATA.filter((f) => f.category === selectedCategory);

  const handleNavigateLightbox = (dir: -1 | 1) => {
    if (!lightboxFig) return;
    const currentIndex = FIGURES_DATA.findIndex((f) => f.id === lightboxFig.id);
    const nextIndex = (currentIndex + dir + FIGURES_DATA.length) % FIGURES_DATA.length;
    setLightboxFig(FIGURES_DATA[nextIndex]);
  };

  return (
    <section id="figures" className="py-16 bg-[#FAFAFA] border-b border-[#E4E4E7]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#E4E4E7] text-[#52525B] text-[11px] font-mono font-semibold mb-3 shadow-2xs">
              <span className="text-[#2563EB] font-bold">07</span>
              <span className="text-[#D4D4D8]">//</span>
              <span>12-FIGURE PUBLICATION ATLAS (300 DPI • FRONTIERS PROOF)</span>
              <span className="text-[#D4D4D8]">•</span>
              <ImageIcon className="w-3.5 h-3.5 text-[#2563EB]" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B0B0B] tracking-tight">
              300-DPI Manuscript & Author’s Proof Figure Atlas
            </h2>
            <p className="mt-2 text-[#3F3F46] max-w-3xl text-sm leading-relaxed">
              Inspect all 12 high-resolution empirical figures from the Frontiers in Bioinformatics proof (`Front. Bioinform. 6:1878538`) and Phase 12 pipeline. Click any card for the full-screen 300-DPI lightbox.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 bg-[#F4F4F5] p-1 rounded-xl border border-[#E4E4E7] self-start">
            {categories.map((cat) => {
              const count =
                cat === 'All'
                  ? FIGURES_DATA.length
                  : FIGURES_DATA.filter((f) => f.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#0B0B0B] text-white shadow-2xs'
                      : 'text-[#3F3F46] hover:text-[#0B0B0B] hover:bg-[#FFFFFF]'
                  }`}
                >
                  {cat}{' '}
                  <span className="opacity-75 font-mono tabular-nums text-[10px]">
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Figure Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFigures.map((fig) => (
            <div
              key={fig.id}
              onClick={() => setLightboxFig(fig)}
              className="group cursor-pointer bg-[#FFFFFF] border border-[#E4E4E7] hover:border-[#0B0B0B] rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 shadow-xs hover:shadow-md"
            >
              <div>
                {/* Image Container (Seamless White Specimen Frame) */}
                <div className="relative h-52 bg-[#FFFFFF] p-3 flex items-center justify-center overflow-hidden border-b border-[#E4E4E7]">
                  <img
                    src={fig.src}
                    alt={`${fig.figNum}: ${fig.title}`}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain group-hover:scale-[1.03] transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-[#0B0B0B] text-white font-mono text-[11px] font-bold shadow-2xs">
                      {fig.figNum}
                    </span>
                    {fig.proofRef && (
                      <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] font-mono text-[10px] font-bold">
                        {fig.proofRef.replace(' (Author’s Proof)', '')}
                      </span>
                    )}
                  </div>
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] text-[10px] font-mono font-semibold border border-[#BFDBFE]">
                    {fig.category}
                  </div>
                  <div className="absolute inset-0 bg-[#0B0B0B]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B0B0B] text-white text-xs font-bold shadow-lg">
                      <Maximize2 className="w-3.5 h-3.5" />
                      Inspect 300-DPI Figure
                    </span>
                  </div>
                </div>

                {/* Text Metadata */}
                <div className="p-4">
                  <h3 className="font-display text-sm sm:text-base font-bold text-[#0B0B0B] group-hover:text-[#2563EB] transition-colors leading-snug">
                    {fig.title}
                  </h3>
                  <p className="text-[11px] font-mono text-[#2563EB] mt-0.5 font-medium">
                    {fig.subtitle}
                  </p>
                  <p className="text-xs text-[#3F3F46] mt-2 line-clamp-2 leading-relaxed">
                    {fig.description}
                  </p>
                </div>
              </div>

              {/* Key Takeaway Footer */}
              <div className="px-4 pb-4 pt-2.5 border-t border-[#E4E4E7] bg-[#FAFAFA]">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#D97706] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#3F3F46] font-medium leading-relaxed">
                    <span className="text-[#92400E] font-mono font-bold uppercase">
                      Takeaway:{' '}
                    </span>
                    {fig.keyTakeaway}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal (Clean Architectural Light Mode) */}
        {lightboxFig && (
          <div
            className="fixed inset-0 z-50 bg-[#0B0B0B]/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => setLightboxFig(null)}
          >
            <div
              className="relative max-w-6xl w-full bg-[#FFFFFF] border border-[#E4E4E7] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between px-6 py-4 bg-[#FAFAFA] border-b border-[#E4E4E7]">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded bg-[#0B0B0B] text-white font-mono text-xs font-bold">
                    {lightboxFig.figNum}
                  </span>
                  {lightboxFig.proofRef && (
                    <span className="px-2.5 py-1 rounded bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] font-mono text-xs font-bold hidden sm:inline-block">
                      {lightboxFig.proofRef}
                    </span>
                  )}
                  <div>
                    <h3 className="font-display text-sm sm:text-base font-bold text-[#0B0B0B]">
                      {lightboxFig.title}
                    </h3>
                    <p className="text-xs font-mono text-[#52525B] hidden sm:block">
                      {lightboxFig.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleNavigateLightbox(-1)}
                    className="p-2 rounded-lg bg-[#FFFFFF] border border-[#E4E4E7] hover:bg-[#F4F4F5] text-[#0B0B0B] transition-colors"
                    title="Previous Figure"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigateLightbox(1)}
                    className="p-2 rounded-lg bg-[#FFFFFF] border border-[#E4E4E7] hover:bg-[#F4F4F5] text-[#0B0B0B] transition-colors"
                    title="Next Figure"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <a
                    href={lightboxFig.src}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0B0B0B] hover:bg-[#2563EB] text-xs font-semibold text-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Download PNG</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setLightboxFig(null)}
                    className="p-2 rounded-lg bg-[#FFF1F2] border border-[#FECDD3] hover:bg-[#FECDD3] text-[#9F1239] transition-colors"
                    title="Close Lightbox"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Image Viewport */}
              <div className="flex-1 overflow-auto bg-[#FFFFFF] p-6 flex items-center justify-center min-h-[320px]">
                <img
                  src={lightboxFig.src}
                  alt={lightboxFig.title}
                  className="max-h-[62vh] w-auto object-contain mx-auto"
                />
              </div>

              {/* Modal Caption Footer */}
              <div className="p-5 bg-[#FAFAFA] border-t border-[#E4E4E7] grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                <div className="lg:col-span-8">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#52525B] mb-1">
                    Empirical Caption & Protocol Context
                  </div>
                  <p className="text-xs sm:text-sm text-[#3F3F46] leading-relaxed">
                    {lightboxFig.description}
                  </p>
                </div>
                <div className="lg:col-span-4 p-3.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A]">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#92400E] font-bold mb-1">
                    Key Empirical Takeaway
                  </div>
                  <p className="text-xs text-[#92400E] leading-relaxed">
                    {lightboxFig.keyTakeaway}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
