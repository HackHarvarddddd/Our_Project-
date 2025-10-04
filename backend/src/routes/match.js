import { Router } from 'express';
import { db } from '../lib/db.js';
import { authRequired } from '../lib/auth.js';
import { cosineSim } from '../lib/match.js';

const router = Router();

/**
 * Return top-N similar users by cosine similarity over profile vectors.
 * - Excludes the current user
 * - Only includes users who have a stored profile vector
 * Query: ?limit=10
 */
router.get('/', authRequired, (req, res) => {
  const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 10));
  const database = db();

  // Get my vector
  const me = database.prepare('SELECT vector FROM profiles WHERE user_id=?').get(req.user.id);
  if (!me || !me.vector) return res.json({ matches: [] });
  let myVec = [];
  try { myVec = JSON.parse(me.vector || '[]'); } catch { myVec = []; }
  if (!Array.isArray(myVec) || myVec.length === 0) return res.json({ matches: [] });

  // Fetch other users who already have profiles
  const rows = database.prepare(
    `
    SELECT u.id AS user_id, u.name AS name, p.vector AS vector, p.summary AS summary
    FROM users u
    JOIN profiles p ON p.user_id = u.id
    WHERE u.id != ?
    `
  ).all(req.user.id);

  const scored = rows
    .map((r) => {
      let v = [];
      try { v = JSON.parse(r.vector || '[]'); } catch { v = []; }
      const score = Array.isArray(v) && v.length === myVec.length ? cosineSim(myVec, v) : 0;
      return { user_id: r.user_id, name: r.name, summary: r.summary, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  res.json({ matches: scored });
});

export default router;
