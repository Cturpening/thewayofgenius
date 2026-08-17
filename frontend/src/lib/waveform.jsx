export function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Generate a plausible EEG-like waveform biased by band powers


export function generateWave(bandPowers, seed, points = 260) {
  const rand = seededRandom(seed);
  const freqs = [
    { hz: 2, amp: bandPowers.delta },
    { hz: 6, amp: bandPowers.theta * 0.8 },
    { hz: 10, amp: bandPowers.alpha * 0.6 },
    { hz: 20, amp: bandPowers.beta * 0.4 },
  ];
  const wave = [];
  for (let i = 0; i < points; i++) {
    let v = 0;
    freqs.forEach((f) => {
      v += f.amp * Math.sin((i / points) * Math.PI * 2 * f.hz + rand() * 0.5);
    });
    v += (rand() - 0.5) * 0.15;
    wave.push(v);
  }
  return wave;
}
