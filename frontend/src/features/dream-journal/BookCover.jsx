import { COLORS } from "../../theme/tokens";
import { EDIN_ICON } from "../../assets/edinIcon";
import { generateCoverStats, humanizeTag } from "./dreamUtils";

export default function BookCover({ entries, onBegin, onExit }) {
  const { entryCount, topTag } = generateCoverStats(entries);
  return (
    <div style={{
      position: "relative", borderRadius: 22, overflow: "hidden",
      background: `radial-gradient(ellipse at 30% 15%, ${COLORS.violet}66, #1C2E24 78%)`,
      padding: "70px 32px 56px", textAlign: "center",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
      boxShadow: "0 18px 50px rgba(0,0,0,0.4)",
    }}>
      <div style={{
        position: "absolute", inset: 14, border: `1px solid ${COLORS.gold}55`, borderRadius: 14, pointerEvents: "none",
      }} />
      <img src={EDIN_ICON} alt="" style={{ width: 84, height: 84, borderRadius: "50%", boxShadow: `0 0 34px ${COLORS.gold}77`, objectFit: "cover" }} />
      <div style={{ fontSize: 10.5, color: COLORS.gold, letterSpacing: 3, textTransform: "uppercase", marginTop: 6 }}>
        A Dream &amp; Practice Journal
      </div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 30, color: "#FDFEFC", lineHeight: 1.3, maxWidth: 420 }}>
        {topTag ? `The Book of ${humanizeTag(topTag)}` : "The Book of Your Dreams"}
      </div>
      <div style={{ fontSize: 12, color: "#FDFEFC", opacity: 0.7 }}>
        {entryCount} {entryCount === 1 ? "entry" : "entries"} recorded, spiral by spiral
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
        <button
          onClick={onBegin}
          disabled={entryCount === 0}
          style={{
            padding: "12px 28px", borderRadius: 999, border: `1px solid ${COLORS.gold}`,
            background: `${COLORS.gold}22`, color: COLORS.gold, fontSize: 13, letterSpacing: 0.5,
            cursor: entryCount === 0 ? "default" : "pointer", opacity: entryCount === 0 ? 0.5 : 1,
          }}
        >
          Begin Reading
        </button>
        <button
          onClick={onExit}
          style={{ padding: "12px 20px", borderRadius: 999, border: `1px solid rgba(255,255,255,0.25)`, background: "transparent", color: "#FDFEFC", fontSize: 13, cursor: "pointer", opacity: 0.8 }}
        >
          Back to Journal
        </button>
      </div>
      {entryCount === 0 && (
        <div style={{ fontSize: 11, color: "#FDFEFC", opacity: 0.55, marginTop: 4 }}>Write your first entry before opening the book.</div>
      )}
    </div>
  );
}
