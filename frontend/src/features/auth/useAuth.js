import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

// session === undefined -> still checking for a persisted session
// session === null      -> logged out
// session === {...}     -> logged in
//
// isPasswordRecovery: true the moment someone opens a real "reset your
// password" email link while the app is loaded -- Supabase fires a
// PASSWORD_RECOVERY auth event and hands them a temporary session before
// `session` itself updates. App.jsx checks this ahead of the normal
// logged-in/logged-out branching so that temporary session lands on a
// "set a new password" screen (see ResetPasswordView.jsx), not the
// regular app with a session nobody asked to be logged into.
export function useAuth() {
  const [session, setSession] = useState(undefined);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === "PASSWORD_RECOVERY") setIsPasswordRecovery(true);
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return { session, isPasswordRecovery, clearPasswordRecovery: () => setIsPasswordRecovery(false) };
}
