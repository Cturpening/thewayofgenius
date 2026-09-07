import { COLORS } from "../../theme/tokens";
import { EDIN_ICON } from "../../assets/edinIcon";
import AuthView from "../auth/AuthView";

const FEATURES = [
  {
    title: "Dream Journal",
    color: COLORS.violet,
    desc: "Write down what you remember. Edin reflects on it — patterns across entries, symbols that keep recurring, nothing invented and nothing diagnosed.",
  },
  {
    title: "Genius Constitution",
    color: COLORS.gold,
    desc: "A short scenario-based read on your natural orientation — shamanic, hermetic, or stoic. A starting lean to build from, not a label you're stuck with.",
  },
  {
    title: "Follow-Through Log",
    color: COLORS.coral,
    desc: "The honest measure of whether an insight actually became an action. Every entry tracked to what really happened, not what was supposed to.",
  },
  {
    title: "Edin",
    color: COLORS.teal,
    desc: "The coaching presence tying it together — curious, grounded, never diagnostic. Holds a hypothesis loosely until you or your coach confirm it.",
  },
];

export default function LandingView() {
  const scrollToAuth = () => document.getElementById("landing-auth")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 24px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={EDIN_ICON} alt="Edin" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
            <span style={{ fontFamily: "Georgia, serif", fontSize: 16, color: COLORS.ink }}>The Way of Genius</span>
          </div>
          <button
            onClick={scrollToAuth}
            style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: "transparent", color: COLORS.inkDim, fontSize: 13, cursor: "pointer" }}
          >
            Log In
          </button>
        </header>

        <section style={{ padding: "60px 0 40px", textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, color: COLORS.gold, marginBottom: 16 }}>PRIVATE BETA — BY INVITATION</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 38, color: COLORS.ink, lineHeight: 1.25, margin: "0 0 18px" }}>
            Your dreams, your patterns, your own data —<br />with a coaching presence that actually reads it.
          </h1>
          <p style={{ fontSize: 15, color: COLORS.inkDim, lineHeight: 1.6, maxWidth: 560, margin: "0 auto 32px" }}>
            Edin is a dream journal, a self-orientation assessment, and a follow-through
            tracker, held together by an AI coaching presence built to reflect accurately —
            not flatter, not diagnose, not perform mysticism it can't back up.
          </p>
          <button
            onClick={scrollToAuth}
            style={{ padding: "12px 28px", borderRadius: 10, border: "none", background: COLORS.violet, color: "#FDFEFC", fontSize: 14, cursor: "pointer" }}
          >
            Get Started
          </button>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, padding: "20px 0 50px" }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{ background: COLORS.bgPanel, borderRadius: 14, padding: "20px 20px", borderTop: `3px solid ${f.color}` }}>
              <div style={{ fontSize: 14, color: f.color, marginBottom: 8, fontFamily: "Georgia, serif" }}>{f.title}</div>
              <div style={{ fontSize: 12.5, color: COLORS.ink, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </section>

        <section style={{ background: COLORS.bgPanelAlt, borderRadius: 14, padding: "24px 28px", marginBottom: 50 }}>
          <div style={{ fontSize: 11, color: COLORS.inkDim, letterSpacing: 0.5, marginBottom: 10 }}>WHY "BY INVITATION"</div>
          <p style={{ fontSize: 13, color: COLORS.ink, lineHeight: 1.7, margin: 0 }}>
            This is early. For now, every account is closely coached rather than
            self-serve at scale — real dream data and a real person reading it, not a
            product tuned for a crowd yet. If you're here, someone gave you this link on
            purpose.
          </p>
        </section>

        <section id="landing-auth" style={{ paddingBottom: 80 }}>
          <AuthView />
        </section>
      </div>
    </div>
  );
}
