import { randomUUID, createHash } from 'node:crypto';
import { initializeDatabase } from '../db/index.js';

const hashPassword = (password) => createHash('sha256').update(String(password)).digest('hex');

const parseJson = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const sanitizeUserRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata: parseJson(row.metadata, {})
  };
};

const sanitizeLibraryRow = (row) => ({
  id: row.id,
  graphId: row.graph_id,
  name: row.name,
  nodes: parseJson(row.nodes, []),
  edges: parseJson(row.edges, []),
  metadata: parseJson(row.metadata, {}),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

function buildSqliteStore(db) {
  const selectUserByEmail = db.prepare('SELECT * FROM users WHERE email = ?');
  const selectUserById = db.prepare('SELECT * FROM users WHERE id = ?');
  const insertUser = db.prepare(
    'INSERT INTO users (id, name, email, password_hash, created_at, updated_at, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)' 
  );
  const updateUserTimestamp = db.prepare('UPDATE users SET updated_at = ? WHERE id = ?');

  const insertSession = db.prepare('INSERT INTO sessions (id, user_id, created_at) VALUES (?, ?, ?)');
  const selectSession = db.prepare('SELECT * FROM sessions WHERE id = ?');
  const deleteSession = db.prepare('DELETE FROM sessions WHERE id = ?');

  const selectLibraryByGraph = db.prepare(
    'SELECT * FROM library_entries WHERE user_id = ? AND (graph_id = ? OR id = ?) LIMIT 1'
  );
  const selectLibraryById = db.prepare('SELECT * FROM library_entries WHERE id = ?');
  const insertLibrary = db.prepare(
    'INSERT INTO library_entries (id, user_id, graph_id, name, nodes, edges, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const updateLibrary = db.prepare(
    'UPDATE library_entries SET name = ?, nodes = ?, edges = ?, metadata = ?, updated_at = ? WHERE id = ?'
  );
  const deleteLibrary = db.prepare(
    'DELETE FROM library_entries WHERE user_id = ? AND (id = ? OR graph_id = ?)'
  );
  const listLibraryForUser = db.prepare(
    'SELECT * FROM library_entries WHERE user_id = ? ORDER BY updated_at DESC'
  );

  const createUser = async ({ name, email, password }) => {
    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = selectUserByEmail.get(normalizedEmail);
    if (existing) {
      throw new Error('USER_EXISTS');
    }
    const id = randomUUID();
    const now = new Date().toISOString();
    const metadata = JSON.stringify({ plan: 'free', locale: 'en-US' });
    insertUser.run(id, name?.trim() || null, normalizedEmail, hashPassword(password), now, now, metadata);
    return sanitizeUserRow(selectUserById.get(id));
  };

  const getUserByEmail = async (email) => {
    if (!email) return null;
    return sanitizeUserRow(selectUserByEmail.get(String(email).trim().toLowerCase()));
  };

  const getUserById = async (id) => {
    if (!id) return null;
    return sanitizeUserRow(selectUserById.get(id));
  };

  const verifyUser = async ({ email, password }) => {
    const normalizedEmail = String(email).trim().toLowerCase();
    const row = selectUserByEmail.get(normalizedEmail);
    if (!row) {
      return null;
    }
    const candidateHash = hashPassword(password);
    if (candidateHash !== row.password_hash) {
      return null;
    }
    const now = new Date().toISOString();
    updateUserTimestamp.run(now, row.id);
    row.updated_at = now;
    return sanitizeUserRow(row);
  };

  const createSession = async (userId) => {
    const id = randomUUID();
    insertSession.run(id, userId, Date.now());
    return id;
  };

  const getSession = async (sessionId) => {
    if (!sessionId) return null;
    const row = selectSession.get(sessionId);
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      createdAt: row.created_at
    };
  };

  const clearSession = async (sessionId) => {
    if (!sessionId) return;
    deleteSession.run(sessionId);
  };

  const upsertLibraryEntry = async (userId, entry) => {
    const now = new Date().toISOString();
    const graphKey = entry.graphId || entry.id || randomUUID();
    const payload = {
      id: entry.id || randomUUID(),
      graphId: graphKey,
      name: entry.name?.trim() || 'Untitled graph',
      nodes: JSON.stringify(Array.isArray(entry.nodes) ? entry.nodes : []),
      edges: JSON.stringify(Array.isArray(entry.edges) ? entry.edges : []),
      metadata: JSON.stringify(entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : {}),
      createdAt: entry.createdAt || now,
      updatedAt: now
    };
    const existing = selectLibraryByGraph.get(userId, payload.graphId, payload.id);
    if (existing) {
      updateLibrary.run(payload.name, payload.nodes, payload.edges, payload.metadata, payload.updatedAt, existing.id);
      return sanitizeLibraryRow(selectLibraryById.get(existing.id));
    }
    insertLibrary.run(
      payload.id,
      userId,
      payload.graphId,
      payload.name,
      payload.nodes,
      payload.edges,
      payload.metadata,
      payload.createdAt,
      payload.updatedAt
    );
    return sanitizeLibraryRow(selectLibraryById.get(payload.id));
  };

  const deleteLibraryEntry = async (userId, entryId) => {
    if (!entryId) return false;
    const result = deleteLibrary.run(userId, entryId, entryId);
    return result.changes > 0;
  };

  const listLibrary = async (userId) => {
    const rows = listLibraryForUser.all(userId);
    return rows.map(sanitizeLibraryRow);
  };

  return {
    createUser,
    getUserByEmail,
    getUserById,
    verifyUser,
    createSession,
    getSession,
    clearSession,
    upsertLibraryEntry,
    deleteLibraryEntry,
    listLibrary
  };
}

export function createSqliteStore(options = {}) {
  const db = initializeDatabase(options.dbPath || ':memory:');
  const store = buildSqliteStore(db);

  const close = async () => {
    db.close();
  };

  return { store, close };
}
