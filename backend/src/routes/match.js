import { Router } from 'express';
import { db } from '../lib/db.js';
import { authRequired } from '../lib/auth.js';
import { cosineSim } from '../lib/match.js';

const router = Router();

/**
 * Return top-N similar users by cosine similarity over profile vectors.
 * Query: ?limit=10
 */
router.get('/', authRequired, (req, res) => {
  const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 10));
  const database = db();

  const me = database.prepare('SELECT vector FROM profiles WHERE user_id=?').get(req.user.id);
  if (!me) return res.status(400).json({ error: 'Complete the quiz first to get a profile.' });

  const myVec = JSON.parse(me.vector);

  // Fetch other users who already have profiles
  const rows = database
    .prepare(
      `
      SELECT u.id AS user_id, u.name AS name, p.vector AS vector, p.summary AS summary
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      WHERE u.id <> ?
    `
    )
    .all(req.user.id);

  const scored = rows
    .map((r) => {
      const v = JSON.parse(r.vector || '[]');
      const score = Array.isArray(v) && v.length === myVec.length ? cosineSim(myVec, v) : 0;
      return { user_id: r.user_id, name: r.name, summary: r.summary, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  res.json({ matches: scored });
});

export default router;
