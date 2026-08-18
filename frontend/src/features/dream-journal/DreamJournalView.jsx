import { useState } from "react";
import { COLORS } from "../../theme/tokens";
import { EDIN_ICON } from "../../assets/edinIcon";
import SpeakButton from "../../components/common/SpeakButton";
import { detectAutoTags, edinDreamReflection } from "./dreamUtils";
import BookCover from "./BookCover";

export default function DreamJournalView({ entries, setEntries }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const [mode, setMode] = useState("list"); // list | book
  const [bookPage, setBookPage] = useState(-1); // -1 = cover, 0..n-1 = entries

  const allTags = Array.from(new Set(entries.flatMap((e) => e.tags)));

  const resetComposer = () => {
    setTitle(""); setBody(""); setTagInput(""); setEditingId(null);
  };

  const saveEntry = () => {
    if (!body.trim()) return;
    const manualTags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    const autoTags = detectAutoTags(body);
    const tags = Array.from(new Set([...manualTags, ...autoTags]));
    const lines = body.split("\n").filter((l) => l.trim().length > 0).map((text) => ({ text, highlighted: false }));

    if (editingId) {
      setEntries(entries.map((e) => e.id === editingId
        ? { ...e, title: title.trim() || "Untitled entry", tags, lines, edited: true }
        : e));
    } else {
      const entry = {
        id: Date.now(),
        date: "Just now",
        title: title.trim() || "Untitled entry",
        tags,
        lines,
        edinNote: edinDreamReflection(body, tags),
      };
      setEntries([entry, ...entries]);
    }
    resetComposer();
  };

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setBody(entry.lines.map((l) => l.text).join("\n"));
    setTagInput(entry.tags.join(", "));
  };

  const deleteEntry = (id) => {
    setEntries(entries.filter((e) => e.id !== id));
    if (editingId === id) resetComposer();
  };

  const toggleHighlight = (entryId, lineIdx) => {
    setEntries(entries.map((e) =>
      e.id === entryId
        ? { ...e, lines: e.lines.map((l, i) => i === lineIdx ? { ...l, highlighted: !l.highlighted } : l) }
        : e
    ));
  };

  const updateLineText = (entryId, lineIdx, newText) => {
    setEntries(entries.map((e) =>
      e.id === entryId
        ? { ...e, lines: e.lines.map((l, i) => i === lineIdx ? { ...l, text: newText } : l), edited: true }
        : e
    ));
  };

  const visibleEntries = activeFilter ? entries.filter((e) => e.tags.includes(activeFilter)) : entries;

  if (mode === "book") {
    if (bookPage === -1 || entries.length === 0) {
      return (
        <BookCover
          entries={entries}
          onBegin={() => setBookPage(0)}
          onExit={() => { setMode("list"); setBookPage(-1); }}
        />
      );
    }
    const entry = entries[Math.min(bookPage, entries.length - 1)];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{
          background: COLORS.bg, border: `1px solid ${COLORS.grid}`, borderRadius: 18,
          padding: "40px 44px", minHeight: 380, boxShadow: "0 10px 34px rgba(0,0,0,0.12)",
        }}>
          <div style={{ fontSize: 10.5, color: COLORS.inkDim, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6, textAlign: "center" }}>
            {entry.date}{entry.edited ? " · edited" : ""}
          </div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 24, color: COLORS.ink, textAlign: "center", marginBottom: 6 }}>
            {entry.title}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 14 }}>
            {entry.tags.map((t) => (
              <span key={t} style={{ fontSize: 9.5, padding: "2px 8px", borderRadius: 999, background: `${COLORS.gold}18`, color: COLORS.gold }}>#{t}</span>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 26 }}>
            <SpeakButton text={`${entry.title}. ${entry.lines.map((l) => l.text).join(" ")} ${entry.edinNote}`} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 560, margin: "0 auto" }}>
            {entry.lines.map((line, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span
                  onClick={() => toggleHighlight(entry.id, i)}
                  title="Toggle highlight"
                  style={{ cursor: "pointer", fontSize: 13, marginTop: 6, opacity: line.highlighted ? 1 : 0.3, flexShrink: 0 }}
                >
                  ✦
                </span>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateLineText(entry.id, i, e.currentTarget.innerText)}
                  style={{
                    flex: 1, fontFamily: "Georgia, serif", fontSize: 16, lineHeight: 1.85, color: COLORS.ink,
                    padding: "3px 10px", borderRadius: 5, outline: "none",
                    background: line.highlighted ? `${COLORS.gold}30` : "transparent",
                  }}
                >
                  {line.text}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, maxWidth: 560, margin: "26px auto 0", fontStyle: "italic" }}>
            <img src={EDIN_ICON} alt="Edin" style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, objectFit: "cover", marginTop: 2 }} />
            <div style={{ fontFamily: "Georgia, serif", fontSize: 13, color: COLORS.inkDim, lineHeight: 1.6 }}>
              {entry.edinNote}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={() => setBookPage(bookPage <= 0 ? -1 : bookPage - 1)}
            style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.inkDim, fontSize: 12.5, cursor: "pointer" }}
          >
            ← {bookPage <= 0 ? "Cover" : "Previous"}
          </button>
          <div style={{ fontSize: 11, color: COLORS.inkDim }}>
            Page {bookPage + 1} of {entries.length}
          </div>
          <button
            onClick={() => bookPage < entries.length - 1 ? setBookPage(bookPage + 1) : (setMode("list"), setBookPage(-1))}
            style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.inkDim, fontSize: 12.5, cursor: "pointer" }}
          >
            {bookPage < entries.length - 1 ? "Next →" : "Close Book →"}
          </button>
        </div>
        <div style={{ fontSize: 11, color: COLORS.inkDim, fontStyle: "italic", textAlign: "center" }}>
          Click ✦ to highlight a line, or click into any line to edit it right here while you read.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ background: `${COLORS.violet}14`, border: `1px solid ${COLORS.violet}55`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        Your dream and work journal — fully yours to write, tag, highlight, and edit. Edin reads every
        entry and reflects back a short note, same as a real coach would, but never rewrites your words.
        Click any line in a saved entry to highlight it.
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => { setMode("book"); setBookPage(-1); }}
          style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${COLORS.gold}`, background: `${COLORS.gold}18`, color: COLORS.gold, fontSize: 12.5, cursor: "pointer" }}
        >
          📖 Read as a Book
        </button>
      </div>

      <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Entry title (optional)"
          style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 13, outline: "none" }}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write it out, one line per thought or beat of the dream..."
          rows={5}
          style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 13, outline: "none", resize: "vertical", lineHeight: 1.5, fontFamily: "inherit" }}
        />
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder="Add tags, comma separated (Edin adds a few more automatically)"
          style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 12.5, outline: "none" }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={saveEntry}
            style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: COLORS.violet, color: "#FDFEFC", fontSize: 13, cursor: "pointer" }}
          >
            {editingId ? "Save Changes" : "Save Entry"}
          </button>
          {editingId && (
            <button
              onClick={resetComposer}
              style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.inkDim, fontSize: 12.5, cursor: "pointer" }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {allTags.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {allTags.map((t) => (
            <span
              key={t}
              onClick={() => setActiveFilter(activeFilter === t ? null : t)}
              style={{
                fontSize: 10.5, padding: "4px 10px", borderRadius: 999, cursor: "pointer",
                border: `1px solid ${activeFilter === t ? COLORS.gold : COLORS.grid}`,
                background: activeFilter === t ? `${COLORS.gold}22` : "transparent",
                color: activeFilter === t ? COLORS.gold : COLORS.inkDim,
              }}
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {visibleEntries.map((entry) => (
          <div key={entry.id} style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 14.5, color: COLORS.ink }}>{entry.title}</div>
                <div style={{ fontSize: 10.5, color: COLORS.inkDim, marginTop: 2 }}>{entry.date}{entry.edited ? " · edited" : ""}</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <SpeakButton text={`${entry.title}. ${entry.lines.map((l) => l.text).join(" ")} ${entry.edinNote}`} small />
                <button
                  onClick={() => startEdit(entry)}
                  style={{ fontSize: 10.5, padding: "4px 10px", borderRadius: 6, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.inkDim, cursor: "pointer" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteEntry(entry.id)}
                  style={{ fontSize: 10.5, padding: "4px 10px", borderRadius: 6, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.coral, cursor: "pointer" }}
                >
                  Delete
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
              {entry.tags.map((t) => (
                <span key={t} style={{ fontSize: 9.5, padding: "2px 8px", borderRadius: 999, background: `${COLORS.gold}18`, color: COLORS.gold }}>#{t}</span>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
              {entry.lines.map((line, i) => (
                <div
                  key={i}
                  onClick={() => toggleHighlight(entry.id, i)}
                  style={{
                    fontSize: 12.5, color: COLORS.ink, lineHeight: 1.6, cursor: "pointer",
                    padding: "2px 6px", borderRadius: 4,
                    background: line.highlighted ? `${COLORS.gold}30` : "transparent",
                  }}
                >
                  {line.text}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <img src={EDIN_ICON} alt="Edin" style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, objectFit: "cover" }} />
              <div style={{ background: COLORS.bgPanelAlt, borderRadius: 10, padding: "8px 12px", fontSize: 11.5, color: COLORS.inkDim, fontStyle: "italic", flex: 1 }}>
                {entry.edinNote}
              </div>
            </div>
          </div>
        ))}
        {visibleEntries.length === 0 && (
          <div style={{ fontSize: 12, color: COLORS.inkDim, fontStyle: "italic" }}>No entries match that tag yet.</div>
        )}
      </div>

      <div style={{ fontSize: 11, color: COLORS.inkDim, fontStyle: "italic" }}>
        Illustrative reflections, not a live model — but tag categories (recall-blocker, waking-activation,
        integration-milestone) are real, from the Beta Client Workflow Protocol, and the door/gut/chest
        symbols cross-reference the same ones in the Symbol Body Map.
      </div>
    </div>
  );
}
