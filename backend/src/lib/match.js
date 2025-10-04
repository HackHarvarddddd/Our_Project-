export function cosineSim(a, b) {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const na = Math.sqrt(a.reduce((s, v) => s + v*v, 0));
  const nb = Math.sqrt(b.reduce((s, v) => s + v*v, 0));
  if (na === 0 || nb === 0) return 0;
  return dot / (na * nb);
}

export function sharedAvailability(avA=[], avB=[]) {
  const setB = new Set(avB);
  return avA.filter(x => setB.has(x));
}
