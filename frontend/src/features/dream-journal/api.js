// Talks to the FastAPI backend's /dream-entries endpoints (see
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
    title: apiEntry.title,
    tags: apiEntry.tags,
    lines: apiEntry.lines,
    edinNote: apiEntry.edin_note,
    edited: apiEntry.updated_at !== apiEntry.created_at,
  };
}

export async function fetchDreamEntries() {
  const entries = await apiRequest(`/dream-entries`, { method: "GET" });
  return entries.map(fromApiEntry);
}

// Returns { entry, crisisResponse } — crisisResponse is only present when
// Track B's crisis detection fired on this save (see
// backend/app/crisis_detection.py); the caller should surface it exactly
// as given, unmodified, same as a real safety message would need to be.
export async function createDreamEntry({ title, lines, tags, edinNote }) {
  const created = await apiRequest(`/dream-entries`, {
    method: "POST",
    body: JSON.stringify({ title, lines, tags, edin_note: edinNote }),
  });
  return { entry: fromApiEntry(created.entry), crisisResponse: created.crisis_response || null };
}

export async function updateDreamEntry(id, { title, lines, tags, edinNote }) {
  const body = {};
  if (title !== undefined) body.title = title;
  if (lines !== undefined) body.lines = lines;
  if (tags !== undefined) body.tags = tags;
  if (edinNote !== undefined) body.edin_note = edinNote;

  const updated = await apiRequest(`/dream-entries/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return { entry: fromApiEntry(updated.entry), crisisResponse: updated.crisis_response || null };
}

export async function deleteDreamEntry(id) {
  await apiRequest(`/dream-entries/${id}`, { method: "DELETE" });
}
