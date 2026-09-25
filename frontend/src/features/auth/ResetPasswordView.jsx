import { useState } from "react";
import { COLORS } from "../../theme/tokens";
import { supabase } from "../../lib/supabaseClient";

// Shown when someone opens a real "reset your password" email link --
// see useAuth.js's isPasswordRecovery. Supabase has already given them a
// valid (temporary) session by the time this renders, so this is just a
// plain "set a new password" form, not a token-entry flow.
export default function ResetPasswordView({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Those two passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={{ maxWidth: 360, margin: "80px auto", display: "flex", flexDirection: "column", gap: 16, textAlign: "center" }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: COLORS.ink }}>Password updated</div>
        <div style={{ fontSize: 13, color: COLORS.inkDim }}>You're all set — continue into the app whenever you're ready.</div>
        <button
          onClick={onDone}
          style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: COLORS.violet, color: "#FDFEFC", fontSize: 13, cursor: "pointer" }}
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: COLORS.ink, textAlign: "center" }}>Set a new password</div>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          required
          minLength={6}
          style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 13, outline: "none" }}
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
          required
          minLength={6}
          style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 13, outline: "none" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: COLORS.violet, color: "#FDFEFC", fontSize: 13, cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "Working..." : "Set new password"}
        </button>
      </form>
      {error && <div style={{ fontSize: 12, color: COLORS.coral }}>{error}</div>}
    </div>
  );
}
