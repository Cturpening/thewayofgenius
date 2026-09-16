// Talks to the FastAPI backend's /neuron-records endpoints (see
// backend/app/main.py). One record per node a user has actually filled
// something in on, keyed by the same node_key string LivingMap.jsx and
// BodySystemsMapView.jsx already build to identify a node ("body-signal:
// nervous__cerebrum__2" etc.) -- no separate id scheme, no per-node fetch.

import { apiRequest } from "../../lib/apiClient";

function fromApiRecord(r) {
  return {
    nodeKey: r.node_key,
    story: r.story || "",
    skill: r.skill || "",
    practiceGoal: r.practice_goal || "",
    vitalsNote: r.vitals_note || "",
    dreamContent: r.dream_content || "",
    progressState: r.progress_state,
    practiceCount: r.practice_count,
    lastPracticedAt: r.last_practiced_at,
  };
}

// Returns a plain object keyed by nodeKey -- the shape every caller in this
// feature actually wants (a lookup while rendering a node), not an array
// that has to be re-indexed on every render.
export async function fetchNeuronRecords() {
  const records = await apiRequest("/neuron-records", { method: "GET" });
  const byNodeKey = {};
  for (const r of records) byNodeKey[r.node_key] = fromApiRecord(r);
  return byNodeKey;
}

// `fields` is whatever subset of {story, skill, practiceGoal, vitalsNote,
// dreamContent, progressState} the caller's form actually shows -- only
// those keys are sent, matching NeuronRecordUpsert's all-optional fields.
export async function saveNeuronRecord(nodeKey, fields) {
  const body = {};
  if (fields.story !== undefined) body.story = fields.story;
  if (fields.skill !== undefined) body.skill = fields.skill;
  if (fields.practiceGoal !== undefined) body.practice_goal = fields.practiceGoal;
  if (fields.vitalsNote !== undefined) body.vitals_note = fields.vitalsNote;
  if (fields.dreamContent !== undefined) body.dream_content = fields.dreamContent;
  if (fields.progressState !== undefined) body.progress_state = fields.progressState;

  const updated = await apiRequest(`/neuron-records/${encodeURIComponent(nodeKey)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return fromApiRecord(updated);
}

// One practice rep against this node -- see log_neuron_practice in
// backend/app/main.py for how progress_state auto-advances from this.
export async function logNeuronPractice(nodeKey) {
  const updated = await apiRequest(`/neuron-records/${encodeURIComponent(nodeKey)}/log-practice`, {
    method: "POST",
  });
  return fromApiRecord(updated);
}

export async function deleteNeuronRecord(nodeKey) {
  await apiRequest(`/neuron-records/${encodeURIComponent(nodeKey)}`, { method: "DELETE" });
}
