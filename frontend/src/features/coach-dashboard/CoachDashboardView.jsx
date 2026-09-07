import { useState, useEffect } from "react";
import { COLORS } from "../../theme/tokens";
import { EDIN_ICON } from "../../assets/edinIcon";
import {
  fetchClients,
  fetchClientDreamEntries,
  fetchClientConstitutionResults,
  fetchClientNotes,
  addClientNote,
  fetchSymbolValidations,
  validateSymbol,
  unvalidateSymbol,
} from "./api";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function CoachDashboardView() {
  const [clients, setClients] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    fetchClients()
      .then((cs) => {
        setClients(cs);
        if (cs.length > 0) setSelectedId(cs[0].id);
      })
      .catch((err) => { console.error("Failed to load clients:", err); setLoadError(err.message); });
  }, []);

  const selected = clients.find((c) => c.id === selectedId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: `${COLORS.violet}14`, border: `1px solid ${COLORS.violet}55`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        Coach dashboard — every account here, including your own. Real dream journal entries and Genius
        Constitution results, read-only. The chat widget isn't shown — it's illustrative and was never
        persisted server-side, so there's genuinely nothing to read there.
      </div>

      {loadError && (
        <div style={{ background: `${COLORS.coral}18`, border: `1px solid ${COLORS.coral}`, borderRadius: 10, padding: "14px 16px", fontSize: 13, color: COLORS.ink }}>
          Couldn't load clients: {loadError}
        </div>
      )}

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ width: 220, flexShrink: 0, background: COLORS.bgPanel, borderRadius: 14, padding: "12px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 10, color: COLORS.inkDim, letterSpacing: 0.5, padding: "0 6px", marginBottom: 4 }}>CLIENTS</div>
          {clients.length === 0 && !loadError && (
            <div style={{ fontSize: 12, color: COLORS.inkDim, fontStyle: "italic", padding: "0 6px" }}>No accounts yet.</div>
          )}
          {clients.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              style={{
                textAlign: "left", padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                border: `1px solid ${selectedId === c.id ? COLORS.violet : "transparent"}`,
                background: selectedId === c.id ? `${COLORS.violet}18` : "transparent",
                color: selectedId === c.id ? COLORS.violet : COLORS.ink,
              }}
            >
              <div style={{ fontSize: 12.5 }}>{c.displayName || "(no display name)"}{c.isSelf && " (you)"}</div>
              <div style={{ fontSize: 9.5, color: COLORS.inkDim, marginTop: 2 }}>
                {c.dreamEntryCount} dreams · {c.constitutionCount} constitutions
                {c.followThroughRate !== null && ` · ${c.followThroughRate}% follow-through`}
              </div>
            </button>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {selected ? (
            <ClientDetail key={selected.id} client={selected} />
          ) : (
            <div style={{ fontSize: 12.5, color: COLORS.inkDim, fontStyle: "italic" }}>Select a client.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ClientDetail({ client }) {
  const [dreamEntries, setDreamEntries] = useState([]);
  const [constitutionResults, setConstitutionResults] = useState([]);
  const [notes, setNotes] = useState([]);
  const [validatedTags, setValidatedTags] = useState([]);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    fetchClientDreamEntries(client.id).then(setDreamEntries).catch((err) => console.error("Failed to load dream entries:", err));
    fetchClientConstitutionResults(client.id).then(setConstitutionResults).catch((err) => console.error("Failed to load constitution results:", err));
    fetchClientNotes(client.id).then(setNotes).catch((err) => console.error("Failed to load coach notes:", err));
    fetchSymbolValidations(client.id).then(setValidatedTags).catch((err) => console.error("Failed to load symbol validations:", err));
  }, [client.id]);

  const addNote = () => {
    if (!newNote.trim()) return;
    addClientNote(client.id, newNote.trim())
      .then((note) => setNotes((cur) => [note, ...cur]))
      .catch((err) => console.error("Failed to add coach note:", err));
    setNewNote("");
  };

  const toggleTag = (tag) => {
    const isValidated = validatedTags.includes(tag);
    setValidatedTags((cur) => isValidated ? cur.filter((t) => t !== tag) : [...cur, tag]);
    const call = isValidated ? unvalidateSymbol(client.id, tag) : validateSymbol(client.id, tag);
    call.catch((err) => {
      console.error("Failed to update symbol validation:", err);
      setValidatedTags((cur) => isValidated ? [...cur, tag] : cur.filter((t) => t !== tag));
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
        <div style={{ fontSize: 11, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 10 }}>
          COACH NOTES ON {(client.displayName || "this account").toUpperCase()}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addNote()}
            placeholder="Add a dated coaching note..."
            spellCheck
            style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 13, outline: "none" }}
          />
          <button
            onClick={addNote}
            style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: COLORS.violet, color: "#FDFEFC", fontSize: 12.5, cursor: "pointer" }}
          >
            Add Note
          </button>
        </div>
        {notes.length === 0 ? (
          <div style={{ fontSize: 12, color: COLORS.inkDim, fontStyle: "italic" }}>No notes yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {notes.map((n) => (
              <div key={n.id} style={{ background: COLORS.bgPanelAlt, borderRadius: 8, padding: "8px 12px" }}>
                <div style={{ fontSize: 9.5, color: COLORS.inkDim, marginBottom: 3 }}>{formatDate(n.createdAt)}</div>
                <div style={{ fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>{n.note}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
        <div style={{ fontSize: 11, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 4 }}>DREAM JOURNAL — RAW MATERIAL</div>
        <div style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 12, lineHeight: 1.5 }}>
          Click a tag to validate it as a confirmed symbol — Edin is told which tags are confirmed vs.
          still tentative the next time it reflects on this client's dreams.
        </div>
        {dreamEntries.length === 0 ? (
          <div style={{ fontSize: 12, color: COLORS.inkDim, fontStyle: "italic" }}>No dream entries yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {dreamEntries.map((e) => (
              <div key={e.id} style={{ background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 13, color: COLORS.ink, fontFamily: "Georgia, serif" }}>{e.title || "(untitled)"}</div>
                  <div style={{ fontSize: 9.5, color: COLORS.inkDim, whiteSpace: "nowrap" }}>{formatDate(e.createdAt)}</div>
                </div>
                <div style={{ fontSize: 12, color: COLORS.ink, lineHeight: 1.5, marginBottom: 8 }}>
                  {e.lines.map((l) => l.text).join(" ")}
                </div>
                {e.tags.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: e.edinNote ? 8 : 0 }}>
                    {e.tags.map((t) => {
                      const validated = validatedTags.includes(t);
                      return (
                        <button
                          key={t}
                          onClick={() => toggleTag(t)}
                          title={validated ? "Coach-validated — click to un-validate" : "Click to validate this symbol"}
                          style={{
                            fontSize: 9.5, padding: "2px 8px", borderRadius: 999, cursor: "pointer",
                            border: `1px solid ${validated ? COLORS.gold : COLORS.grid}`,
                            background: validated ? `${COLORS.gold}22` : "transparent",
                            color: validated ? COLORS.gold : COLORS.inkDim,
                          }}
                        >
                          {validated ? "✓ " : "#"}{t}
                        </button>
                      );
                    })}
                  </div>
                )}
                {e.edinNote && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <img src={EDIN_ICON} alt="Edin" style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, objectFit: "cover", marginTop: 2 }} />
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 11.5, fontStyle: "italic", color: COLORS.inkDim, lineHeight: 1.6 }}>{e.edinNote}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
        <div style={{ fontSize: 11, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 12 }}>GENIUS CONSTITUTION HISTORY</div>
        {constitutionResults.length === 0 ? (
          <div style={{ fontSize: 12, color: COLORS.inkDim, fontStyle: "italic" }}>No Constitution takes yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {constitutionResults.map((r) => (
              <div key={r.id} style={{ background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                  <div style={{ fontSize: 12.5, color: COLORS.violet, textTransform: "capitalize" }}>{r.dominant}</div>
                  <div style={{ fontSize: 9.5, color: COLORS.inkDim, whiteSpace: "nowrap" }}>{formatDate(r.createdAt)}</div>
                </div>
                <div style={{ fontSize: 10.5, color: COLORS.inkDim, marginBottom: 6 }}>
                  shamanic {r.pct.shamanic}% · hermetic {r.pct.hermetic}% · stoic {r.pct.stoic}%
                </div>
                {r.intention && (
                  <div style={{ fontSize: 12, color: COLORS.ink, fontStyle: "italic", lineHeight: 1.5, marginBottom: r.edinNote ? 8 : 0 }}>
                    "{r.intention}"
                  </div>
                )}
                {r.edinNote && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <img src={EDIN_ICON} alt="Edin" style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, objectFit: "cover", marginTop: 2 }} />
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 11.5, fontStyle: "italic", color: COLORS.inkDim, lineHeight: 1.6 }}>{r.edinNote}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
