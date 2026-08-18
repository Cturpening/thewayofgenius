import { useState } from "react";
import { COLORS } from "../../theme/tokens";
import EDFVerificationView from "./EDFVerificationView";
import RealPatientView from "./RealPatientView";
import SleepEDFView from "./SleepEDFView";

export default function VerificationHub() {
  const [source, setSource] = useState("sleepedf"); // sleepedf | real | synthetic
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["sleepedf", "real", "synthetic"].map((s) => (
          <button
            key={s}
            onClick={() => setSource(s)}
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              border: `1px solid ${source === s ? COLORS.ink : COLORS.grid}`,
              background: source === s ? COLORS.bgPanelAlt : "transparent",
              color: source === s ? COLORS.ink : COLORS.inkDim,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {s === "sleepedf" ? "Real Overnight Sleep Study" : s === "real" ? "Real Clinical Recording" : "Synthetic Test File"}
          </button>
        ))}
      </div>
      {source === "sleepedf" && <SleepEDFView />}
      {source === "real" && <RealPatientView />}
      {source === "synthetic" && <EDFVerificationView />}
    </div>
  );
}
