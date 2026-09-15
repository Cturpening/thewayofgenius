// Talks to the FastAPI backend's real, persisted /chat-messages endpoints
// (see backend/app/main.py) -- replaces the old scan-only endpoint and the
// illustrative, client-side-only replies in chatUtils.js. Every message
// still goes through Track B server-side before Edin's real reply is
// generated; see protocols/03_Crisis_Escalation_Protocol.md.

import { apiRequest } from "../../lib/apiClient";

function fromApiMessage(m) {
  return { id: m.id, from: m.role === "user" ? "user" : "edin", text: m.content, createdAt: m.created_at };
}

export async function fetchChatMessages() {
  const messages = await apiRequest(`/chat-messages`, { method: "GET" });
  return messages.map(fromApiMessage);
}

// Returns { userMessage, edinMessage, crisisResponse } -- both messages
// are already persisted by the time this resolves, so a page reload
// shows the same conversation. crisisResponse is only present when
// Track B's override fired on this message, same contract as every
// other crisis_response in this app.
export async function sendChatMessage(text) {
  const result = await apiRequest(`/chat-messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  return {
    userMessage: fromApiMessage(result.user_message),
    edinMessage: fromApiMessage(result.edin_message),
    crisisResponse: result.crisis_response || null,
  };
}
