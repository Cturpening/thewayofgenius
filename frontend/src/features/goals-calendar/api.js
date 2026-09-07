// Talks to the FastAPI backend's /goals and /calendar-events endpoints (see
// backend/app/main.py). user_id is never sent — the backend derives it from
// the caller's own verified session token, same as every other api.js here.

import { apiRequest } from "../../lib/apiClient";

function fromApiGoal(apiGoal) {
  return {
    id: apiGoal.id,
    name: apiGoal.name,
    modality: apiGoal.modality,
    progress: apiGoal.progress,
  };
}

export async function fetchGoals() {
  const goals = await apiRequest(`/goals`, { method: "GET" });
  return goals.map(fromApiGoal);
}

// Returns { goal, crisisResponse } — crisisResponse is only present when
// Track B's crisis detection fired on this save's name text (see
// backend/app/crisis_detection.py); surface it exactly as given, unmodified.
export async function createGoal({ name, modality }) {
  const created = await apiRequest(`/goals`, {
    method: "POST",
    body: JSON.stringify({ name, modality }),
  });
  return { goal: fromApiGoal(created.goal), crisisResponse: created.crisis_response || null };
}

export async function updateGoal(id, { name, progress }) {
  const body = {};
  if (name !== undefined) body.name = name;
  if (progress !== undefined) body.progress = progress;

  const updated = await apiRequest(`/goals/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return { goal: fromApiGoal(updated.goal), crisisResponse: updated.crisis_response || null };
}

export async function deleteGoal(id) {
  await apiRequest(`/goals/${id}`, { method: "DELETE" });
}

function fromApiEvent(apiEvent) {
  return {
    id: apiEvent.id,
    goalId: apiEvent.goal_id || null,
    day: apiEvent.day,
    label: apiEvent.label,
    category: apiEvent.category,
  };
}

export async function fetchCalendarEvents() {
  const events = await apiRequest(`/calendar-events`, { method: "GET" });
  return events.map(fromApiEvent);
}

// Returns { event, crisisResponse } — same crisis-detection contract as createGoal above.
// `goalId` is optional -- makes real the "linked goal" the week grid already described.
export async function createCalendarEvent({ day, label, category, goalId }) {
  const created = await apiRequest(`/calendar-events`, {
    method: "POST",
    body: JSON.stringify({ day, label, category, goal_id: goalId || null }),
  });
  return { event: fromApiEvent(created.event), crisisResponse: created.crisis_response || null };
}

export async function deleteCalendarEvent(id) {
  await apiRequest(`/calendar-events/${id}`, { method: "DELETE" });
}
