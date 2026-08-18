import { COLORS } from "../../theme/tokens";

export default function TapestryWeb({ activeColor, activeLabel }) {
  const threads = [
    { key: "eeg", label: "EEG", angle: -90, active: true, color: activeColor },
    { key: "behavioral", label: "Behavioral", angle: -18, active: false },
    { key: "biofeedback", label: "Biofeedback", angle: 54, active: true, color: COLORS.gold },
    { key: "journals", label: "Journals", angle: 126, active: false },
    { key: "symbolic", label: "Symbolic Coding", angle: 198, active: true, color: "#8e7ad1" },
    { key: "growth", label: "Growth Arc", angle: 270, active: false },
  ];
  const cx = 150, cy = 150, r = 92;
  return (
    <svg viewBox="0 0 300 300" width="100%" height="230">
      {threads.map((t) => {
        const rad = (t.angle * Math.PI) / 180;
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);
        const color = t.active ? t.color : COLORS.grid;
        return (
          <g key={t.key}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke={color} strokeWidth={t.active ? 2 : 1} opacity={t.active ? 0.9 : 0.4} />
            <circle cx={x} cy={y} r={t.active ? 6 : 4} fill={t.active ? color : COLORS.bgPanelAlt} stroke={color} strokeWidth="1.4" />
            <text
              x={x + (Math.cos(rad) >= 0 ? 10 : -10)}
              y={y + (Math.sin(rad) >= 0 ? 14 : -8)}
              fontSize="10"
              fill={t.active ? color : COLORS.inkDim}
              textAnchor={Math.cos(rad) >= 0 ? "start" : "end"}
            >
              {t.label}
            </text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r="30" fill={COLORS.bgPanelAlt} stroke={activeColor} strokeWidth="1.6" />
      <text x={cx} y={cy - 3} textAnchor="middle" fontSize="10.5" fill={COLORS.ink} fontFamily="Georgia, serif">Genius</text>
      <text x={cx} y={cy + 11} textAnchor="middle" fontSize="10.5" fill={COLORS.ink} fontFamily="Georgia, serif">Profile</text>
    </svg>
  );
}
