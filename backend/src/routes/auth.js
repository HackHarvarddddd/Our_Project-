import { Router } from 'express';
import { db } from '../lib/db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { signToken, authRequired } from '../lib/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  const { name, email, password, isArtist=true } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

  const database = db();
  const exists = database.prepare('SELECT id FROM users WHERE email=?').get(email);
  if (exists) return res.status(400).json({ error: 'Email already in use' });

  const id = uuidv4();
  const hash = bcrypt.hashSync(password, 10);
  database.prepare('INSERT INTO users (id,name,email,password_hash,is_artist) VALUES (?,?,?,?,?)')
          .run(id, name, email, hash, isArtist?1:0);

  const token = signToken({ id, email, name });
  res.json({ token, user: { id, email, name } });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const database = db();
  const user = database.prepare('SELECT * FROM users WHERE email=?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken({ id: user.id, email: user.email, name: user.name });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

router.get('/me', authRequired, (req, res) => {
  const database = db();
  const user = database.prepare('SELECT id,name,email,is_artist FROM users WHERE id=?').get(req.user.id);
  const quiz = database.prepare('SELECT * FROM quiz_responses WHERE user_id=?').get(req.user.id);
  const profile = database.prepare('SELECT * FROM profiles WHERE user_id=?').get(req.user.id);
  res.json({ user, quiz, profile });
});

export default router;
