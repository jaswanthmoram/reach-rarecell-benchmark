import React, { useState } from 'react';
import { METHOD_AUDIT_DATA, PRACTITIONER_SCENARIOS } from '../data/benchmarkData';
import {
  Compass,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Filter,
  Sparkles,
  AlertOctagon,
  Image as ImageIcon,
} from 'lucide-react';

export const MethodAuditSection: React.FC = () => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    PRACTITIONER_SCENARIOS[0].id
  );
  const [auditFilter, setAuditFilter] = useState<'all' | 'included' | 'excluded'>('all');
  const [showFig3, setShowFig3] = useState(false);

  const activeScenario =
    PRACTITIONER_SCENARIOS.find((s) => s.id === selectedScenarioId) ||
    PRACTITIONER_SCENARIOS[0];

  const filteredAudit = METHOD_AUDIT_DATA.filter((entry) => {
    if (auditFilter === 'included') return entry.status !== 'Excluded';
    if (auditFilter === 'excluded') return entry.status === 'Excluded';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Included (Faithful)':
        return 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]';
      case 'Included (Exploratory)':
        return 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]';
      case 'Included (Proxy)':
        return 'bg-[#F0FDFA] text-[#0F766E] border-[#99F6E4]';
      case 'Included (Reference)':
        return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]';
      default:
        return 'bg-[#FFF1F2] text-[#9F1239] border-[#FECDD3]';
    }
  };

  return (
    <section id="audit" className="py-16 bg-[#FFFFFF] border-b border-[#E4E4E7]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAFAFA] border border-[#E4E4E7] text-[#52525B] text-[11px] font-mono font-semibold mb-3 shadow-2xs">
              <span className="text-[#2563EB] font-bold">06</span>
              <span className="text-[#D4D4D8]">//</span>
              <span>PRACTITIONER DECISION RULES & 17-METHOD AUDIT (FIGURE 3 & 8)</span>
              <span className="text-[#D4D4D8]">•</span>
              <Compass className="w-3.5 h-3.5 text-[#D97706]" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B0B0B] tracking-tight">
              Actionable Selection Guide & 17-Method Scope Audit
            </h2>
            <p className="mt-2 text-[#3F3F46] max-w-3xl text-sm leading-relaxed">
              Translating 11,250 empirical evaluations into concrete decision rules for single-cell oncology workflows (Figure 8), alongside our 17-method literature audit (Figure 3: 10 evaluated, 7 excluded with documented rationale).
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowFig3(!showFig3)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FAFAFA] hover:bg-[#F4F4F5] border border-[#E4E4E7] px-3.5 py-2 text-xs font-mono font-semibold text-[#0B0B0B] transition-colors self-start"
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#2563EB]" />
            {showFig3 ? 'Hide Figure 3 (Author’s Proof)' : 'View Figure 3 (17-Method Audit Visual)'}
          </button>
        </div>

        {/* Optional Collapsible Figure 3 (Author's Proof) */}
        {showFig3 && (
          <div className="mb-8 rounded-2xl border border-[#E4E4E7] bg-[#FAFAFA] p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-[#0B0B0B]">
                Figure 3 (Author’s Proof): 17-Method Literature Audit, Track A AP Boxplots & Phase-11 Multi-Metric Summary
              </span>
              <a
                href="/figures/Fig0_Method_Audit.png"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] font-semibold text-[#2563EB] hover:underline"
              >
                Open Full 300-DPI PNG ↗
              </a>
            </div>
            <img
              src="/figures/Fig0_Method_Audit.png"
              alt="Figure 3: 17-Method Audit and Multi-Metric Summary"
              className="w-full max-h-[420px] object-contain rounded-lg border border-[#E4E4E7] bg-white p-2"
            />
          </div>
        )}

        {/* Interactive Practitioner Decision Wizard */}
        <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-2xl p-5 sm:p-6 mb-10 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#2563EB]" />
            <h3 className="font-display text-base sm:text-lg font-bold text-[#0B0B0B]">
              Interactive Practitioner Decision Wizard (Figure 8 Decision Tree)
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left Scenario Selector */}
            <div className="lg:col-span-5 flex flex-col gap-2.5">
              {PRACTITIONER_SCENARIOS.map((scenario, idx) => {
                const isSelected = scenario.id === selectedScenarioId;
                return (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => setSelectedScenarioId(scenario.id)}
                    className={`text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-[#0B0B0B] border-[#0B0B0B] text-white shadow-sm'
                        : 'bg-[#FFFFFF] border-[#E4E4E7] hover:bg-[#F4F4F5]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                          isSelected
                            ? 'bg-white/10 text-[#93C5FD] border-white/20 font-semibold'
                            : 'bg-[#F4F4F5] text-[#2563EB] border-[#E4E4E7] font-semibold'
                        }`}
                      >
                        Scenario 0{idx + 1} • {scenario.badge}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                      )}
                    </div>
                    <p
                      className={`text-xs font-semibold leading-snug ${
                        isSelected ? 'text-white' : 'text-[#0B0B0B]'
                      }`}
                    >
                      {scenario.question}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Right Recommendation Output Card */}
            <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E4E4E7] rounded-xl p-5 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[#E4E4E7]">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#2563EB] font-bold">
                    Recommended Protocol ({activeScenario.badge})
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] font-mono tabular-nums text-xs font-bold">
                    {activeScenario.expectedAP}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
                  <div className="p-3.5 rounded-xl bg-[#ECFDF5]/60 border border-[#A7F3D0]">
                    <div className="flex items-center gap-1.5 text-[#065F46] text-[11px] font-bold uppercase tracking-wider mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#059669]" />
                      Recommended Detector(s)
                    </div>
                    <div className="text-sm font-bold text-[#0B0B0B]">
                      {activeScenario.recommendedMethod}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FFF1F2]/60 border border-[#FECDD3]">
                    <div className="flex items-center gap-1.5 text-[#9F1239] text-[11px] font-bold uppercase tracking-wider mb-1">
                      <AlertOctagon className="w-3.5 h-3.5 shrink-0 text-[#E11D48]" />
                      Methods to Avoid in Regime
                    </div>
                    <div className="text-xs font-semibold text-[#9F1239]">
                      {activeScenario.avoidMethods}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E4E4E7]">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#52525B] mb-1">
                    Empirical Rationale & Mechanistic Explanation
                  </div>
                  <p className="text-xs text-[#3F3F46] leading-relaxed">
                    {activeScenario.rationale}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E4E4E7] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#52525B]">
                <span>
                  Always verify top-ranked candidate cells with orthogonal chromosomal CNV (Arm 2) before clinical interpretation.
                </span>
                <a
                  href="#figures"
                  className="text-[#2563EB] hover:text-[#1D4ED8] font-mono font-bold"
                >
                  Inspect Figure 8 Decision Tree →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 17-Method Scope & Exclusion Audit Table */}
        <div className="bg-[#FFFFFF] border border-[#E4E4E7] rounded-2xl overflow-hidden shadow-xs">
          <div className="p-5 border-b border-[#E4E4E7] bg-[#FAFAFA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-base font-bold text-[#0B0B0B] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#2563EB]" />
                Systematic 17-Method Literature Audit (Figure 3a: 10 Included, 7 Excluded)
              </h3>
              <p className="text-xs text-[#52525B] mt-0.5">
                Every candidate algorithm was audited for continuous score output, runtime scalability across 1,125 units, and freedom from CNV ground-truth circularity.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-[#F4F4F5] p-1 rounded-xl border border-[#E4E4E7] self-start">
              <Filter className="w-3.5 h-3.5 text-[#52525B] ml-2 mr-1" />
              {[
                { id: 'all', label: 'All Audited (17)' },
                { id: 'included', label: 'Included (10)' },
                { id: 'excluded', label: 'Excluded (7)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAuditFilter(tab.id as 'all' | 'included' | 'excluded')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    auditFilter === tab.id
                      ? 'bg-[#0B0B0B] text-white shadow-2xs'
                      : 'text-[#3F3F46] hover:text-[#0B0B0B]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E4E4E7] bg-[#F4F4F5]/80 text-[11px] font-mono font-semibold uppercase tracking-wider text-[#52525B]">
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Audit Status & Fidelity</th>
                  <th className="py-3 px-4">Language & Venue</th>
                  <th className="py-3 px-4">Algorithmic Paradigm</th>
                  <th className="py-3 px-4">Runtime Profile</th>
                  <th className="py-3 px-4">Empirical Audit Outcome / Exclusion Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E7] text-xs">
                {filteredAudit.map((row) => (
                  <tr key={row.method} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#0B0B0B] whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {row.status === 'Excluded' ? (
                          <XCircle className="w-4 h-4 text-[#E11D48] shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                        )}
                        {row.method}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold border ${getStatusBadge(
                          row.status
                        )}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#0B0B0B] whitespace-nowrap">
                      <div className="font-semibold">{row.language}</div>
                      <div className="text-[10px] font-mono text-[#71717A]">{row.venueYear}</div>
                    </td>
                    <td className="py-3 px-4 text-[#3F3F46] font-medium">{row.paradigm}</td>
                    <td className="py-3 px-4 font-mono tabular-nums text-xs text-[#3F3F46] whitespace-nowrap">
                      {row.runtimeProfile}
                    </td>
                    <td className="py-3 px-4 text-[#3F3F46] text-xs leading-relaxed max-w-md">
                      {row.auditOutcome}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
