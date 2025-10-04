import { Router } from 'express';
import { db } from '../lib/db.js';
import { authRequired } from '../lib/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * POST /api/rooms/create
 * Body: { partnerUserId: string }
 * Creates a room for two matched users
 */
router.post('/create', authRequired, (req, res) => {
  const { partnerUserId } = req.body;
  
  if (!partnerUserId) {
    return res.status(400).json({ error: 'Partner user ID is required' });
  }

  if (partnerUserId === req.user.id) {
    return res.status(400).json({ error: 'Cannot create room with yourself' });
  }

  const database = db();

  // Check if partner user exists
  const partner = database
    .prepare('SELECT id, name FROM users WHERE id = ?')
    .get(partnerUserId);
  
  if (!partner) {
    return res.status(404).json({ error: 'Partner user not found' });
  }

  // Check if a room already exists between these users
  const existingRoom = database
    .prepare(`
      SELECT id FROM rooms 
      WHERE (user_a = ? AND user_b = ?) OR (user_a = ? AND user_b = ?)
    `)
    .get(req.user.id, partnerUserId, partnerUserId, req.user.id);

  if (existingRoom) {
    return res.json({ 
      roomId: existingRoom.id,
      partnerName: partner.name,
      message: 'Room already exists'
    });
  }

  // Create new room
  const roomId = `room_${uuidv4()}`;
  
  database
    .prepare(`
      INSERT INTO rooms (id, user_a, user_b, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `)
    .run(roomId, req.user.id, partnerUserId);

  res.json({
    roomId,
    partnerName: partner.name,
    message: 'Room created successfully'
  });
});

/**
 * GET /api/rooms
 * Get all rooms for the current user
 */
router.get('/', authRequired, (req, res) => {
  const database = db();

  const rooms = database
    .prepare(`
      SELECT r.id, r.created_at,
             CASE 
               WHEN r.user_a = ? THEN u_b.name
               ELSE u_a.name
             END as partner_name,
             CASE 
               WHEN r.user_a = ? THEN r.user_b
               ELSE r.user_a
             END as partner_id
      FROM rooms r
      LEFT JOIN users u_a ON r.user_a = u_a.id
      LEFT JOIN users u_b ON r.user_b = u_b.id
      WHERE r.user_a = ? OR r.user_b = ?
      ORDER BY r.created_at DESC
    `)
    .all(req.user.id, req.user.id, req.user.id, req.user.id);

  res.json({ rooms });
});

/**
 * GET /api/rooms/:roomId
 * Get room details
 */
router.get('/:roomId', authRequired, (req, res) => {
  const { roomId } = req.params;
  const database = db();

  const room = database
    .prepare(`
      SELECT r.id, r.created_at,
             CASE 
               WHEN r.user_a = ? THEN u_b.name
               ELSE u_a.name
             END as partner_name,
             CASE 
               WHEN r.user_a = ? THEN r.user_b
               ELSE r.user_a
             END as partner_id
      FROM rooms r
      LEFT JOIN users u_a ON r.user_a = u_a.id
      LEFT JOIN users u_b ON r.user_b = u_b.id
      WHERE r.id = ? AND (r.user_a = ? OR r.user_b = ?)
    `)
    .get(req.user.id, req.user.id, roomId, req.user.id, req.user.id);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  res.json({ room });
});

export default router;
