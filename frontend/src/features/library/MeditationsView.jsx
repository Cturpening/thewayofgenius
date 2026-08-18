import { useState } from "react";
import { COLORS } from "../../theme/tokens";
import SpeakButton from "../../components/common/SpeakButton";
import { MEDITATION_SCRIPTS } from "./data/meditationScripts";

export default function MeditationsView() {
  const [openId, setOpenId] = useState(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ background: `${COLORS.violet}14`, border: `1px solid ${COLORS.violet}55`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        Written, lead-guided versions of the lessons — for people who want to actually practice them, not
        just read about them. Adapted from her real voice-only recorded style: the container is prescribed
        (the structure, the pacing, the repeating loop), never the contents — your own mind fills in what
        it needs. Read silently, aloud, or hit Listen below.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {MEDITATION_SCRIPTS.map((m) => (
          <div key={m.title} style={{ background: COLORS.bgPanel, borderRadius: 12, overflow: "hidden" }}>
            <div
              onClick={() => setOpenId(openId === m.title ? null : m.title)}
              style={{ padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 14, color: m.color, marginBottom: 3 }}>{m.title}</div>
                <div style={{ fontSize: 11, color: COLORS.inkDim }}>{m.type}</div>
              </div>
              <div style={{ fontSize: 14, color: COLORS.inkDim, flexShrink: 0, marginLeft: 12 }}>{openId === m.title ? "−" : "+"}</div>
            </div>
            {openId === m.title && (
              <div style={{ padding: "0 16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 11.5, color: COLORS.inkDim, fontStyle: "italic", lineHeight: 1.5 }}>{m.howTo}</div>
                  <SpeakButton text={m.script.replace(/\n+/g, ". ")} small />
                </div>
                <div style={{
                  background: COLORS.bgPanelAlt, borderRadius: 10, padding: "16px 18px",
                  fontFamily: "Georgia, serif", fontSize: 13.5, color: COLORS.ink, lineHeight: 2,
                  whiteSpace: "pre-line",
                }}>
                  {m.script}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: COLORS.inkDim, fontStyle: "italic" }}>
        Written scripts here, in her real recorded style (a former opera singer — her voice is the
        instrument, no music underneath). These are candidates for real voice recording later, same as
        her existing sleep-meditation playlist.
      </div>
    </div>
  );
}
