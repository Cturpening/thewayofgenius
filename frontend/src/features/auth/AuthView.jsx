import { useState } from "react";
import { COLORS } from "../../theme/tokens";
import { supabase } from "../../lib/supabaseClient";

// Functional, not polished — real sign-up/login/session, minimal styling.
export default function AuthView() {
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkEmailMessage, setCheckEmailMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setCheckEmailMessage("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setCheckEmailMessage("Account created — check your email to confirm it before logging in.");
        }
      } else if (mode === "forgot") {
        // redirectTo: the same site the user is already on -- Supabase
        // appends its own recovery token to this URL, and useAuth.js's
        // PASSWORD_RECOVERY listener picks it up from there. No separate
        // route needed since this app has no client-side router.
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (resetError) throw resetError;
        setCheckEmailMessage("If that email has an account, a reset link is on its way — check your inbox.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next) => { setMode(next); setError(""); setCheckEmailMessage(""); };

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: COLORS.ink, textAlign: "center" }}>
        {mode === "login" ? "Log in" : mode === "signup" ? "Sign up" : "Reset your password"}
      </div>
      {mode === "forgot" && (
        <div style={{ fontSize: 12.5, color: COLORS.inkDim, textAlign: "center", marginTop: -8 }}>
          Enter your email and we'll send a real link to reset your password.
        </div>
      )}

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 13, outline: "none" }}
        />
        {mode !== "forgot" && (
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${COLORS.grid}`, background: COLORS.bg, color: COLORS.ink, fontSize: 13, outline: "none" }}
          />
        )}
        <button
          type="submit"
          disabled={loading}
          style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: COLORS.violet, color: "#FDFEFC", fontSize: 13, cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "Working..." : mode === "login" ? "Log in" : mode === "signup" ? "Sign up" : "Send reset link"}
        </button>
      </form>

      {error && <div style={{ fontSize: 12, color: COLORS.coral }}>{error}</div>}
      {checkEmailMessage && <div style={{ fontSize: 12, color: COLORS.teal }}>{checkEmailMessage}</div>}

      {mode === "login" && (
        <button
          onClick={() => switchMode("forgot")}
          style={{ border: "none", background: "transparent", color: COLORS.inkDim, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
        >
          Forgot your password?
        </button>
      )}

      <button
        onClick={() => switchMode(mode === "signup" ? "login" : mode === "forgot" ? "login" : "signup")}
        style={{ border: "none", background: "transparent", color: COLORS.inkDim, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
      >
        {mode === "login" ? "Need an account? Sign up" : mode === "signup" ? "Already have an account? Log in" : "Back to log in"}
      </button>
    </div>
  );
}
