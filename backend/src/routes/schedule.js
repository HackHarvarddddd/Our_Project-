import { Router } from 'express';
import { db } from '../lib/db.js';
import { authRequired } from '../lib/auth.js';
import { sharedAvailability } from '../lib/match.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

function pickEventForUsers(database, me, other) {
  const myQuiz = database.prepare('SELECT * FROM quiz_responses WHERE user_id=?').get(me);
  const otQuiz = database.prepare('SELECT * FROM quiz_responses WHERE user_id=?').get(other);
  const myInterests = JSON.parse(myQuiz?.interests || '[]');
  const myGenres = JSON.parse(myQuiz?.genres || '[]');
  const otInterests = JSON.parse(otQuiz?.interests || '[]');
  const otGenres = JSON.parse(otQuiz?.genres || '[]');

  const events = database.prepare('SELECT * FROM events').all();
  const parsed = events.map(e => ({...e, tags: JSON.parse(e.tags||'[]')}));

  // Score event by overlap with shared tags
  let best = null, bestScore = -1;
  for (const e of parsed) {
    const tags = new Set(e.tags);
    let score = 0;
    for (const t of myGenres) if (tags.has(t)) score += 2;
    for (const t of otGenres) if (tags.has(t)) score += 2;
    for (const t of myInterests) if (tags.has(t)) score += 1;
    for (const t of otInterests) if (tags.has(t)) score += 1;
    if (score > bestScore) { bestScore = score; best = e; }
  }
  return best;
}

router.post('/', authRequired, (req, res) => {
  const { partnerUserId } = req.body || {};
  if (!partnerUserId) return res.status(400).json({ error: 'partnerUserId required' });
  const database = db();

  const myQuiz = database.prepare('SELECT * FROM quiz_responses WHERE user_id=?').get(req.user.id);
  const otQuiz = database.prepare('SELECT * FROM quiz_responses WHERE user_id=?').get(partnerUserId);
  if (!myQuiz || !otQuiz) return res.status(400).json({ error: 'Both users must complete quiz' });

  const myAvail = JSON.parse(myQuiz.availability || '[]');
  const otAvail = JSON.parse(otQuiz.availability || '[]');
  const overlap = sharedAvailability(myAvail, otAvail);
  if (overlap.length === 0) return res.status(200).json({ ok: true, scheduled: null, note: 'No overlapping availability. Try editing your availability.' });

  // take first overlap; create faux ISO next-week timestamp for clarity
  const slot = overlap[0]; // e.g., "Fri 18:00"
  const [day, time] = slot.split(' ');
  const dayMap = { 'Mon':1, 'Tue':2, 'Wed':3, 'Thu':4, 'Fri':5, 'Sat':6, 'Sun':7 };
  const today = new Date();
  const delta = ((dayMap[day] || 5) - (today.getDay() || 7) + 7) % 7 || 7; // next occurrence
  const [hh, mm] = time.split(':').map(x=>parseInt(x,10));
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() + delta, hh, mm, 0);

  const event = pickEventForUsers(database, req.user.id, partnerUserId) || database.prepare('SELECT * FROM events LIMIT 1').get();
  const duration = event?.duration_min || 120;
  const end = new Date(start.getTime() + duration*60000);

  const id = uuidv4();
  database.prepare(`INSERT INTO schedules (id,user_a,user_b,event_id,start_iso,end_iso,location,notes)
                    VALUES (?,?,?,?,?,?,?,?)`)
          .run(id, req.user.id, partnerUserId, event.id, start.toISOString(), end.toISOString(), event.location, `Auto-scheduled for ${slot}`);

  res.json({
    ok: true,
    scheduled: {
      id, event: { id: event.id, title: event.title, category: event.category, location: event.location },
      start_iso: start.toISOString(), end_iso: end.toISOString()
    }
  });
});

export default router;
