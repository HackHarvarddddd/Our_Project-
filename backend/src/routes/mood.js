const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { db } = require('../lib/db');

// Update user's mood
router.post('/users/update-mood', (req, res) => {
  const { mood, userId } = req.body; // Accept userId from the request body

  console.log('Received request to update mood:', { userId, mood }); // Debugging line

  if (!userId || !mood) {
    console.error('Missing required fields:', { userId, mood }); // Debugging line
    return res.status(400).json({ error: 'Missing required fields: userId or mood' });
  }

  try {
    const stmt = db().prepare('UPDATE users SET mood = ? WHERE id = ?');
    const result = stmt.run(mood, userId);

    console.log('Database update result:', result); // Debugging line

    if (result.changes === 0) {
      console.error('User not found for userId:', userId); // Debugging line
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating mood:', error); // Debugging line
    res.status(500).json({ error: 'Failed to update mood' });
  }
});

// Create a schedule
router.post('/schedule', (req, res) => {
  const { user_a, user_b, start_iso, end_iso, location, notes } = req.body;

  console.log('Received request to create schedule:', req.body); // Debugging line

  if (!user_a || !user_b || !start_iso || !end_iso || !location) {
    console.error('Missing required fields:', req.body); // Debugging line
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const stmt = db().prepare(`
      INSERT INTO schedules (id, user_a, user_b, start_iso, end_iso, location, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const id = `sch_${Date.now()}`;
    stmt.run(id, user_a, user_b, start_iso, end_iso, location, notes);

    res.status(201).json({ success: true, id });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
});

module.exports = router;