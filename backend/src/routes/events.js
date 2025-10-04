import { Router } from 'express';
import { db } from '../lib/db.js';

const router = Router();

router.get('/', (req, res) => {
  const database = db();
  const rows = database.prepare('SELECT * FROM events').all().map(r => ({...r, tags: JSON.parse(r.tags||'[]')}));
  res.json({ events: rows });
});

export default router;
