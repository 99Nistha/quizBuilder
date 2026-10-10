import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dataDir = process.env.DATA_DIR || fileURLToPath(new URL('../data', import.meta.url));
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, 'app.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id          TEXT PRIMARY KEY,
    slug        TEXT UNIQUE NOT NULL,
    type        TEXT NOT NULL,
    title       TEXT NOT NULL,
    blurb       TEXT NOT NULL DEFAULT '',
    category    TEXT NOT NULL,
    cover       TEXT,
    creator     TEXT NOT NULL DEFAULT '',
    data        TEXT NOT NULL,
    plays       INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL
  );

  -- One row per finished game. No IPs, no user ids: just what was picked.
  CREATE TABLE IF NOT EXISTS plays (
    id          TEXT PRIMARY KEY,
    game_id     TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    result      TEXT NOT NULL,
    created_at  INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS plays_game ON plays(game_id, created_at);
  CREATE INDEX IF NOT EXISTS plays_time ON plays(created_at);
  CREATE INDEX IF NOT EXISTS games_cat ON games(category, created_at);
`);

export const dataPath = dataDir;
