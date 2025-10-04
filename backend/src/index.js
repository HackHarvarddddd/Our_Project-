import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './lib/db.js';
import authRoutes from './routes/auth.js';
import quizRoutes from './routes/quiz.js';
import matchRoutes from './routes/match.js';
import eventRoutes from './routes/events.js';
import scheduleRoutes from './routes/schedule.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/schedule', scheduleRoutes);

const PORT = process.env.PORT || 4000;

async function start() {
  initDb();
  const args = process.argv.slice(2);
  const initOnly = args.includes('--initOnly');
  if (initOnly) {
    console.log('DB initialized. Exiting due to --initOnly.');
    process.exit(0);
  }
  app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
}

start();
