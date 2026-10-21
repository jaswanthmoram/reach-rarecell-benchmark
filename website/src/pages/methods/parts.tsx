/** Method identity mark: filled dot for ranked detectors, dashed ring for unranked references. */
export function Dot({ hue, dashed, size = 8 }: { hue: string; dashed: boolean; size?: number }) {
  return dashed
    ? <span aria-hidden="true" className="inline-block flex-none rounded-full border-[1.5px] border-dashed" style={{ width: size + 2, height: size + 2, borderColor: hue }} />
    : <span aria-hidden="true" className="inline-block flex-none rounded-full" style={{ width: size, height: size, background: hue }} />;
}
