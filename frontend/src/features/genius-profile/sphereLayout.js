// Shared 3D layout math for every hologram scene in the Genius Profile.
export function fibonacciSpherePosition(index, total, radius) {
  const offset = 2 / total;
  const increment = Math.PI * (3 - Math.sqrt(5));
  const y = index * offset - 1 + offset / 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const phi = index * increment;
  return [Math.cos(phi) * r * radius, y * radius, Math.sin(phi) * r * radius];
}
