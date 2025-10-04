import { Router } from 'express';
import { db } from '../lib/db.js';
import { authRequired } from '../lib/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * POST /api/canvas/room
 * Body: { partnerUserId: string }
 * Creates or returns a canvas room for two matched users
 */
router.post('/room', authRequired, (req, res) => {
  const { partnerUserId } = req.body || {};
  if (!partnerUserId) return res.status(400).json({ error: 'Missing partnerUserId' });
  
  const database = db();
  
  // Prevent self-canvas
  if (partnerUserId === req.user.id) {
    return res.status(400).json({ error: 'Cannot create canvas with yourself' });
  }

  // Check if users are matched (have a schedule together)
  const existingSchedule = database.prepare(
    `SELECT * FROM schedules WHERE (user_a=? AND user_b=?) OR (user_a=? AND user_b=?)`
  ).get(req.user.id, partnerUserId, partnerUserId, req.user.id);

  if (!existingSchedule) {
    return res.status(400).json({ error: 'Users must be matched and scheduled before accessing canvas' });
  }

  // Check if canvas room already exists
  const existingRoom = database.prepare(
    `SELECT * FROM canvas_rooms WHERE (user_a=? AND user_b=?) OR (user_a=? AND user_b=?)`
  ).get(req.user.id, partnerUserId, partnerUserId, req.user.id);

  if (existingRoom) {
    // Get partner name
    const partner = database.prepare('SELECT name FROM users WHERE id=?').get(partnerUserId);
    return res.json({
      roomId: existingRoom.room_id,
      partnerName: partner?.name || 'Unknown',
      createdAt: existingRoom.created_at
    });
  }

  // Create new canvas room
  const roomId = `canvas_${uuidv4()}`;
  const now = new Date().toISOString();
  
  database.prepare(
    `INSERT INTO canvas_rooms (room_id, user_a, user_b, created_at) VALUES (?, ?, ?, ?)`
  ).run(roomId, req.user.id, partnerUserId, now);

  // Get partner name
  const partner = database.prepare('SELECT name FROM users WHERE id=?').get(partnerUserId);
  
  res.json({
    roomId,
    partnerName: partner?.name || 'Unknown',
    createdAt: now
  });
});

/**
 * GET /api/canvas/room/:roomId
 * Returns canvas room information
 */
router.get('/room/:roomId', authRequired, (req, res) => {
  const { roomId } = req.params;
  const database = db();
  
  const room = database.prepare(
    `SELECT * FROM canvas_rooms WHERE room_id=?`
  ).get(roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Canvas room not found' });
  }
  
  // Check if user has access to this room
  if (room.user_a !== req.user.id && room.user_b !== req.user.id) {
    return res.status(403).json({ error: 'Access denied to this canvas room' });
  }
  
  // Get partner information
  const partnerId = room.user_a === req.user.id ? room.user_b : room.user_a;
  const partner = database.prepare('SELECT name FROM users WHERE id=?').get(partnerId);
  
  res.json({
    roomId: room.room_id,
    partnerName: partner?.name || 'Unknown',
    createdAt: room.created_at
  });
});

/**
 * POST /api/liveblocks-auth
 * Liveblocks authentication endpoint
 */
router.post('/liveblocks-auth', authRequired, (req, res) => {
  // For development, we'll use a simple approach
  // In production, you should implement proper Liveblocks authentication
  const userId = req.user.id;
  const userName = req.user.name || 'User';
  
  // This is a simplified auth response
  // In production, you should use Liveblocks' proper authentication
  res.json({
    token: `user_${userId}_${Date.now()}`,
    user: {
      id: userId,
      name: userName,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    }
  });
});

export default router;
