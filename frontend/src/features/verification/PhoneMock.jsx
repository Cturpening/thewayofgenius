import { COLORS } from "../../theme/tokens";
import WaveSVG from "../../components/common/WaveSVG";

export default function PhoneMock({ mode, states, activeKey, setActiveKey }) {
  const keys = Object.keys(states);
  const s = states[activeKey];
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 300,
          borderRadius: 34,
          border: `6px solid #0b0f14`,
          background: COLORS.bg,
          padding: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ fontSize: 11, color: COLORS.inkDim, textAlign: "center", marginBottom: 10 }}>9:41</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: COLORS.ink, marginBottom: 2 }}>
          {mode === "workload" ? "Focus Profile" : "Sleep Profile"}
        </div>
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 18 }}>
          {mode === "workload" ? "Live cognitive state" : "Last night's architecture"}
        </div>

        <div
          style={{
            borderRadius: 18,
            background: `radial-gradient(circle at 30% 20%, ${s.accent}33, ${COLORS.bgPanel})`,
            padding: 18,
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 13, color: COLORS.ink, marginBottom: 8 }}>{s.label}</div>
          <WaveSVG bandPowers={s} seed={activeKey.length * 51 + 7} color={s.accent} height={54} />
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {keys.map((k) => (
            <div
              key={k}
              onClick={() => setActiveKey(k)}
              style={{
                fontSize: 10,
                padding: "5px 9px",
                borderRadius: 12,
                cursor: "pointer",
                color: activeKey === k ? "#0f151b" : COLORS.inkDim,
                background: activeKey === k ? states[k].accent : COLORS.bgPanelAlt,
              }}
            >
              {states[k].label.split(" ")[0]}
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, color: COLORS.inkDim, lineHeight: 1.5 }}>
          {mode === "workload"
            ? "Your Subconscious is holding steady focus. Frontal channels show a clear engagement signature."
            : "Your brain moved through its natural architecture last night — each stage logged and mapped to your Genius Profile."}
        </div>
      </div>
    </div>
  );
}
