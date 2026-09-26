import { useState, useEffect } from "react";
import { COLORS } from "../../theme/tokens";
import { EDIN_ICON } from "../../assets/edinIcon";
import ConfidenceGauge from "../../components/common/ConfidenceGauge";
import { fetchPlatformHealth, generatePlatformReflection } from "./api";

function StatTile({ label, value }) {
  return (
    <div style={{ background: COLORS.bgPanelAlt, borderRadius: 10, padding: "12px 14px", minWidth: 120 }}>
      <div style={{ fontSize: 20, color: COLORS.ink, fontFamily: "Georgia, serif" }}>{value}</div>
      <div style={{ fontSize: 10, color: COLORS.inkDim, letterSpacing: 0.4, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ fontSize: 11, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

// This is the ONLY place real % is shown for follow-through completion --
// null (no resolved entries yet) renders as a plain dash, never a fake 0%.
function formatPct(rate) {
  return rate === null || rate === undefined ? "—" : `${Math.round(rate * 100)}%`;
}

export default function GeniusProfileHealthView() {
  const [health, setHealth] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [reflection, setReflection] = useState(null);
  const [reflectionAt, setReflectionAt] = useState(null);
  const [reflecting, setReflecting] = useState(false);
  const [reflectionError, setReflectionError] = useState(null);

  useEffect(() => {
    fetchPlatformHealth()
      .then(setHealth)
      .catch((err) => { console.error("Failed to load platform health:", err); setLoadError(err.message); });
  }, []);

  const regenerateReflection = () => {
    setReflecting(true);
    setReflectionError(null);
    generatePlatformReflection()
      .then(({ reflection, generatedAt }) => { setReflection(reflection); setReflectionAt(generatedAt); })
      .catch((err) => { console.error("Failed to generate Edin's reflection:", err); setReflectionError(err.message); })
      .finally(() => setReflecting(false));
  };

  if (loadError) {
    return (
      <div style={{ background: `${COLORS.coral}18`, border: `1px solid ${COLORS.coral}`, borderRadius: 10, padding: "14px 16px", fontSize: 13, color: COLORS.ink }}>
        Couldn't load platform health: {loadError}
      </div>
    );
  }

  if (!health) {
    return <div style={{ fontSize: 12.5, color: COLORS.inkDim, fontStyle: "italic" }}>Loading Genius Profile…</div>;
  }

  const { engagement, follow_through: followThrough, symbol_confirmation: symbolConfirmation, track_b_safety: trackB, constitution_orientation: orientation } = health;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: `${COLORS.violet}14`, border: `1px solid ${COLORS.violet}55`, borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: COLORS.ink, lineHeight: 1.5 }}>
        A real mirror of how Edin's own methods are performing, across every real account. With few real
        users today, small numbers or zeros are honest, not a bug -- nothing here is placeholder data.
      </div>

      <Section title="EDIN'S SELF-REFLECTION">
        {reflectionError && (
          <div style={{ fontSize: 11.5, color: COLORS.coral, marginBottom: 8 }}>Couldn't generate a reflection -- {reflectionError}</div>
        )}
        {reflection ? (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
            <img src={EDIN_ICON} alt="Edin" style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, objectFit: "cover", marginTop: 2 }} />
            <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic", color: COLORS.ink, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {reflection}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: COLORS.inkDim, fontStyle: "italic", marginBottom: 10 }}>
            Edin hasn't reflected on her own system health yet -- generate one below.
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={regenerateReflection}
            disabled={reflecting}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "none", background: COLORS.violet, color: "#FDFEFC",
              fontSize: 12.5, cursor: reflecting ? "default" : "pointer", opacity: reflecting ? 0.6 : 1,
            }}
          >
            {reflecting ? "Reflecting…" : reflection ? "Regenerate" : "Generate reflection"}
          </button>
          {reflectionAt && (
            <div style={{ fontSize: 10.5, color: COLORS.inkDim }}>
              Last checked in: {new Date(reflectionAt).toLocaleString()}
            </div>
          )}
        </div>
      </Section>

      <Section title="ENGAGEMENT">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <StatTile label="TOTAL USERS" value={engagement.total_users} />
          <StatTile label="DREAM ENTRIES" value={engagement.total_dream_entries} />
          <StatTile label="FOLLOW-THROUGHS" value={engagement.total_follow_throughs} />
          <StatTile label="CONSTITUTIONS" value={engagement.total_constitution_results} />
        </div>
      </Section>

      <Section title="FOLLOW-THROUGH -- DID AN INSIGHT BECOME AN ACTION">
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <ConfidenceGauge value={followThrough.completion_rate ?? 0} color={COLORS.teal} />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <StatTile label="DID" value={followThrough.did} />
            <StatTile label="PARTIAL" value={followThrough.partial} />
            <StatTile label="DIDN'T" value={followThrough.didnt} />
            <StatTile label="PENDING" value={followThrough.pending} />
          </div>
        </div>
        <div style={{ fontSize: 10.5, color: COLORS.inkDim, marginTop: 10 }}>
          Completion rate: {formatPct(followThrough.completion_rate)} of resolved intentions {"->"} "did".
          Gauge reads 0% until there's at least one resolved entry.
        </div>
      </Section>

      <Section title="SYMBOL CONFIRMATION -- EVERY REAL PATH, PER CHELSEY'S METHODOLOGY">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <StatTile label="SELF-IDENTIFIED" value={symbolConfirmation.confirmed_self} />
          <StatTile label="ARRIVED KNOWN" value={symbolConfirmation.confirmed_arrived_known} />
          <StatTile label="COACH-AGREED" value={symbolConfirmation.confirmed_coach_agreed} />
          <StatTile label="COACH (LEGACY)" value={symbolConfirmation.confirmed_coach_legacy} />
          <StatTile label="ESTABLISHED, UNNAMED" value={symbolConfirmation.established_recurrence_only} />
          <StatTile label="UNCONFIRMED" value={symbolConfirmation.unconfirmed} />
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          <StatTile label="MEANINGS WITH HISTORY (2+)" value={symbolConfirmation.meanings_with_history} />
          <StatTile label="HIGH SIGNIFICANCE" value={symbolConfirmation.high_significance_count} />
          <StatTile label="RESOLVED" value={symbolConfirmation.resolved} />
        </div>
        <div style={{ fontSize: 10.5, color: COLORS.inkDim, marginTop: 10, lineHeight: 1.5 }}>
          "Meanings with history" is the first real measurement of the spiral/evolution thesis -- worth
          watching even at zero. "Established, unnamed" symbols recur 5+ times but the meaning is still
          the user's to name -- recurrence proves significance, never meaning.
        </div>
      </Section>

      <Section title="TRACK B SAFETY SIGNAL">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{
            background: trackB.unreviewed > 0 ? `${COLORS.coral}22` : COLORS.bgPanelAlt,
            border: trackB.unreviewed > 0 ? `1px solid ${COLORS.coral}` : "none",
            borderRadius: 10, padding: "12px 14px", minWidth: 140,
          }}>
            <div style={{ fontSize: 24, color: trackB.unreviewed > 0 ? COLORS.coral : COLORS.ink, fontFamily: "Georgia, serif" }}>
              {trackB.unreviewed}
            </div>
            <div style={{ fontSize: 10, color: trackB.unreviewed > 0 ? COLORS.coral : COLORS.inkDim, letterSpacing: 0.4, marginTop: 2 }}>
              UNREVIEWED -- HIGHEST PRIORITY
            </div>
          </div>
          <StatTile label="TOTAL FLAGGED" value={trackB.total_flagged} />
          <StatTile label="REVIEWED" value={trackB.reviewed} />
          <StatTile label="LAST 30 DAYS" value={trackB.flagged_last_30_days} />
        </div>
      </Section>

      <Section title="GENIUS CONSTITUTION -- ORIENTATION ACROSS ALL USERS (LATEST RESULT EACH)">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <StatTile label="SHAMANIC (SOUL)" value={orientation.shamanic} />
          <StatTile label="HERMETIC (SUBCONSCIOUS)" value={orientation.hermetic} />
          <StatTile label="STOIC (CONSCIOUS MIND)" value={orientation.stoic} />
        </div>
      </Section>
    </div>
  );
}
