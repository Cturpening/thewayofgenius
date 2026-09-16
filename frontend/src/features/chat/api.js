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
//
// `nodeKey` -- the body-map node the user currently has open (see
// genius-profile/NeuronRecordEditor.jsx), if any -- is what lets Edin's
// real tool-use (backlog #27, Phase 1) act on "this" node when asked to
// save a story or log a practice, without her ever guessing which node
// that is. Optional: most chat messages have nothing to do with the body
// map at all.
export async function sendChatMessage(text, nodeKey = null) {
  const result = await apiRequest(`/chat-messages`, {
    method: "POST",
    body: JSON.stringify({ text, node_key: nodeKey || undefined }),
  });
  return {
    userMessage: fromApiMessage(result.user_message),
    edinMessage: fromApiMessage(result.edin_message),
    crisisResponse: result.crisis_response || null,
    toolCalls: result.tool_calls || [],
  };
}
