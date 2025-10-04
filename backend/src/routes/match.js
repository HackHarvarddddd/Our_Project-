import { Router } from 'express';
import { db } from '../lib/db.js';
import { authRequired } from '../lib/auth.js';
import { cosineSim } from '../lib/match.js';

const router = Router();

router.get('/', authRequired, (req, res) => {
  const database = db();
  const me = database.prepare('SELECT * FROM profiles WHERE user_id=?').get(req.user.id);
  if (!me) return res.status(400).json({ error: 'Complete quiz first' });
  const myVec = JSON.parse(me.vector);

  const others = database.prepare('SELECT u.id as user_id, u.name, p.vector, p.summary FROM users u JOIN profiles p ON u.id=p.user_id WHERE u.id<>?').all(req.user.id);
  const scored = others.map(o => {
    const v = JSON.parse(o.vector);
    return { user_id: o.user_id, name: o.name, summary: o.summary, score: cosineSim(myVec, v) };
  }).sort((a,b)=> b.score - a.score).slice(0, 10);

  res.json({ matches: scored });
});

export default router;
