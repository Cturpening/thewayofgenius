// Talks to the FastAPI backend's /follow-through-log endpoints (see
// backend/app/main.py). Converts between the wire shape (snake_case, ISO
// timestamps) and the shape the UI components expect (camelCase, a
// display-friendly `date` string). user_id is never sent — the backend
// derives it from the caller's own verified session token.

import { apiRequest } from "../../lib/apiClient";

function formatEntryDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function fromApiEntry(apiEntry) {
  return {
    id: apiEntry.id,
    date: formatEntryDate(apiEntry.created_at),
    source: apiEntry.source,
    intention: apiEntry.intention,
    status: apiEntry.status,
    note: apiEntry.note || "",
    emotionalShift: apiEntry.emotional_shift,
    edinNote: apiEntry.edin_note || "",
  };
}

export async function fetchFollowThroughs() {
  const entries = await apiRequest(`/follow-through-log`, { method: "GET" });
  return entries.map(fromApiEntry);
}

// Returns { entry, crisisResponse } — crisisResponse is only present when
// Track B's crisis detection fired on this save's intention/note text (see
// backend/app/crisis_detection.py); surface it exactly as given, unmodified.
export async function createFollowThrough({ source, intention }) {
  const created = await apiRequest(`/follow-through-log`, {
    method: "POST",
    body: JSON.stringify({ source, intention }),
  });
  return { entry: fromApiEntry(created.entry), crisisResponse: created.crisis_response || null };
}

export async function updateFollowThrough(id, { intention, status, note, emotionalShift }) {
  const body = {};
  if (intention !== undefined) body.intention = intention;
  if (status !== undefined) body.status = status;
  if (note !== undefined) body.note = note;
  if (emotionalShift !== undefined) body.emotional_shift = emotionalShift;

  const updated = await apiRequest(`/follow-through-log/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return { entry: fromApiEntry(updated.entry), crisisResponse: updated.crisis_response || null };
}
