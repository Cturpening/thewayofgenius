import { COLORS } from "../../theme/tokens";
import { LESSON_TOPIC_TEMPLATES } from "./data/lessonTopicTemplates";

export function generatePersonalLesson(prompt) {
  const lower = prompt.toLowerCase();
  for (const t of LESSON_TOPIC_TEMPLATES) {
    if (t.keywords.some((k) => lower.includes(k))) {
      return { title: t.title, color: t.color, body: t.body, goalPrompt: t.goalPrompt };
    }
  }
  return {
    title: `A Lesson On: ${prompt.length > 46 ? prompt.slice(0, 46) + "…" : prompt}`,
    color: COLORS.gold,
    body: `You asked Edin to build this around "${prompt}." Real starting point, same as every lesson here: your subconscious is already working on this, ahead of your conscious mind — the goal isn't to force an answer but to ask a direct, specific question and let it actually work. As you use this lesson and log what happens, Edin builds out the real version of this over time instead of a one-time guess.`,
    goalPrompt: "Ask yourself the most specific version of this question you can before you sleep tonight — specific gets a trackable answer, vague gets static.",
  };
}


export function EDIN_JOURNAL_NOTE(text) {
  const lower = text.toLowerCase();
  if (lower.includes("fuzzy") || lower.includes("forgot") || lower.includes("can't remember") || lower.includes("cant remember")) {
    return "Logged as a recall-blocker moment — real, not a failure. Those tend to loosen with repetition, not force.";
  }
  if (lower.includes("woke up") || lower.includes("startled") || lower.includes("jolt")) {
    return "Logged as a waking-activation moment — worth noting what you were mid-processing when it happened.";
  }
  if (lower.includes("clicked") || lower.includes("realized") || lower.includes("makes sense") || lower.includes("understood")) {
    return "Logged as an integration-milestone — this is the kind of entry the Dream Arc View is built to track over time.";
  }
  if (lower.includes("tight") || lower.includes("tension") || lower.includes("felt in") || lower.includes("body")) {
    return "Logged as a biofeedback-signal moment — noted alongside anything already tracked in your Symbol Body Map.";
  }
  return "Logged to your journal for this lesson. Nothing forced here — even a quiet or uneventful entry is real information.";
}
