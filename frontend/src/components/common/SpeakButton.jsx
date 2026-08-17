import { useState } from "react";
import { COLORS } from "../../theme/tokens";
import { stopSpeaking } from "../../lib/speech";

export default function SpeakButton({ text, small }) {
  const [speaking, setSpeaking] = useState(false);
  const handleClick = () => {
    if (speaking) { stopSpeaking(); setSpeaking(false); return; }
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };
  return (
    <button
      onClick={handleClick}
      title={speaking ? "Stop reading aloud" : "Read aloud"}
      style={{
        fontSize: small ? 10 : 11, padding: small ? "3px 8px" : "4px 10px", borderRadius: 6,
        border: `1px solid ${speaking ? COLORS.teal : COLORS.grid}`,
        background: speaking ? `${COLORS.teal}22` : "transparent",
        color: speaking ? COLORS.teal : COLORS.inkDim,
        cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
      }}
    >
      {speaking ? "⏹ Stop" : "🔊 Listen"}
    </button>
  );
}
