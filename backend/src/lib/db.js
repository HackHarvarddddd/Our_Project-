import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveDbPath() {
  // Honor env var; default to ./data/app.db relative to the backend project root
  const raw = process.env.DB_PATH || './data/app.db';
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
}

let _db = null;

export function db() {
  if (!_db) {
    const dbPath = resolveDbPath();
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); // ensure ./data exists
    _db = new Database(dbPath);
    
    // Test database connection
    try {
      _db.prepare('SELECT 1').get();
    } catch (error) {
      console.error('Database connection failed:', error);
      throw new Error('Failed to connect to database');
    }
  }
  return _db;
}

export function initDb() {
  const database = db();
  database.pragma('journal_mode = WAL');

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_artist INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quiz_responses (
      user_id TEXT PRIMARY KEY,
      interests TEXT,         -- JSON array
      genres TEXT,            -- JSON array
      availability TEXT,      -- JSON array like ["Fri 18:00","Sat 14:00"]
      location TEXT,
      prefs TEXT,             -- <— renamed from "values" to avoid SQL keyword
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY,
      vector TEXT,            -- JSON array vector
      traits TEXT,            -- JSON object e.g. {"openness":0.8,...}
      summary TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      user_a TEXT,
      user_b TEXT,
      score REAL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_a,user_b)
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      user_a TEXT,
      user_b TEXT,
      event_id TEXT,
      start_iso TEXT,
      end_iso TEXT,
      location TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT,
      category TEXT,      -- "concert" | "museum" | ...
      tags TEXT,          -- JSON array of tags/genres
      location TEXT,
      duration_min INTEGER DEFAULT 120
    );

    CREATE TABLE IF NOT EXISTS canvas_rooms (
      id TEXT PRIMARY KEY,
      room_id TEXT UNIQUE NOT NULL,
      user_a TEXT NOT NULL,
      user_b TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_a) REFERENCES users(id),
      FOREIGN KEY(user_b) REFERENCES users(id)
    );
  `);

  // Seed events if empty
  const count = database.prepare('SELECT COUNT(*) as c FROM events').get().c;
  if (count === 0) {
    const seed = [
      {id: 'evt_rock_1',      title: 'Campus Rock Night',        category: 'concert', tags: ['rock','live','guitar'],     location: 'Student Union Hall',  duration_min: 150},
      {id: 'evt_classical_1', title: 'String Quartet Evening',   category: 'concert', tags: ['classical','strings'],      location: 'Auditorium A',        duration_min: 120},
      {id: 'evt_jazz_1',      title: 'Late Night Jazz',          category: 'concert', tags: ['jazz','improv'],            location: 'Basement Club',       duration_min: 120},
      {id: 'evt_museum_1',    title: 'Modern Art Exhibit',       category: 'museum',  tags: ['modern','abstract','gallery'], location: 'City Museum of Art', duration_min: 90},
      {id: 'evt_museum_2',    title: 'Photography Retrospective',category: 'museum',  tags: ['photography','gallery'],    location: 'Campus Gallery',      duration_min: 75},
      {id: 'evt_edm_1',       title: 'EDM Night',                category: 'concert', tags: ['edm','electronic','dance'], location: 'Field House',         duration_min: 180},
      {id: 'evt_world_1',     title: 'Global Rhythms',           category: 'concert', tags: ['world','folk'],             location: 'Cultural Center',     duration_min: 110},
    ];
    const insert = database.prepare(
      'INSERT INTO events (id,title,category,tags,location,duration_min) VALUES (@id,@title,@category,@tags,@location,@duration_min)'
    );
    const tx = database.transaction(rows => rows.forEach(r =>
      insert.run({ ...r, tags: JSON.stringify(r.tags) })
    ));
    tx(seed);
  }
}
