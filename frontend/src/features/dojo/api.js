// Talks to the FastAPI backend's /edin/checkin endpoint (see
// backend/app/main.py). Real recency data, not AI-generated -- no quota
// cost, no wait, safe to fetch on every visit to the Dojo.

import { apiRequest } from "../../lib/apiClient";

function fromApiSuggestion(s) {
  return {
    area: s.area,
    label: s.label,
    lastAt: s.last_at,
    daysSince: s.days_since,
    isStale: s.is_stale,
    staleAfterDays: s.stale_after_days,
  };
}

export async function fetchCheckIn() {
  const result = await apiRequest("/edin/checkin", { method: "GET" });
  return result.suggestions.map(fromApiSuggestion);
}

// --- Inner Team (see backend/app/team_tools.py) -----------------------
// Real persistence -- until now this was pure frontend state
// (INITIAL_TEAM_MEMBERS reset back on every reload). Same shape either
// way: { id, name, mode, color, role, task }.

function fromApiMember(m) {
  return {
    id: m.id,
    name: m.name,
    mode: m.mode,
    color: m.color,
    role: m.role || "Role still taking shape.",
    task: m.task || "No current task assigned yet.",
  };
}

export async function fetchTeamMembers() {
  const members = await apiRequest("/team-members", { method: "GET" });
  return members.map(fromApiMember);
}

// Returns { member, crisisResponse } -- crisisResponse is only present
// when Track B's crisis detection fired on this save's name/role text,
// same contract as every other crisis_response in this app.
export async function createTeamMember({ name, mode, color, role }) {
  const created = await apiRequest("/team-members", {
    method: "POST",
    body: JSON.stringify({ name, mode, color, role: role || undefined }),
  });
  return { member: fromApiMember(created.member), crisisResponse: created.crisis_response || null };
}

export async function updateTeamMember(id, { name, role, task }) {
  const body = {};
  if (name !== undefined) body.name = name;
  if (role !== undefined) body.role = role;
  if (task !== undefined) body.task = task;
  const updated = await apiRequest(`/team-members/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return { member: fromApiMember(updated.member), crisisResponse: updated.crisis_response || null };
}

export async function deleteTeamMember(id) {
  await apiRequest(`/team-members/${id}`, { method: "DELETE" });
}
