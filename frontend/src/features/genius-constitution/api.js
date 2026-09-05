// Talks to the FastAPI backend's /genius-constitution-results endpoints
// (see backend/app/main.py). Each full completion of the quiz writes a new
// row (a log of every take, not one user per row); only `intention`,
// entered after the result screen shows, is editable afterward. user_id is
// never sent — the backend derives it from the caller's own verified
// session token.

import { apiRequest } from "../../lib/apiClient";

// The DB (and backend schema) restrict these three columns to a fixed set of
// values. A free-text answer to those scenarios is still preserved in full in
// `answers` below, but can't be written into these constrained columns — so
// it's dropped to null there instead of failing the save outright.
const VALID_FOCUS = ["sleep", "creativity", "health", "identity"];
const VALID_DENSITY = ["full", "guided", "minimal"];
const VALID_TOUCH = ["front", "background", "self"];

function constrainedOrNull(value, allowed) {
  return allowed.includes(value) ? value : null;
}

function fromApiResult(apiResult) {
  return {
    id: apiResult.id,
    answers: apiResult.answers,
    pct: {
      shamanic: apiResult.shamanic_pct,
      hermetic: apiResult.hermetic_pct,
      stoic: apiResult.stoic_pct,
    },
    dominant: apiResult.dominant_orientation,
    focusAnswer: apiResult.focus_answer,
    densityAnswer: apiResult.density_answer,
    touchAnswer: apiResult.touch_answer,
    intention: apiResult.intention,
    createdAt: apiResult.created_at,
  };
}

export async function fetchConstitutionResults() {
  const results = await apiRequest(`/genius-constitution-results`, { method: "GET" });
  return results.map(fromApiResult);
}

export async function createConstitutionResult({ answers, pct, dominant, focusAnswer, densityAnswer, touchAnswer }) {
  const created = await apiRequest(`/genius-constitution-results`, {
    method: "POST",
    body: JSON.stringify({
      answers,
      shamanic_pct: pct.shamanic,
      hermetic_pct: pct.hermetic,
      stoic_pct: pct.stoic,
      dominant_orientation: dominant,
      focus_answer: constrainedOrNull(focusAnswer, VALID_FOCUS),
      density_answer: constrainedOrNull(densityAnswer, VALID_DENSITY),
      touch_answer: constrainedOrNull(touchAnswer, VALID_TOUCH),
    }),
  });
  return fromApiResult(created);
}

export async function updateConstitutionIntention(id, intention) {
  const updated = await apiRequest(`/genius-constitution-results/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ intention }),
  });
  return fromApiResult(updated);
}
