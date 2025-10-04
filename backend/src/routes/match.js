import { Router } from 'express';
import { db } from '../lib/db.js';
import { authRequired } from '../lib/auth.js';
import { cosineSim, meanStd, zscore } from '../lib/match.js';

const router = Router();

/**
 * Return top-N similar users by *whitened* cosine similarity over profile vectors.
 * - Excludes the current user
 * - Only includes users who have a stored profile vector
 * - Scores are scaled to [0, 1] so the UI can show 0%–100%.
 * Query: ?limit=10
 */
router.get('/', authRequired, (req, res) => {
  const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 10));
  const database = db();

  // Load my profile vector
  const me = database
    .prepare('SELECT vector FROM profiles WHERE user_id = ?')
    .get(req.user.id);
  if (!me) return res.status(400).json({ error: 'Complete the quiz first to get a profile.' });

  let myVec;
  try { myVec = JSON.parse(me.vector || '[]'); } catch { myVec = []; }

  // Fetch other users who already have profiles
  const rows = database
    .prepare(
      `
      SELECT u.id AS user_id, u.name AS name, p.vector AS vector, p.summary AS summary
      FROM users u
      JOIN profiles p ON p.user_id = u.id
      WHERE u.id != ?
      `
    )
    .all(req.user.id);

  // Parse their vectors
  const others = rows.map(r => {
    let v = [];
    try { v = JSON.parse(r.vector || '[]'); } catch { v = []; }
    return { ...r, v };
  });

  // Determine a common dimensionality
  const dims = [myVec.length, ...others.map(o => o.v.length)].filter(x => x > 0);
  const L = dims.length ? Math.min(...dims) : 0;
  if (!L) return res.json({ matches: [] });

  // Compute population mean/std (anti-crowding) on [me + others]
  const { mean, std } = meanStd([myVec, ...others.map(o => o.v)], L);

  // Z-score then cosine, then scale from [-1,1] -> [0,1]
  const myZ = zscore(myVec, mean, std);
  const scored = others
    .map(o => {
      const z = zscore(o.v, mean, std);
      const raw = cosineSim(myZ, z);
      const scaled = (raw + 1) / 2; // map to [0,1] so UI shows 0%–100%
      return { user_id: o.user_id, name: o.name, summary: o.summary, score: scaled };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  res.json({ matches: scored, dims: L });
});

export default router;
