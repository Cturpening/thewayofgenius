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
