import { COLORS } from "../../theme/tokens";

export default function PlannedLaneCard({ name, color, desc }) {
  return (
    <div style={{ flex: "1 1 220px", background: COLORS.bgPanelAlt, borderRadius: 10, padding: "14px 16px", opacity: 0.75 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 13, color: COLORS.ink }}>{name}</div>
        <div style={{ fontSize: 9, color, letterSpacing: 0.4 }}>PLANNED</div>
      </div>
      <div style={{ fontSize: 11, color: COLORS.inkDim, lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}
