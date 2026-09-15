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
  updateClientMembership,
  fetchPlans,
  createPlan,
  updatePlan,
} from "./api";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const BILLING_PERIOD_LABEL = { monthly: "/mo", annual: "/yr", one_time: " one-time" };

function formatPrice(priceCents, billingPeriod) {
  return `$${(priceCents / 100).toFixed(2)}${BILLING_PERIOD_LABEL[billingPeriod] || ""}`;
}

export default function CoachDashboardView() {
  const [view, setView] = useState("clients"); // clients | plans
  const [clients, setClients] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [plans, setPlans] = useState([]);
  const [plansError, setPlansError] = useState(null);

  useEffect(() => {
    fetchClients()
      .then((cs) => {
        setClients(cs);
        if (cs.length > 0) setSelectedId(cs[0].id);
      })
      .catch((err) => { console.error("Failed to load clients:", err); setLoadError(err.message); });
    fetchPlans()
      .then(setPlans)
      .catch((err) => { console.error("Failed to load plans:", err); setPlansError(err.message); });
  }, []);

  const selected = clients.find((c) => c.id === selectedId);

  const onClientUpdate = (updated) => setClients((cs) => cs.map((c) => (c.id === updated.id ? updated : c)));
  const onPlanUpdate = (updated) => setPlans((ps) => ps.map((p) => (p.id === updated.id ? updated : p)));
  const onPlanCreate = (created) => setPlans((ps) => [...ps, created]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: `${COLORS.violet}14`, border: `1px solid ${COLORS.violet}55`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        Coach dashboard — every account here, including your own. Real dream journal entries and Genius
        Constitution results, read-only. The chat widget isn't shown — it's illustrative and was never
        persisted server-side, so there's genuinely nothing to read there.
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {["clients", "plans"].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: "7px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12.5, textTransform: "capitalize",
              border: `1px solid ${view === v ? COLORS.violet : COLORS.grid}`,
              background: view === v ? `${COLORS.violet}18` : "transparent",
              color: view === v ? COLORS.violet : COLORS.inkDim,
            }}
          >
            {v === "plans" ? "Membership Plans" : v}
          </button>
        ))}
      </div>

      {loadError && (
        <div style={{ background: `${COLORS.coral}18`, border: `1px solid ${COLORS.coral}`, borderRadius: 10, padding: "14px 16px", fontSize: 13, color: COLORS.ink }}>
          Couldn't load clients: {loadError}
        </div>
      )}

      {view === "plans" ? (
        <PlansManager plans={plans} loadError={plansError} onPlanCreate={onPlanCreate} onPlanUpdate={onPlanUpdate} />
      ) : (
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
              <div style={{ marginTop: 4 }}>
                <span style={{
                  fontSize: 9, padding: "1px 7px", borderRadius: 999,
                  background: c.membershipActive ? `${COLORS.gold}22` : "transparent",
                  color: c.membershipActive ? COLORS.gold : COLORS.inkDim,
                  border: `1px solid ${c.membershipActive ? COLORS.gold : COLORS.grid}`,
                }}>
                  {c.membershipActive ? (c.membershipPlan?.name || "active") : "no active plan"}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {selected ? (
            <ClientDetail
              key={selected.id}
              client={selected}
              plans={plans}
              onClientUpdate={onClientUpdate}
            />
          ) : (
            <div style={{ fontSize: 12.5, color: COLORS.inkDim, fontStyle: "italic" }}>Select a client.</div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

function PlansManager({ plans, loadError, onPlanCreate, onPlanUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const resetForm = () => {
    setKey(""); setName(""); setPrice(""); setBillingPeriod("monthly"); setDescription(""); setShowForm(false);
  };

  const submit = () => {
    const priceCents = Math.round(parseFloat(price || "0") * 100);
    if (!key.trim() || !name.trim() || Number.isNaN(priceCents)) return;
    setSaving(true);
    setError(null);
    createPlan({ key: key.trim(), name: name.trim(), priceCents, billingPeriod, description: description.trim() })
      .then((created) => { onPlanCreate(created); resetForm(); })
      .catch((err) => { console.error("Failed to create plan:", err); setError(err.message); })
      .finally(() => setSaving(false));
  };

  const toggleActive = (plan) => {
    updatePlan(plan.id, { active: !plan.active }).then(onPlanUpdate).catch((err) => console.error("Failed to update plan:", err));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 11.5, color: COLORS.inkDim, lineHeight: 1.5 }}>
        Define each plan once here — name, price, billing period — instead of retyping it on every client.
        Deactivating a plan hides it from new assignments but never touches clients already on it.
      </div>

      {loadError && (
        <div style={{ background: `${COLORS.coral}18`, border: `1px solid ${COLORS.coral}`, borderRadius: 10, padding: "12px 14px", fontSize: 12.5, color: COLORS.ink }}>
          Couldn't load plans: {loadError}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {plans.length === 0 && !loadError && (
          <div style={{ fontSize: 12, color: COLORS.inkDim, fontStyle: "italic" }}>No plans yet — add your first one below.</div>
        )}
        {plans.map((p) => (
          <div key={p.id} style={{ background: COLORS.bgPanel, borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, opacity: p.active ? 1 : 0.55 }}>
            <div>
              <div style={{ fontSize: 13, color: COLORS.ink }}>{p.name} <span style={{ color: COLORS.inkDim, fontSize: 11 }}>({p.key})</span></div>
              <div style={{ fontSize: 11.5, color: COLORS.gold, marginTop: 2 }}>{formatPrice(p.priceCents, p.billingPeriod)}</div>
              {p.description && <div style={{ fontSize: 11, color: COLORS.inkDim, marginTop: 4 }}>{p.description}</div>}
            </div>
            <button
              onClick={() => toggleActive(p)}
              style={{ fontSize: 10.5, padding: "5px 12px", borderRadius: 6, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.inkDim, cursor: "pointer", flexShrink: 0 }}
            >
              {p.active ? "Deactivate" : "Activate"}
            </button>
          </div>
        ))}
      </div>

      {showForm ? (
        <div style={{ background: COLORS.bgPanel, borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="key (e.g. private_200)" style={{ flex: 1, minWidth: 140, padding: "8px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 12.5, outline: "none" }} />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name (e.g. Private Coaching)" style={{ flex: 2, minWidth: 180, padding: "8px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 12.5, outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price in dollars (e.g. 200)" type="number" min="0" step="0.01" style={{ flex: 1, minWidth: 140, padding: "8px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 12.5, outline: "none" }} />
            <select value={billingPeriod} onChange={(e) => setBillingPeriod(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 12.5, outline: "none" }}>
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
              <option value="one_time">One-time</option>
            </select>
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's included (optional)" rows={2} spellCheck style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 12.5, outline: "none", resize: "vertical", fontFamily: "inherit" }} />
          {error && <div style={{ fontSize: 11.5, color: COLORS.coral }}>Couldn't save -- {error}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={submit} disabled={saving} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: COLORS.violet, color: "#FDFEFC", fontSize: 12.5, cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving..." : "Create Plan"}
            </button>
            <button onClick={resetForm} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.inkDim, fontSize: 12.5, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          style={{ alignSelf: "flex-start", padding: "8px 16px", borderRadius: 8, border: `1px solid ${COLORS.gold}`, background: `${COLORS.gold}18`, color: COLORS.gold, fontSize: 12.5, cursor: "pointer" }}
        >
          + New Plan
        </button>
      )}
    </div>
  );
}

function MembershipPanel({ client, plans, onClientUpdate }) {
  const [planId, setPlanId] = useState(client.membershipPlanId || "");
  const [active, setActive] = useState(client.membershipActive);
  const [note, setNote] = useState(client.membershipNote || "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const dirty = planId !== (client.membershipPlanId || "") || active !== client.membershipActive || note !== (client.membershipNote || "");

  // The client's currently-assigned plan should stay selectable even if
  // it's since been deactivated -- otherwise it'd vanish from the
  // dropdown for a client already on it.
  const options = client.membershipPlan && !plans.some((p) => p.id === client.membershipPlan.id)
    ? [...plans, client.membershipPlan]
    : plans;

  const save = () => {
    setSaving(true);
    setSaveError(null);
    updateClientMembership(client.id, { planId: planId || null, active, note: note.trim() || null })
      .then(onClientUpdate)
      .catch((err) => { console.error("Failed to update membership:", err); setSaveError(err.message); })
      .finally(() => setSaving(false));
  };

  return (
    <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ fontSize: 11, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 4 }}>MEMBERSHIP / BILLING</div>
      <div style={{ fontSize: 10.5, color: COLORS.inkDim, marginBottom: 12, lineHeight: 1.5 }}>
        Manual for now — payment happens outside the app (Zelle, wire, invoice), so track it here yourself.
        This becomes automatic once Stripe is wired in, same fields.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 12.5, outline: "none" }}
          >
            <option value="">No plan assigned</option>
            {options.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatPrice(p.priceCents, p.billingPeriod)}{!p.active ? " (inactive)" : ""}
              </option>
            ))}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: COLORS.ink, cursor: "pointer" }}>
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active
          </label>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Billing note (e.g. paid $200 via Zelle 9/13, renews 10/13)"
          rows={2}
          spellCheck
          style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 12.5, outline: "none", resize: "vertical", fontFamily: "inherit" }}
        />
        {saveError && <div style={{ fontSize: 11.5, color: COLORS.coral }}>Couldn't save -- {saveError}</div>}
        <button
          onClick={save}
          disabled={!dirty || saving}
          style={{
            alignSelf: "flex-start", padding: "8px 16px", borderRadius: 8, border: "none",
            background: COLORS.violet, color: "#FDFEFC", fontSize: 12.5,
            cursor: dirty && !saving ? "pointer" : "default", opacity: dirty && !saving ? 1 : 0.5,
          }}
        >
          {saving ? "Saving..." : "Save Membership"}
        </button>
      </div>
    </div>
  );
}

function ClientDetail({ client, plans, onClientUpdate }) {
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
      <MembershipPanel client={client} plans={plans} onClientUpdate={onClientUpdate} />

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
