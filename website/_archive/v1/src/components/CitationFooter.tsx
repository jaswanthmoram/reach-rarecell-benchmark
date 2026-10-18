import React, { useState } from 'react';
import { BookOpen, Copy, Check, Dna, ExternalLink, GitBranch, Award } from 'lucide-react';

export const CitationFooter: React.FC = () => {
  const [format, setFormat] = useState<'bibtex' | 'apa' | 'cff'>('bibtex');
  const [copied, setCopied] = useState(false);

  const citations = {
    bibtex: `@article{satyajaswanth2026reach,
  title   = {REACH: a reproducible benchmark for inter-lineage rare malignant cell detection in single-cell RNA sequencing},
  author  = {Satya Jaswanth, Moram Venkata and Gavin, Amruthaluri and Aakash, Padarthi and Tejesh Kumar, Muttha and Dasgupta, Abhijit},
  journal = {Frontiers in Bioinformatics},
  year    = {2026},
  volume  = {6},
  pages   = {1878538},
  doi     = {10.3389/fbinf.2026.1878538},
  note    = {Zenodo Code & Data Suite: 10.5281/zenodo.19847108},
  url     = {https://github.com/Jaswanth-ak/reach-rarecell-benchmark}
}`,
    apa: `Satya Jaswanth, M. V., Gavin, A., Aakash, P., Tejesh Kumar, M., & Dasgupta, A. (2026). REACH: a reproducible benchmark for inter-lineage rare malignant cell detection in single-cell RNA sequencing. Frontiers in Bioinformatics, 6:1878538. https://doi.org/10.5281/zenodo.19847108`,
    cff: `cff-version: 1.2.0
title: "REACH: a reproducible benchmark for inter-lineage rare malignant cell detection in single-cell RNA sequencing"
version: 1.3.0
journal: "Frontiers in Bioinformatics"
volume: 6
article-number: 1878538
doi: 10.5281/zenodo.19847108
date-released: 2026-08-06
url: "https://github.com/Jaswanth-ak/reach-rarecell-benchmark"
license: MIT`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(citations[format]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer id="citation" className="bg-[#FAFAFA] text-[#3F3F46] pt-14 pb-12 border-t border-[#E4E4E7]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Citation Box */}
        <div className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-2xl p-6 mb-12 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-base sm:text-lg font-bold text-[#0B0B0B]">
                  Cite the REACH Benchmark Manuscript & Archival Suite
                </h3>
                <p className="text-xs font-mono text-[#52525B]">
                  Front. Bioinform. 6:1878538 (2026) • SRM University-AP • Zenodo DOI: 10.5281/zenodo.19847108
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-[#F4F4F5] p-1 rounded-xl border border-[#E4E4E7]">
                {(['bibtex', 'apa', 'cff'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setFormat(fmt)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono uppercase font-semibold transition-all ${
                      format === fmt
                        ? 'bg-[#0B0B0B] text-white shadow-2xs'
                        : 'text-[#3F3F46] hover:text-[#0B0B0B]'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors shadow-2xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Citation'}</span>
              </button>
            </div>
          </div>

          <pre className="p-4 rounded-xl bg-[#FAFAFA] border border-[#E4E4E7] text-xs font-mono text-[#0B0B0B] overflow-x-auto leading-relaxed">
            <code>{citations[format]}</code>
          </pre>
        </div>

        {/* Footer Links & Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-[#E4E4E7]">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#0B0B0B] flex items-center justify-center shadow-2xs">
                <Dna className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-display text-base font-extrabold text-[#0B0B0B] tracking-tight">
                  REACH Benchmark
                </span>
                <span className="ml-2 px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                  Front. Bioinform. 6:1878538
                </span>
              </div>
            </div>
            <p className="text-xs text-[#3F3F46] leading-relaxed max-w-md mb-3">
              Rare-cell Evaluation Across Cancer Heterogeneity (REACH) benchmarks 10 computational methods across 10 curated scRNA-seq cancer datasets (359,739 cells), 6 evaluation tracks (A–F), and 11,250 empirical evaluations.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#FFFFFF] border border-[#E4E4E7] text-[11px] font-mono text-[#3F3F46] shadow-2xs">
              <Award className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Department of CSE & AI Technology Institute, SRM University-AP</span>
            </div>
          </div>

          <div className="md:col-span-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#0B0B0B] mb-2.5">
              Portal Navigation
            </h4>
            <ul className="space-y-1.5 text-xs font-medium">
              <li>
                <a href="#overview" className="hover:text-[#2563EB] transition-colors">
                  00 // Overview & Scale Telemetry
                </a>
              </li>
              <li>
                <a href="#leaderboard" className="hover:text-[#2563EB] transition-colors">
                  01 // Leaderboard (Overall & Role Ranks)
                </a>
              </li>
              <li>
                <a href="#heatmap" className="hover:text-[#2563EB] transition-colors">
                  02 // 8×10 Cohort × Method Matrix
                </a>
              </li>
              <li>
                <a href="#tracks" className="hover:text-[#2563EB] transition-colors">
                  03 // 6 Evaluation Tracks (A–F)
                </a>
              </li>
              <li>
                <a href="#architecture" className="hover:text-[#2563EB] transition-colors">
                  04 // 4-Arm Tiering & Circularity
                </a>
              </li>
              <li>
                <a href="#datasets" className="hover:text-[#2563EB] transition-colors">
                  05 // 10 Cohorts & Real CNV (57.8k)
                </a>
              </li>
              <li>
                <a href="#audit" className="hover:text-[#2563EB] transition-colors">
                  06 // Decision Rules & 17-Method Audit
                </a>
              </li>
              <li>
                <a href="#figures" className="hover:text-[#2563EB] transition-colors">
                  07 // 12-Figure Publication Atlas
                </a>
              </li>
              <li>
                <a href="#reproduce" className="hover:text-[#2563EB] transition-colors">
                  08 // Register Method & Snapshot Resume
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#0B0B0B] mb-2.5">
              Permanent Repositories & Zenodo DOIs
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://github.com/Jaswanth-ak/reach-rarecell-benchmark"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#0B0B0B] font-semibold hover:text-[#2563EB] transition-colors"
                >
                  <GitBranch className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>github.com/Jaswanth-ak/reach-rarecell-benchmark</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://doi.org/10.5281/zenodo.19847108"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#065F46] hover:text-[#059669] font-mono font-semibold transition-colors"
                >
                  <span>Part 1 (Code, Figures & Tables): 10.5281/zenodo.19847108</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://doi.org/10.5281/zenodo.19850652"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#1D4ED8] hover:text-[#2563EB] font-mono font-semibold transition-colors"
                >
                  <span>Part 2–4 (Processed Cohorts): 19850652 / 19850972 / 19851287</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://doi.org/10.5281/zenodo.19851710"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#1D4ED8] hover:text-[#2563EB] font-mono font-semibold transition-colors"
                >
                  <span>Part 5 (Large Cohorts CRC/LUAD): 10.5281/zenodo.19851710</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#71717A]">
          <div>
            © 2026 Satya Jaswanth, Gavin, Aakash, Tejesh Kumar and Dasgupta (Front. Bioinform. 6:1878538). MIT & CC-BY-4.0.
          </div>
          <div className="font-mono tabular-nums text-[11px] font-semibold text-[#52525B]">
            10 Cohorts • 359,739 Cells • 1,125 Benchmark Units • 11,250 Evaluations
          </div>
        </div>
      </div>
    </footer>
  );
};
