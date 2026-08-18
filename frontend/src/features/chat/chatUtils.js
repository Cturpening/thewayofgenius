import { EDIN_KEYWORD_REPLIES } from "./data/keywordReplies";

export function edinAutoReply(text) {
  const lower = text.toLowerCase();
  for (const entry of EDIN_KEYWORD_REPLIES) {
    if (entry.keywords.some((k) => lower.includes(k))) return entry.reply;
  }
  return "Noted — I don't have a specific real thread to connect that to yet, but I've logged it. Tell me more, or ask about your sleep, the door symbol, your gut, or tonight's practice — those are the ones with real data behind them right now.";
}
