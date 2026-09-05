import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

// session === undefined -> still checking for a persisted session
// session === null      -> logged out
// session === {...}     -> logged in
export function useAuth() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return session;
}
