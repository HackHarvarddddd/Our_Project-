import { Router } from 'express';
import { authRequired } from '../lib/auth.js';
import { db } from '../lib/db.js';
import { analyzeQuiz } from '../lib/analyze.js';

const router = Router();

router.post('/', authRequired, async (req, res) => {
  const {
    interests = [],
    genres = [],
    availability = [],
    location = '',
    values = []          // JS variable can stay "values"; we store it into column "prefs"
  } = req.body || {};

  const database = db();

  // Upsert quiz responses (note: column is "prefs" to avoid SQL keyword)
  database.prepare(`
    INSERT INTO quiz_responses (user_id, interests, genres, availability, location, prefs)
    VALUES (?,?,?,?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET
      interests   = excluded.interests,
      genres      = excluded.genres,
      availability= excluded.availability,
      location    = excluded.location,
      prefs       = excluded.prefs
  `).run(
    req.user.id,
    JSON.stringify(interests),
    JSON.stringify(genres),
    JSON.stringify(availability),
    location,
    JSON.stringify(values)
  );

  // Generate / update profile from answers
  const analysis = await analyzeQuiz({ interests, genres, values });
  database.prepare(`
    INSERT INTO profiles (user_id, vector, traits, summary)
    VALUES (?,?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET
      vector = excluded.vector,
      traits = excluded.traits,
      summary= excluded.summary
  `).run(
    req.user.id,
    JSON.stringify(analysis.vector),
    JSON.stringify(analysis.traits),
    analysis.summary
  );

  res.json({ ok: true, profile: analysis });
});

export default router;
