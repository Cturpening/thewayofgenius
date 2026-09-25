import { useEffect, useState } from "react";
import { COLORS } from "../../theme/tokens";
import { EDIN_ICON } from "../../assets/edinIcon";

// `members` is lifted to GeniusProfileHub and backed by the real
// /team-members API (see dojo/api.js and backend/app/team_tools.py) so the
// same real team list shows up in both this flat view and the Living Map's
// Inner Team layer -- one shared list, not two that can drift apart.
export default function InnerTeamView({ members, onAddMember, onEditMember, onDeleteMember }) {
  const [selectedId, setSelectedId] = useState(members[0]?.id ?? null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMode, setNewMode] = useState("front");
  const [newRole, setNewRole] = useState("");
  const [editingTask, setEditingTask] = useState(false);
  const [taskDraft, setTaskDraft] = useState("");
  const [crisisMessage, setCrisisMessage] = useState(null);

  // members loads async from the backend (starts empty, then populates),
  // and can also shrink out from under a stale selection on delete -- keep
  // selectedId pointing at a real member whenever the list changes.
  useEffect(() => {
    if (members.length === 0) { setSelectedId(null); return; }
    if (!members.find((m) => m.id === selectedId)) setSelectedId(members[0].id);
  }, [members, selectedId]);

  // Switching who's selected shouldn't leave a stale task-editing box open
  // pointed at the previous member.
  useEffect(() => { setEditingTask(false); }, [selectedId]);

  const cx = 210, cy = 210, r = 140;
  const w = 420, h = 420;
  const modeColor = { front: COLORS.teal, background: COLORS.violet };
  const modeLabel = { front: "FRONT-SPACE — ACTIVE HELPER", background: "BACKGROUND — DATA RUNNER" };
  const selected = members.find((m) => m.id === selectedId) || members[0];

  // Pre-existing edge case, not introduced here: deleting the last member
  // used to leave `selected` undefined and the angle math dividing by
  // zero. Guarded since lifting this state up makes an empty team a real
  // reachable state (e.g. cleared from the Living Map's own controls too).
  const isEmpty = members.length === 0;

  const addMember = () => {
    if (!newName.trim()) return;
    onAddMember({ name: newName.trim(), mode: newMode, role: newRole.trim() || undefined })
      .then(({ member, crisisResponse }) => {
        setSelectedId(member.id);
        if (crisisResponse) setCrisisMessage(crisisResponse);
      })
      .catch((err) => console.error("Failed to add team member:", err));
    setNewName(""); setNewRole(""); setNewMode("front"); setShowAdd(false);
  };

  const deleteMember = (id) => {
    onDeleteMember(id);
  };

  const startEditingTask = () => {
    setTaskDraft(selected.task || "");
    setEditingTask(true);
  };

  const saveTask = () => {
    setEditingTask(false);
    onEditMember(selected.id, { task: taskDraft.trim() || "No current task assigned yet." })
      .then((crisisResponse) => { if (crisisResponse) setCrisisMessage(crisisResponse); })
      .catch((err) => console.error("Failed to update team member task:", err));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: `${COLORS.violet}14`, border: `1px solid ${COLORS.violet}55`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        Your Inner Team — name it however feels right to you, no fixed framework required. Each member
        can show up front-space as an active helper, or run quietly in the background organizing your own
        data as an interface for you. It's a relationship, and a creative one — add as many as show up for you.
      </div>

      {crisisMessage && (
        <div style={{ background: `${COLORS.coral}18`, border: `1px solid ${COLORS.coral}`, borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <img src={EDIN_ICON} alt="Edin" style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, objectFit: "cover", marginTop: 2 }} />
            <div style={{ fontSize: 13, color: COLORS.ink, lineHeight: 1.6 }}>{crisisMessage}</div>
          </div>
          <button
            onClick={() => setCrisisMessage(null)}
            style={{ alignSelf: "flex-end", fontSize: 10.5, padding: "4px 10px", borderRadius: 6, border: `1px solid ${COLORS.coral}`, background: "transparent", color: COLORS.coral, cursor: "pointer" }}
          >
            I've seen this
          </button>
        </div>
      )}

      {isEmpty && (
        <div style={{ fontSize: 12.5, color: COLORS.inkDim, fontStyle: "italic" }}>
          No one on the team right now -- add your first member below.
        </div>
      )}

      {!isEmpty && (
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{
          maxWidth: 420,
          background: `radial-gradient(ellipse at center, ${COLORS.bgPanelAlt} 0%, ${COLORS.bg} 75%)`,
          borderRadius: 16, border: `1px solid ${COLORS.grid}`,
        }} height={h}>
          {members.map((m, i) => {
            const angle = (360 / members.length) * i - 90;
            const rad = (angle * Math.PI) / 180;
            const x = cx + r * Math.cos(rad), y = cy + r * Math.sin(rad);
            return (
              <line key={m.id + "-line"} x1={cx} y1={cy} x2={x} y2={y}
                stroke={m.color} strokeWidth={selectedId === m.id ? 2.5 : 1.3} opacity="0.7" />
            );
          })}
          <circle cx={cx} cy={cy} r="42" fill={COLORS.bgPanelAlt} stroke={COLORS.ink} strokeWidth="1.4" />
          <text x={cx} y={cy - 3} textAnchor="middle" fontSize="11" fill={COLORS.ink} fontFamily="Georgia, serif">Inner</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="11" fill={COLORS.ink} fontFamily="Georgia, serif">Team</text>

          {members.map((m, i) => {
            const angle = (360 / members.length) * i - 90;
            const rad = (angle * Math.PI) / 180;
            const x = cx + r * Math.cos(rad), y = cy + r * Math.sin(rad);
            const isSel = selectedId === m.id;
            return (
              <g key={m.id} style={{ cursor: "pointer" }} onClick={() => setSelectedId(m.id)}>
                <circle cx={x} cy={y} r={isSel ? 16 : 12} fill={`${m.color}33`} stroke={m.color} strokeWidth={isSel ? 2.5 : 1.5} />
                {m.mode === "front" && <circle cx={x} cy={y} r={isSel ? 16 : 12} fill="none" stroke={m.color} strokeWidth="0.8" opacity="0.4" />}
                <text
                  x={x + (Math.cos(rad) >= 0 ? 20 : -20)}
                  y={y + 5}
                  fontSize="11" fill={isSel ? m.color : COLORS.ink} fontWeight={isSel ? "600" : "400"}
                  textAnchor={Math.cos(rad) >= 0 ? "start" : "end"}
                >
                  {m.name}
                </text>
              </g>
            );
          })}
        </svg>

        <div style={{ flex: "1 1 260px", minWidth: 260, background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: selected.color }}>{selected.name}</div>
            <div style={{ fontSize: 9, color: modeColor[selected.mode], letterSpacing: 0.4 }}>{modeLabel[selected.mode]}</div>
          </div>
          <div style={{ fontSize: 12.5, color: COLORS.ink, marginBottom: 14, lineHeight: 1.5 }}>{selected.role}</div>
          <div style={{ background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 10, color: COLORS.inkDim, letterSpacing: 0.5 }}>CURRENTLY</div>
              {!editingTask && (
                <button
                  onClick={startEditingTask}
                  style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.inkDim, cursor: "pointer" }}
                >
                  Edit
                </button>
              )}
            </div>
            {editingTask ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <textarea
                  value={taskDraft}
                  onChange={(e) => setTaskDraft(e.target.value)}
                  rows={2}
                  style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 12.5, outline: "none", resize: "vertical", fontFamily: "inherit" }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={saveTask}
                    style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: COLORS.gold, color: "#1C2E24", fontSize: 11.5, cursor: "pointer" }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingTask(false)}
                    style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.inkDim, fontSize: 11.5, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: COLORS.ink }}>{selected.task}</div>
            )}
          </div>
          <button
            onClick={() => deleteMember(selected.id)}
            style={{ fontSize: 11, padding: "5px 12px", borderRadius: 6, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.coral, cursor: "pointer" }}
          >
            Remove from team
          </button>
        </div>
      </div>
      )}

      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          style={{ alignSelf: "flex-start", padding: "9px 18px", borderRadius: 8, border: `1px solid ${COLORS.gold}`, background: `${COLORS.gold}18`, color: COLORS.gold, fontSize: 12.5, cursor: "pointer" }}
        >
          + Add a team member
        </button>
      ) : (
        <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name this part however you want..."
            style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 13, outline: "none" }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            { ["front", "background"].map((mode) => (
              <button
                key={mode}
                onClick={() => setNewMode(mode)}
                style={{
                  padding: "7px 14px", borderRadius: 8,
                  border: `1px solid ${newMode === mode ? modeColor[mode] : COLORS.grid}`,
                  background: newMode === mode ? `${modeColor[mode]}22` : "transparent",
                  color: newMode === mode ? modeColor[mode] : COLORS.inkDim,
                  fontSize: 12, cursor: "pointer",
                }}
              >
                {mode === "front" ? "Front-Space Helper" : "Background Data Runner"}
              </button>
            )) }
          </div>
          <input
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            placeholder="What does it help with? (optional, you can add this later)"
            style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 12.5, outline: "none" }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={addMember}
              style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: COLORS.gold, color: "#1C2E24", fontSize: 13, cursor: "pointer" }}
            >
              Add to Team
            </button>
            <button
              onClick={() => setShowAdd(false)}
              style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.inkDim, fontSize: 12.5, cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ fontSize: 11, color: COLORS.inkDim, fontStyle: "italic" }}>
        Name, remove, and add your own real parts — nothing here is invented for you. No fixed framework
        (IFS or otherwise) required; this map is only as clinical as you want it to be.
      </div>
    </div>
  );
}
