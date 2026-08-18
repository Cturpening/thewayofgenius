import { useState } from "react";
import { COLORS } from "../../theme/tokens";
import { LIBRARY_SECTIONS } from "./data/librarySections";

export default function SymbolicLibraryView() {
  const [openSection, setOpenSection] = useState("Foundations");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: `${COLORS.gold}14`, border: `1px solid ${COLORS.gold}55`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        The Symbolic Library — every chapter/tab of "The Way of the Insane," organized as a browsable
        room. Teal-bordered entries are already pulled into the prototype elsewhere; the rest are real
        chapters whose titles are catalogued but whose content hasn't been extracted into this demo yet.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {LIBRARY_SECTIONS.map((sec) => (
          <div key={sec.title} style={{ background: COLORS.bgPanel, borderRadius: 12, overflow: "hidden" }}>
            <div
              onClick={() => setOpenSection(openSection === sec.title ? null : sec.title)}
              style={{ padding: "12px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div style={{ fontFamily: "Georgia, serif", fontSize: 14, color: sec.color }}>{sec.title}</div>
              <div style={{ fontSize: 11, color: COLORS.inkDim }}>{openSection === sec.title ? "−" : "+"}</div>
            </div>
            {openSection === sec.title && (
              <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                {sec.chapters.map((ch) => (
                  <div key={ch.name} style={{
                    borderLeft: `2px solid ${ch.real ? sec.color : COLORS.grid}`,
                    paddingLeft: 10, opacity: ch.real ? 1 : 0.7,
                  }}>
                    <div style={{ fontSize: 12, color: COLORS.ink }}>
                      {ch.name} {ch.real && <span style={{ fontSize: 9, color: sec.color, letterSpacing: 0.3 }}>· LIVE ELSEWHERE</span>}
                    </div>
                    {ch.blurb && <div style={{ fontSize: 11, color: COLORS.inkDim, marginTop: 2, lineHeight: 1.4 }}>{ch.blurb}</div>}
                    {ch.note && <div style={{ fontSize: 10.5, color: COLORS.coral, marginTop: 2, fontStyle: "italic" }}>{ch.note}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
