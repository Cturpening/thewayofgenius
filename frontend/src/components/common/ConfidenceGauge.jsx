import { COLORS } from "../../theme/tokens";

export default function ConfidenceGauge({ value, color }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value);
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke={COLORS.bgPanelAlt} strokeWidth="8" />
      <circle
        cx="55"
        cy="55"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 55 55)"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="55" y="52" textAnchor="middle" fill={COLORS.ink} fontSize="20" fontFamily="Georgia, serif">
        {(value * 100).toFixed(0)}%
      </text>
      <text x="55" y="68" textAnchor="middle" fill={COLORS.inkDim} fontSize="9" fontFamily="Inter, sans-serif">
        CONFIDENCE
      </text>
    </svg>
  );
}
