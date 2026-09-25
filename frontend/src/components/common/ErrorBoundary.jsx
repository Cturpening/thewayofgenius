import { Component } from "react";
import { COLORS } from "../../theme/tokens";

// React only supports catching render errors with a class component --
// there's no hook equivalent (as of this writing). Without this, any
// single component throwing anywhere in the tree unmounts the whole app
// and leaves a blank white screen with zero explanation, recoverable only
// by a hard refresh. Real risk in this app specifically: LivingMap's
// Three.js/WebGL code is the newest, least-battle-tested surface, which
// is why it gets its own nested boundary below in addition to the
// App-level one -- a crash in the hologram shouldn't take down chat,
// goals, the journal, everything else.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Real error, not swallowed -- shows up in the browser console and
    // (once real error tracking exists) is the hook point for reporting
    // it somewhere durable instead of just the user's own DevTools.
    console.error("Caught by ErrorBoundary:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const { label = "Something", compact = false } = this.props;
    return (
      <div style={{
        padding: compact ? 16 : 40, textAlign: "center", display: "flex",
        flexDirection: "column", alignItems: "center", gap: 10,
        background: COLORS.bgPanel, borderRadius: 12,
      }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: compact ? 15 : 18, color: COLORS.ink }}>
          {label} hit a real error and couldn't load.
        </div>
        <div style={{ fontSize: 12, color: COLORS.inkDim, maxWidth: 420 }}>
          Nothing else in the app should be affected -- this is contained
          to this one section. Reloading usually clears it; if it keeps
          happening, that's worth reporting as a real bug.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: COLORS.violet, color: "#FDFEFC", fontSize: 13, cursor: "pointer" }}
        >
          Reload
        </button>
      </div>
    );
  }
}
