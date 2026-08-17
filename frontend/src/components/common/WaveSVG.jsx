import { useMemo } from "react";
import { COLORS } from "../../theme/tokens";
import { generateWave } from "../../lib/waveform";

export default function WaveSVG({ bandPowers, seed, color, height = 90 }) {
  const wave = useMemo(() => generateWave(bandPowers, seed), [bandPowers, seed]);
  const w = 600;
  const h = height;
  const max = Math.max(...wave.map((v) => Math.abs(v))) || 1;
  const path = wave
    .map((v, i) => {
      const x = (i / (wave.length - 1)) * w;
      const y = h / 2 - (v / max) * (h / 2 - 6);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke={COLORS.grid} strokeWidth="1" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" opacity="0.9" />
    </svg>
  );
}
