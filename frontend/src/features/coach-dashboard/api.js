// Talks to the FastAPI backend's /coach/* endpoints (see backend/app/main.py
// and its "Coach dashboard" README section). Every one of these requires
// the caller's profiles.is_coach flag to be set server-side -- a 403 here
// isn't a bug, it means the caller isn't a coach.

import { apiRequest } from "../../lib/apiClient";

// Used to decide whether to show the dashboard nav item at all -- resolves
// to false rather than throwing, since "not a coach" is the expected
// outcome for almost every account.
export async function checkIsCoach() {
  try {
    await apiRequest(`/coach/status`, { method: "GET" });
    return true;
  } catch {
    return false;
  }
}

function fromApiClient(c) {
  return {
    id: c.id,
    displayName: c.display_name,
    isSelf: c.is_self,
    dreamEntryCount: c.dream_entry_count,
    constitutionCount: c.constitution_count,
    goalCount: c.goal_count,
    followThroughRate: c.follow_through_rate,
  };
}

export async function fetchClients() {
  const clients = await apiRequest(`/coach/clients`, { method: "GET" });
  return clients.map(fromApiClient);
}

function fromApiDreamEntry(e) {
  return {
    id: e.id,
    title: e.title,
    lines: e.lines,
    tags: e.tags,
    edinNote: e.edin_note,
    createdAt: e.created_at,
  };
}

export async function fetchClientDreamEntries(clientId) {
  const entries = await apiRequest(`/coach/clients/${clientId}/dream-entries`, { method: "GET" });
  return entries.map(fromApiDreamEntry);
}

function fromApiConstitutionResult(r) {
  return {
    id: r.id,
    dominant: r.dominant_orientation,
    pct: { shamanic: r.shamanic_pct, hermetic: r.hermetic_pct, stoic: r.stoic_pct },
    intention: r.intention,
    edinNote: r.edin_note,
    createdAt: r.created_at,
  };
}

export async function fetchClientConstitutionResults(clientId) {
  const results = await apiRequest(`/coach/clients/${clientId}/constitution-results`, { method: "GET" });
  return results.map(fromApiConstitutionResult);
}

function fromApiNote(n) {
  return { id: n.id, note: n.note, createdAt: n.created_at };
}

export async function fetchClientNotes(clientId) {
  const notes = await apiRequest(`/coach/clients/${clientId}/notes`, { method: "GET" });
  return notes.map(fromApiNote);
}

export async function addClientNote(clientId, note) {
  const created = await apiRequest(`/coach/clients/${clientId}/notes`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
  return fromApiNote(created);
}

// Returns a plain array of validated tag strings for this client.
export async function fetchSymbolValidations(clientId) {
  const rows = await apiRequest(`/coach/clients/${clientId}/symbol-validations`, { method: "GET" });
  return rows.map((r) => r.tag);
}

export async function validateSymbol(clientId, tag) {
  await apiRequest(`/coach/clients/${clientId}/symbol-validations`, {
    method: "POST",
    body: JSON.stringify({ tag }),
  });
}

export async function unvalidateSymbol(clientId, tag) {
  await apiRequest(`/coach/clients/${clientId}/symbol-validations/${encodeURIComponent(tag)}`, { method: "DELETE" });
}
