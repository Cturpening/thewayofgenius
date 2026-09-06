// Talks to the FastAPI backend's /chat-messages/scan endpoint (see
// backend/app/main.py). The chat widget's replies are illustrative/
// client-side (see chatUtils.js) -- this call exists purely so every
// message a user types still goes through Track B crisis detection
// before that canned reply is shown. See
// protocols/03_Crisis_Escalation_Protocol.md.

import { apiRequest } from "../../lib/apiClient";

// Returns the crisis override message (a string) if Track B fired on this
// text, or null otherwise. Never throws for a normal message -- only a
// real network/auth failure propagates, same as every other api.js here.
export async function scanChatMessage(text) {
  const result = await apiRequest(`/chat-messages/scan`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  return result.crisis_response || null;
}
