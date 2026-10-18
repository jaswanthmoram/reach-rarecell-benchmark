import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  Layers,
  TrendingDown,
  Zap,
  Image as ImageIcon,
} from 'lucide-react';
import {
  TRACKS_DATA,
  LEADERBOARD_DATA,
  TRACK_E_NOISE_CONDITIONS,
} from '../data/benchmarkData';

export const TracksExplorer: React.FC = () => {
  const [selectedTrackId, setSelectedTrackId] = useState<string>('track-f');
  const [showFig2Proof, setShowFig2Proof] = useState<boolean>(false);

  const activeTrack =
    TRACKS_DATA.find((t) => t.id === selectedTrackId) || TRACKS_DATA[5];

  return (
    <section id="tracks" className="py-14 border-b border-[#E4E4E7] bg-white">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FAFAFA] border border-[#E4E4E7] px-3 py-1 text-[11px] font-mono font-semibold text-[#52525B] mb-2">
              <span className="text-[#2563EB] font-bold">03 // SIX EVALUATION TRACKS (A–F)</span>
              <span>•</span>
              <Compass className="h-3.5 w-3.5 text-[#059669]" />
              <span>1,125 Units/Method · 11,250 Total Evaluations</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0B0B]">
              Six Complementary Evaluation Tracks (Tracks A–F)
            </h2>
            <p className="mt-1.5 text-sm text-[#52525B] max-w-3xl">
              Single-number leaderboards obscure critical failure modes. REACH decomposes evaluation into 6 tracks: <strong className="text-[#0B0B0B]">Track A (160u)</strong>, <strong className="text-[#0B0B0B]">Track B (120u)</strong>, <strong className="text-[#0B0B0B]">Track C (160u)</strong>, <strong className="text-[#0B0B0B]">Track D (30u)</strong>, <strong className="text-[#0B0B0B]">Track E (640u)</strong>, and <strong className="text-[#0B0B0B]">Track F (15u intra-lineage)</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowFig2Proof(!showFig2Proof)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold border transition-colors ${
              showFig2Proof
                ? 'bg-[#0B0B0B] text-white border-[#0B0B0B]'
                : 'bg-[#FAFAFA] text-[#18181B] border-[#E4E4E7] hover:border-[#0B0B0B]'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5 text-[#2563EB]" />
            <span>{showFig2Proof ? 'Hide Figure 2 Schematic' : 'View Figure 2 (Author’s Proof Schematic)'}</span>
          </button>
        </div>

        {/* Optional Collapsible Figure 2 (Author's Proof) Schematic */}
        {showFig2Proof && (
          <div className="mb-6 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-[#0B0B0B]">
                Figure 2 (Author&apos;s Proof, 300 DPI): Schematic of the Six Evaluation Tracks (1,125 Total Units/Method)
              </span>
              <span className="font-mono text-[11px] text-[#52525B]">Front. Bioinform. 6:1878538</span>
            </div>
            <div className="rounded-lg bg-white border border-[#E4E4E7] p-3">
              <img
                src="/figures/proof/Figure_02_Six_Tracks.png"
                alt="Figure 2: Schematic of the six evaluation tracks in REACH"
                className="w-full max-h-[460px] object-contain mx-auto"
              />
            </div>
          </div>
        )}

        {/* Track Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
          {TRACKS_DATA.map((track) => {
            const isSelected = track.id === selectedTrackId;
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => setSelectedTrackId(track.id)}
                className={`text-left rounded-xl p-3 border transition-all ${
                  isSelected
                    ? 'bg-[#0B0B0B] border-[#0B0B0B] text-white shadow-xs'
                    : 'bg-[#FAFAFA] border-[#E4E4E7] text-[#3F3F46] hover:bg-[#F4F4F5] hover:text-[#0B0B0B]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-xs font-bold ${
                      isSelected ? 'text-[#93C5FD]' : 'text-[#2563EB]'
                    }`}
                  >
                    {track.code}
                  </span>
                  <span
                    className={`font-mono tabular-nums text-[10px] rounded px-1.5 py-0.5 border ${
                      isSelected
                        ? 'bg-white/10 text-white border-white/20'
                        : 'bg-white text-[#52525B] border-[#E4E4E7]'
                    }`}
                  >
                    {track.units}u
                  </span>
                </div>
                <div
                  className={`font-display text-xs font-bold mt-1 line-clamp-1 ${
                    isSelected ? 'text-white' : 'text-[#0B0B0B]'
                  }`}
                >
                  {track.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Track Deep-Dive Workbench */}
        <div className="rounded-xl bg-[#FAFAFA] border border-[#E4E4E7] p-5 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 6 Cols: Specification & Key Findings */}
            <div className="lg:col-span-6 space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="rounded bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 font-mono text-xs font-bold text-[#1D4ED8]">
                    {activeTrack.code}
                  </span>
                  <span className="rounded bg-white border border-[#E4E4E7] px-2 py-0.5 font-mono tabular-nums text-xs text-[#3F3F46] font-semibold">
                    {activeTrack.units} Units/Method
                  </span>
                  <span className="rounded bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 font-mono text-xs text-[#065F46] font-semibold">
                    {activeTrack.datasetsCount}
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold text-[#0B0B0B]">
                  {activeTrack.name}
                </h3>
                <p className="text-xs font-mono text-[#2563EB] font-medium mt-0.5">
                  {activeTrack.subtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {activeTrack.metricsSummary.map((m) => (
                  <div
                    key={m.label}
                    className="rounded-lg bg-white border border-[#E4E4E7] p-3"
                  >
                    <div className="text-[10px] font-mono uppercase text-[#52525B] font-semibold">
                      {m.label}
                    </div>
                    <div className="font-mono tabular-nums text-sm font-bold text-[#0B0B0B] mt-0.5">
                      {m.value}
                    </div>
                    <div className="text-[10px] font-mono text-[#2563EB] mt-0.5">
                      {m.sub}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg bg-white border border-[#E4E4E7] p-3.5 text-xs text-[#3F3F46] leading-relaxed">
                <div className="font-mono text-[10px] uppercase text-[#52525B] font-bold mb-1">
                  Protocol &amp; Regime ({activeTrack.rarityRegime})
                </div>
                <p>{activeTrack.methodology}</p>
              </div>

              <div className="rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] p-3.5 text-xs text-[#0B0B0B] leading-relaxed">
                <div className="font-mono text-[10px] uppercase text-[#1D4ED8] font-bold mb-1 flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5" /> Empirical Discovery
                </div>
                <p>{activeTrack.keyFinding}</p>
              </div>
            </div>

            {/* Right 6 Cols: Interactive Track-Specific Visualization */}
            <div className="lg:col-span-6 bg-white rounded-xl border border-[#E4E4E7] p-4">
              {selectedTrackId === 'track-f' && (
                <div className="space-y-3">
                  <div className="border-b border-[#E4E4E7] pb-2.5">
                    <h4 className="font-display text-sm font-bold text-[#0B0B0B] flex items-center gap-1.5">
                      <TrendingDown className="h-4 w-4 text-[#E11D48]" />
                      Figure 11: Track A (Inter-Lineage) vs. Track F (Intra-Lineage) Median AP
                    </h4>
                    <p className="text-[11px] text-[#52525B]">
                      Malignant epithelial cells spiked into normal immune/stromal (Track A) vs. normal epithelial cells of the same lineage (Track F, crc_lee)
                    </p>
                  </div>

                  <div className="space-y-2">
                    {LEADERBOARD_DATA.map((m) => (
                      <div key={m.id} className="space-y-1">
                        <div className="flex items-center justify-between font-mono tabular-nums text-xs">
                          <span className="font-bold text-[#0B0B0B]">{m.method}</span>
                          <div className="flex items-center gap-2.5 text-[11px]">
                            <span className="text-[#1D4ED8]">
                              Track A: {m.medianAP.toFixed(3)}
                            </span>
                            <span className="text-[#065F46] font-semibold">
                              Track F: {m.trackFMedianAP.toFixed(3)}
                            </span>
                            <span
                              className={`font-bold ${
                                m.trackFDelta > 0
                                  ? 'text-[#059669]'
                                  : m.trackFDelta < -0.15
                                  ? 'text-[#E11D48]'
                                  : 'text-[#52525B]'
                              }`}
                            >
                              ({m.trackFDelta > 0 ? `+${m.trackFDelta.toFixed(3)}` : m.trackFDelta.toFixed(3)})
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 h-2">
                          <div className="bg-[#F4F4F5] rounded overflow-hidden">
                            <div
                              className="h-full bg-[#2563EB] rounded"
                              style={{ width: `${Math.max(3, m.medianAP * 100)}%` }}
                            />
                          </div>
                          <div className="bg-[#F4F4F5] rounded overflow-hidden">
                            <div
                              className={`h-full rounded ${
                                m.trackFMedianAP > 0.5 ? 'bg-[#059669]' : 'bg-[#E11D48]'
                              }`}
                              style={{ width: `${Math.max(3, m.trackFMedianAP * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTrackId === 'track-e' && (
                <div className="space-y-3">
                  <div className="border-b border-[#E4E4E7] pb-2.5">
                    <h4 className="font-display text-sm font-bold text-[#0B0B0B]">
                      Figure 9: Track E Asymmetric Label-Noise Sweep (640 Units)
                    </h4>
                    <p className="text-[11px] text-[#52525B]">
                      Supervised <code className="font-mono">hvg_logreg</code> degrades under false-positive contamination while unsupervised methods remain label-free (RI = 1.000)
                    </p>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-[#E4E4E7]">
                    <table className="w-full text-left font-mono tabular-nums text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#E4E4E7] bg-[#F4F4F5] text-[#52525B] text-[10px]">
                          <th className="py-2 px-2.5">Condition</th>
                          <th className="py-2 px-2 text-[#065F46]">hvg_logreg Mean AP</th>
                          <th className="py-2 px-2">Retention (RI)</th>
                          <th className="py-2 px-2 text-[#1D4ED8]">Unsupervised (FiRE / CaSee)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E4E4E7]">
                        {TRACK_E_NOISE_CONDITIONS.map((row) => (
                          <tr key={row.condition}>
                            <td className="py-2 px-2.5 font-bold text-[#0B0B0B]">
                              <div>{row.condition}</div>
                              <div className="text-[10px] font-normal text-[#71717A]">{row.note}</div>
                            </td>
                            <td className="py-2 px-2 text-[#065F46] font-bold">
                              {row.meanAP.toFixed(3)}
                            </td>
                            <td className="py-2 px-2 font-semibold text-[#0B0B0B]">
                              {row.robustnessIndex.toFixed(3)}
                            </td>
                            <td className="py-2 px-2 text-[#52525B]">
                              Invariant (0.385 / 0.441)
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedTrackId !== 'track-f' && selectedTrackId !== 'track-e' && (
                <div className="space-y-3">
                  <div className="border-b border-[#E4E4E7] pb-2.5">
                    <h4 className="font-display text-sm font-bold text-[#0B0B0B] flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-[#2563EB]" />
                      {activeTrack.code} Method Telemetry ({activeTrack.units} Units/Method)
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {LEADERBOARD_DATA.slice(0, 8).map((m) => {
                      const val =
                        selectedTrackId === 'track-a'
                          ? m.medianAP
                          : selectedTrackId === 'track-b'
                          ? (11 - m.trackBRank) / 10
                          : selectedTrackId === 'track-d'
                          ? m.trackDAP
                          : m.nullFPRate;

                      const label =
                        selectedTrackId === 'track-a'
                          ? `Med AP: ${m.medianAP.toFixed(3)} (Excl-degen: ${m.exclDegenerateMedianAP.toFixed(3)})`
                          : selectedTrackId === 'track-b'
                          ? `Synthetic Rank #${m.trackBRank} vs. Patient Rank #${m.trackARank}`
                          : selectedTrackId === 'track-d'
                          ? `Cross-Patient Mean AP: ${m.trackDAP.toFixed(3)}`
                          : `Null Mean Score: ${m.nullMeanScore.toFixed(3)} · FP Rate: ${(m.nullFPRate * 100).toFixed(1)}%`;

                      return (
                        <div key={m.id} className="space-y-1">
                          <div className="flex items-center justify-between font-mono tabular-nums text-xs">
                            <span className="font-bold text-[#0B0B0B]">{m.method}</span>
                            <span className="text-[#3F3F46] text-[11px]">{label}</span>
                          </div>
                          <div className="h-2 w-full bg-[#F4F4F5] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                selectedTrackId === 'track-c' && m.nullFPRate > 0.1
                                  ? 'bg-[#E11D48]'
                                  : 'bg-[#2563EB]'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(4, val * 100))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-2 text-[11px] text-[#52525B] font-mono">
                    <span className="inline-flex items-center gap-1 text-[#065F46] font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#059669]" /> Top:{' '}
                      {activeTrack.topPerformer}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
