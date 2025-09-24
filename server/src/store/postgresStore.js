import { Pool } from 'pg';
import { randomUUID, createHash } from 'node:crypto';

const hashPassword = (password) => createHash('sha256').update(String(password)).digest('hex');

const sanitizeUserRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata: row.metadata ?? {}
  };
};

const sanitizeLibraryRow = (row) => ({
  id: row.id,
  graphId: row.graph_id,
  name: row.name,
  nodes: row.nodes ?? [],
  edges: row.edges ?? [],
  metadata: row.metadata ?? {},
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at BIGINT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS library_entries (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    graph_id TEXT NOT NULL,
    name TEXT NOT NULL,
    nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
    edges JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_library_user_graph ON library_entries(user_id, graph_id)`
];

async function applySchema(pool) {
  for (const statement of schemaStatements) {
    await pool.query(statement);
  }
}

export async function createPostgresStore({ connectionString, ssl }) {
  const pool = new Pool({ connectionString, ssl });

  await applySchema(pool);

  const createUser = async ({ name, email, password }) => {
    const normalizedEmail = String(email).trim().toLowerCase();
    const id = randomUUID();
    const now = new Date().toISOString();
    const metadata = { plan: 'free', locale: 'en-US' };
    try {
      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, created_at, updated_at, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
        [id, name?.trim() || null, normalizedEmail, hashPassword(password), now, now, JSON.stringify(metadata)]
      );
    } catch (error) {
      if (error?.code === '23505') {
        throw new Error('USER_EXISTS');
      }
      throw error;
    }
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return sanitizeUserRow(result.rows[0]);
  };

  const getUserByEmail = async (email) => {
    if (!email) return null;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [String(email).trim().toLowerCase()]);
    return sanitizeUserRow(result.rows[0]);
  };

  const getUserById = async (id) => {
    if (!id) return null;
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return sanitizeUserRow(result.rows[0]);
  };

  const verifyUser = async ({ email, password }) => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [String(email).trim().toLowerCase()]);
    const row = result.rows[0];
    if (!row) return null;
    const candidateHash = hashPassword(password);
    if (candidateHash !== row.password_hash) {
      return null;
    }
    const now = new Date().toISOString();
    await pool.query('UPDATE users SET updated_at = $1 WHERE id = $2', [now, row.id]);
    row.updated_at = now;
    return sanitizeUserRow(row);
  };

  const createSession = async (userId) => {
    const id = randomUUID();
    await pool.query('INSERT INTO sessions (id, user_id, created_at) VALUES ($1, $2, $3)', [id, userId, Date.now()]);
    return id;
  };

  const getSession = async (sessionId) => {
    if (!sessionId) return null;
    const result = await pool.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
    const row = result.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      createdAt: row.created_at
    };
  };

  const clearSession = async (sessionId) => {
    if (!sessionId) return;
    await pool.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
  };

  const upsertLibraryEntry = async (userId, entry) => {
    const now = new Date().toISOString();
    const graphKey = entry.graphId || entry.id || randomUUID();
    const payload = {
      id: entry.id || randomUUID(),
      name: entry.name?.trim() || 'Untitled graph',
      nodes: Array.isArray(entry.nodes) ? entry.nodes : [],
      edges: Array.isArray(entry.edges) ? entry.edges : [],
      metadata: entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : {},
      createdAt: entry.createdAt || now,
      updatedAt: now
    };

    const result = await pool.query(
      `INSERT INTO library_entries (id, user_id, graph_id, name, nodes, edges, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8, $9)
       ON CONFLICT (user_id, graph_id)
       DO UPDATE SET name = EXCLUDED.name, nodes = EXCLUDED.nodes, edges = EXCLUDED.edges,
                     metadata = EXCLUDED.metadata, updated_at = EXCLUDED.updated_at
       RETURNING *`,
      [
        payload.id,
        userId,
        graphKey,
        payload.name,
        JSON.stringify(payload.nodes),
        JSON.stringify(payload.edges),
        JSON.stringify(payload.metadata),
        payload.createdAt,
        payload.updatedAt
      ]
    );

    return sanitizeLibraryRow(result.rows[0]);
  };

  const deleteLibraryEntry = async (userId, entryId) => {
    if (!entryId) return false;
    const result = await pool.query(
      'DELETE FROM library_entries WHERE user_id = $1 AND (id = $2 OR graph_id = $2) RETURNING id',
      [userId, entryId]
    );
    return result.rowCount > 0;
  };

  const listLibrary = async (userId) => {
    const result = await pool.query(
      'SELECT * FROM library_entries WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );
    return result.rows.map(sanitizeLibraryRow);
  };

  const store = {
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

  const close = async () => {
    await pool.end();
  };

  return { store, close, pool };
}
