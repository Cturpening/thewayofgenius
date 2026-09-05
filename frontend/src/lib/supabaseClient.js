import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set — copy frontend/.env.example to frontend/.env"
  );
}

// Uses the anon/publishable key only — safe to ship in the frontend bundle.
// Never put the service_role key here.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
