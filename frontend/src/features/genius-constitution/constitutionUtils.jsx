import { DAY1_PATHS } from "./data/constitutionData";

export function computeConstitutionResult(answers) {
  const orientationAnswers = answers.slice(0, 3);
  const focusAnswer = answers[3];
  const densityAnswer = answers[4];
  const touchAnswer = answers[5];
  const counts = { shamanic: 0, hermetic: 0, stoic: 0 };
  orientationAnswers.forEach((w) => { if (counts[w] !== undefined) counts[w]++; });
  const total = orientationAnswers.length || 1;
  const pct = {
    shamanic: Math.round((counts.shamanic / total) * 100),
    hermetic: Math.round((counts.hermetic / total) * 100),
    stoic: Math.round((counts.stoic / total) * 100),
  };
  const dominant = Object.entries(pct).sort((a, b) => b[1] - a[1])[0][0];
  return { pct, dominant, focusAnswer, densityAnswer, touchAnswer, path: DAY1_PATHS[focusAnswer], taken: answers.length > 0 };
}


export function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}


export function pieSlicePath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}
