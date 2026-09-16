import { COLORS } from "../../theme/tokens";

// Shared 2D/3D switch for any lens that has both a flat and a holographic
// version of the same real data (Genius Weave, Your Symbols). Keeping the
// choice inside the lens itself, instead of as separate tabs, makes the
// "same data, different dimension" relationship obvious instead of
// something you'd only discover by clicking around.
export default function DimensionToggle({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {["2d", "3d"].map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          style={{
            padding: "5px 14px", borderRadius: 999,
            border: `1px solid ${value === d ? COLORS.teal : COLORS.grid}`,
            background: value === d ? `${COLORS.teal}22` : "transparent",
            color: value === d ? COLORS.teal : COLORS.inkDim,
            fontSize: 11.5, fontWeight: 600, cursor: "pointer",
          }}
        >
          {d === "2d" ? "Flat" : "Hologram"}
        </button>
      ))}
    </div>
  );
}
