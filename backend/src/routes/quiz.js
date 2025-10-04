import { Router } from 'express';
import { authRequired } from '../lib/auth.js';
import { db } from '../lib/db.js';
import { analyzeQuiz } from '../lib/analyze.js';

const router = Router();

/**
 * Save quiz answers then compute/store profile via analyzeQuiz (OpenAI-backed).
 * Body shape:
 * {
 *   interests: string[], genres: string[], availability: string[],
 *   location: string, values: string[]
 * }
 */
router.post('/', authRequired, async (req, res) => {
  const {
    interests = [],
    genres = [],
    availability = [],
    location = '',
    values = [], // JS uses "values"; DB column is "prefs"
    responses = [], // New parameter
  } = req.body || {};

  const database = db();

  // Upsert quiz responses (user_id is PRIMARY KEY in quiz_responses)
  database
    .prepare(
      `
      INSERT INTO quiz_responses (user_id, interests, genres, availability, location, prefs)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        interests   = excluded.interests,
        genres      = excluded.genres,
        availability= excluded.availability,
        location    = excluded.location,
        prefs       = excluded.prefs
    `
    )
    .run(
      req.user.id,
      JSON.stringify(interests),
      JSON.stringify(genres),
      JSON.stringify(availability),
      location,
      JSON.stringify(values)
    );

  // Build an answers object to feed to the analyzer
  const answers = { interests, genres, availability, location, values, responses }; // Include responses

  // Produce personality profile (Big Five + summary) via OpenAI with fallback
  const analysis = await analyzeQuiz(answers);

  // Store profile in profiles (user_id is PRIMARY KEY in profiles)
  database
    .prepare(
      `
      INSERT INTO profiles (user_id, vector, traits, summary)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        vector  = excluded.vector,
        traits  = excluded.traits,
        summary = excluded.summary
    `
    )
    .run(
      req.user.id,
      JSON.stringify(analysis.vector),
      JSON.stringify(analysis.traits),
      analysis.summary
    );

  res.json({ ok: true, profile: analysis });
});

export default router;
