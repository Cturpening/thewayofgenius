// Shared fetch helper for talking to the FastAPI backend.
//
// Phase 2: every request carries the logged-in user's real Supabase session
// token as a Bearer token. The backend forwards it to Supabase's REST API,
// where Row-Level Security enforces per-user access — this file no longer
// asserts or sends any user id itself.

import { supabase } from "./supabaseClient";

const API_URL = import.meta.env.VITE_API_URL;

function assertConfigured() {
  if (!API_URL) throw new Error("VITE_API_URL is not set — copy frontend/.env.example to frontend/.env");
}

export async function getCurrentUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export async function apiRequest(path, options) {
  assertConfigured();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not logged in");

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API request failed (${res.status}): ${body}`);
  }
  return res.status === 204 ? null : res.json();
}
