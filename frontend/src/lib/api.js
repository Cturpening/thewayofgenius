// Thin client for the FastAPI backend (../../backend). Everything here is
// best-effort: if the backend isn't running, callers fall back to the
// existing demo data rather than breaking the app -- see how App.jsx uses
// this.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// There's no real sign-up/login yet (see ../../../SETUP.md), so each
// browser gets a stable random id standing in for a real user_id. This
// goes away once real auth exists -- it's a placeholder, not a design.
const DEV_USER_ID_KEY = "edin_dev_user_id";

export function getOrCreateUserId() {
  let id = localStorage.getItem(DEV_USER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEV_USER_ID_KEY, id);
  }
  return id;
}

function formatEntryDate(createdAt) {
  if (!createdAt) return "";
  return new Date(createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Maps the backend's shape (snake_case, edin_note, created_at) to the
// shape DreamJournalView already expects (camelCase edinNote, a display
// "date" string).
function mapEntryFromApi(apiEntry) {
  return {
    id: apiEntry.id,
    date: formatEntryDate(apiEntry.created_at),
    title: apiEntry.title || "Untitled entry",
    tags: apiEntry.tags || [],
    lines: apiEntry.lines || [],
    edinNote: apiEntry.edin_note || "",
  };
}

export async function fetchJournalEntries(userId) {
  const res = await fetch(`${API_BASE_URL}/journal-entries?user_id=${userId}`);
  if (!res.ok) throw new Error(`GET /journal-entries failed: ${res.status}`);
  const data = await res.json();
  return data.map(mapEntryFromApi);
}

// Returns { entry, crisisResponse }. crisisResponse is set only when
// Track B's crisis override fired for this entry -- see
// protocols/03_Crisis_Escalation_Protocol.md.
export async function createJournalEntry({ userId, title, lines, tags, edinNote }) {
  const res = await fetch(`${API_BASE_URL}/journal-entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      title,
      lines,
      tags,
      edin_note: edinNote,
    }),
  });
  if (!res.ok) throw new Error(`POST /journal-entries failed: ${res.status}`);
  const data = await res.json();
  return {
    entry: mapEntryFromApi(data.entry),
    crisisResponse: data.crisis_response || null,
  };
}
