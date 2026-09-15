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

function fromApiPlan(p) {
  return {
    id: p.id,
    key: p.key,
    name: p.name,
    priceCents: p.price_cents,
    billingPeriod: p.billing_period,
    description: p.description,
    active: p.active,
  };
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
    membershipPlanId: c.membership_plan_id,
    membershipPlan: c.membership_plan ? fromApiPlan(c.membership_plan) : null,
    membershipActive: c.membership_active,
    membershipNote: c.membership_note,
  };
}

export async function fetchClients() {
  const clients = await apiRequest(`/coach/clients`, { method: "GET" });
  return clients.map(fromApiClient);
}

// Manual Phase 1 billing tracking -- payment happens outside the app
// (Zelle, wire, invoice) and this just records what you already know.
// Same fields a real Stripe webhook will update automatically later.
// Pass planId: null to unassign a client's plan.
export async function updateClientMembership(clientId, { planId, active, note }) {
  const body = {};
  if (planId !== undefined) body.membership_plan_id = planId;
  if (active !== undefined) body.membership_active = active;
  if (note !== undefined) body.membership_note = note;

  const updated = await apiRequest(`/coach/clients/${clientId}/membership`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return fromApiClient(updated);
}

// Real, editable plan catalog -- define a plan once (name, price, billing
// period), assign it to clients from the Membership panel instead of
// retyping a label each time. See database/schema.sql's membership_plans.
export async function fetchPlans() {
  const plans = await apiRequest(`/coach/plans`, { method: "GET" });
  return plans.map(fromApiPlan);
}

export async function createPlan({ key, name, priceCents, billingPeriod, description }) {
  const created = await apiRequest(`/coach/plans`, {
    method: "POST",
    body: JSON.stringify({ key, name, price_cents: priceCents, billing_period: billingPeriod, description: description || null }),
  });
  return fromApiPlan(created);
}

export async function updatePlan(planId, { name, priceCents, billingPeriod, description, active }) {
  const body = {};
  if (name !== undefined) body.name = name;
  if (priceCents !== undefined) body.price_cents = priceCents;
  if (billingPeriod !== undefined) body.billing_period = billingPeriod;
  if (description !== undefined) body.description = description;
  if (active !== undefined) body.active = active;

  const updated = await apiRequest(`/coach/plans/${planId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return fromApiPlan(updated);
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
