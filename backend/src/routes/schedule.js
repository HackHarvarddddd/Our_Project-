import { Router } from 'express';
import { db } from '../lib/db.js';
import { authRequired } from '../lib/auth.js';
import { sharedAvailability } from '../lib/match.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * Utility: pick a reasonable event for a pair of users.
 * Prefers categories that overlap their stated genres/interests; otherwise picks any event.
 */
function pickEventForUsers(database, me, other) {
  const myQuiz = database.prepare('SELECT * FROM quiz_responses WHERE user_id=?').get(me);
  const otQuiz = database.prepare('SELECT * FROM quiz_responses WHERE user_id=?').get(other);

  const myInterests = JSON.parse(myQuiz?.interests || '[]');
  const myGenres = JSON.parse(myQuiz?.genres || '[]');
  const otInterests = JSON.parse(otQuiz?.interests || '[]');
  const otGenres = JSON.parse(otQuiz?.genres || '[]');

  const liked = new Set([...myInterests, ...myGenres, ...otInterests, ...otGenres].map(s => String(s).toLowerCase()));
  const events = database.prepare('SELECT * FROM events').all();

  // Try to find an event whose category or tags intersect "liked"
  let chosen = events.find(e => liked.has(String(e.category).toLowerCase()))
    || events.find(e => {
      try {
        const tags = JSON.parse(e.tags || '[]').map((t)=>String(t).toLowerCase());
        return tags.some(t => liked.has(t));
      } catch { return false; }
    })
    || events[0];

  if (!chosen) return null;
  // Ensure we can access fields consistently
  const durationMin = Number(chosen.duration_min || chosen.duration || 90) || 90;
  const tags = Array.isArray(chosen.tags) ? chosen.tags : JSON.parse(chosen.tags || '[]');

  return { id: chosen.id, title: chosen.title, category: chosen.category, location: chosen.location, duration_min: durationMin, tags };
}

/**
 * POST /api/schedule
 * Body: { partnerUserId: string }
 * Creates (or returns) a scheduled invitation visible to both users.
 */
router.post('/', authRequired, (req, res) => {
  const { partnerUserId } = req.body || {};
  if (!partnerUserId) return res.status(400).json({ error: 'Missing partnerUserId' });
  const database = db();

  // Prevent self-invites
  if (partnerUserId === req.user.id) return res.status(400).json({ error: 'Cannot schedule with yourself' });

  // If a schedule already exists between the pair, return it
  const existing = database.prepare(
    `SELECT * FROM schedules WHERE (user_a=? AND user_b=?) OR (user_a=? AND user_b=?) ORDER BY created_at DESC LIMIT 1`
  ).get(req.user.id, partnerUserId, partnerUserId, req.user.id);

  if (existing) {
    const event = database.prepare('SELECT id,title,category,location,duration_min FROM events WHERE id=?').get(existing.event_id);
    return res.json({
      ok: true,
      scheduled: {
        id: existing.id,
        event,
        start_iso: existing.start_iso,
        end_iso: existing.end_iso,
      }
    });
  }

  // Basic availability intersection (optional—works even if user skipped)
  const myAv = JSON.parse(database.prepare('SELECT availability FROM quiz_responses WHERE user_id=?').get(req.user.id)?.availability || '[]');
  const otAv = JSON.parse(database.prepare('SELECT availability FROM quiz_responses WHERE user_id=?').get(partnerUserId)?.availability || '[]');
  const overlap = sharedAvailability(myAv, otAv);

  // Pick an event
  const event = pickEventForUsers(database, req.user.id, partnerUserId) ||
                database.prepare('SELECT id,title,category,location,duration_min FROM events LIMIT 1').get();

  if (!event) return res.json({ ok: true, scheduled: null });

  // Use the first overlapping slot if present, otherwise pick a reasonable default time
  const now = new Date();
  const start = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 days default
  const end = new Date(start.getTime() + (Number(event.duration_min || 90) * 60 * 1000));

  const id = uuidv4();
  database.prepare(
    `INSERT INTO schedules (id,user_a,user_b,event_id,start_iso,end_iso,location,notes)
     VALUES (?,?,?,?,?,?,?,?)`
  ).run(
    id,
    req.user.id,
    partnerUserId,
    event.id,
    start.toISOString(),
    end.toISOString(),
    event.location,
    overlap.length ? `Auto-scheduled using shared slot: ${overlap[0]}` : 'Auto-scheduled'
  );

  // Adjust availability for both users
  adjustAvailability(database, req.user.id, start.toISOString(), end.toISOString());
  adjustAvailability(database, partnerUserId, start.toISOString(), end.toISOString());

  res.json({
    ok: true,
    scheduled: {
      id,
      event: { id: event.id, title: event.title, category: event.category, location: event.location },
      start_iso: start.toISOString(),
      end_iso: end.toISOString(),
    }
  });
});

/**
 * DELETE /api/schedule/:id
 * Deletes a schedule by ID. Both participants can delete the invite.
 */
router.delete('/:id', authRequired, (req, res) => {
  const { id } = req.params;
  const database = db();

  // Ensure the user is a participant in the schedule
  const schedule = database.prepare(
    `SELECT * FROM schedules WHERE id=? AND (user_a=? OR user_b=?)`
  ).get(id, req.user.id, req.user.id);

  if (!schedule) return res.status(404).json({ error: 'Schedule not found or access denied' });

  // Delete the schedule
  database.prepare(`DELETE FROM schedules WHERE id=?`).run(id);

  res.json({ ok: true });
});

/**
 * GET /api/schedule
 * Returns every schedule/invitation where the current user is either participant.
 * Response items are normalized and include the "partner" field and a boolean "sentByMe".
 */
router.get('/', authRequired, (req, res) => {
  const database = db();
  const rows = database.prepare(
    `
    SELECT s.*, e.title as event_title, e.category as event_category, e.location as event_location,
           ua.name as name_a, ub.name as name_b
    FROM schedules s
    JOIN events e ON e.id = s.event_id
    LEFT JOIN users ua ON ua.id = s.user_a
    LEFT JOIN users ub ON ub.id = s.user_b
    WHERE s.user_a = ? OR s.user_b = ?
    ORDER BY s.created_at DESC
    `
  ).all(req.user.id, req.user.id);

  const items = rows.map(r => {
    const sentByMe = r.user_a === req.user.id;
    const partnerId = sentByMe ? r.user_b : r.user_a;
    const partnerName = sentByMe ? r.name_b : r.name_a;
    return {
      id: r.id,
      partner: { id: partnerId, name: partnerName },
      event: { id: r.event_id, title: r.event_title, category: r.event_category, location: r.event_location },
      start_iso: r.start_iso,
      end_iso: r.end_iso,
      sentByMe,
      created_at: r.created_at,
    };
  });

  res.json({ schedules: items });
});

/**
 * GET /api/schedule/with/:partnerId
 * Fetch the most recent schedule between the current user and partner.
 */
router.get('/with/:partnerId', authRequired, (req, res) => {
  const { partnerId } = req.params;
  const database = db();
  const r = database.prepare(
    `SELECT * FROM schedules
     WHERE (user_a=? AND user_b=?) OR (user_a=? AND user_b=?)
     ORDER BY created_at DESC LIMIT 1`
  ).get(req.user.id, partnerId, partnerId, req.user.id);

  if (!r) return res.json({ scheduled: null });

  const e = database.prepare('SELECT id,title,category,location,duration_min FROM events WHERE id=?').get(r.event_id);
  res.json({
    scheduled: {
      id: r.id,
      event: e,
      start_iso: r.start_iso,
      end_iso: r.end_iso,
    }
  });
});

// Update availability after scheduling
function adjustAvailability(database, userId, eventStart, eventEnd) {
  const quiz = database.prepare('SELECT availability FROM quiz_responses WHERE user_id=?').get(userId);
  const availability = JSON.parse(quiz?.availability || '[]');
  const updatedAvailability = availability.filter(slot => {
    const [day, time] = slot.split(' ');
    const slotStart = new Date(`${day}T${time}:00`);
    const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // Assume 1-hour slots
    return slotEnd <= new Date(eventStart) || slotStart >= new Date(eventEnd);
  });
  database.prepare('UPDATE quiz_responses SET availability=? WHERE user_id=?').run(
    JSON.stringify(updatedAvailability),
    userId
  );
}

export default router;
