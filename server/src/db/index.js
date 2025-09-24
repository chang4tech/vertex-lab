import Database from 'better-sqlite3';
import { resolve, dirname } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

const schema = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  metadata TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS library_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  graph_id TEXT NOT NULL,
  name TEXT NOT NULL,
  nodes TEXT NOT NULL,
  edges TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_library_user_graph ON library_entries(user_id, graph_id);
`;

export function initializeDatabase(dbPath) {
  const normalizedPath = dbPath === ':memory:' ? ':memory:' : resolve(dbPath);

  if (normalizedPath !== ':memory:') {
    const dir = dirname(normalizedPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(normalizedPath);
  db.exec(schema);
  return db;
}
