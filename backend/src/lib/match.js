// Similarity utilities

export function cosineSim(a, b) {
  const n = Math.min(a.length, b.length);
  if (!n) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i=0;i<n;i++) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    dot += x*y;
    na += x*x;
    nb += y*y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / Math.sqrt(na * nb);
}

/**
 * Compute per-dimension mean and (unbiased) std for a set of vectors
 * Vectors may have different lengths; we align to the minimum length by default.
 */
export function meanStd(vectors, dim = null) {
  if (!Array.isArray(vectors) || vectors.length === 0) {
    return { mean: [], std: [] };
  }
  const L = dim ?? Math.min(...vectors.map(v => v?.length ?? 0));
  const mean = new Array(L).fill(0);
  const m2 = new Array(L).fill(0);
  let count = 0;

  for (const v of vectors) {
    if (!Array.isArray(v)) continue;
    const n = Math.min(L, v.length);
    for (let i=0;i<n;i++) {
      const x = Number(v[i]) || 0;
      const delta = x - mean[i];
      mean[i] += delta / (count + 1);
      const delta2 = x - mean[i];
      m2[i] += delta * delta2;
    }
    count++;
  }

  const std = new Array(L);
  for (let i=0;i<L;i++) {
    // population std if count < 2
    std[i] = count > 1 ? Math.sqrt(m2[i] / (count - 1)) : 1;
    if (std[i] === 0) std[i] = 1; // avoid div-by-zero
  }
  return { mean, std };
}

export function zscore(v, mean, std) {
  const L = Math.min(v.length, mean.length, std.length);
  const out = new Array(L);
  for (let i=0;i<L;i++) {
    out[i] = ((Number(v[i]) || 0) - mean[i]) / (std[i] || 1);
  }
  return out;
}

export function sharedAvailability(avA=[], avB=[]) {
  const setB = new Set(avB);
  return avA.filter(x => setB.has(x));
}
