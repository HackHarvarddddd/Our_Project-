import { Router } from 'express';
import { authRequired } from '../lib/auth.js';
import { Liveblocks } from "@liveblocks/node";

const router = Router();

// Initialize Liveblocks with your secret key
const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY || "sk_test_your-secret-key-here",
});

/**
 * POST /api/liveblocks-auth
 * Authenticate user for Liveblocks room access
 */
router.post('/auth', authRequired, async (req, res) => {
  try {
    const room = req.body.room;
    const user = {
      id: req.user.id,
      name: req.user.name,
      info: {
        email: req.user.email,
        isArtist: req.user.is_artist,
      },
    };

    const session = liveblocks.prepareSession(user.id, {
      userInfo: user.info,
    });

    if (room) {
      session.allow(room, session.FULL_ACCESS);
    }

    const { status, body } = await session.authorize();
    res.status(status).end(body);
  } catch (error) {
    console.error('Liveblocks auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

export default router;
