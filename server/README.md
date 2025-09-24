# Vertex Lab API (Fastify)

This package hosts the backend services for the Vertex Lab application. It exposes a Fastify server with health endpoints and is ready for expansion as new features are required.

## Getting Started

```bash
cd server
npm install
npm run dev
```

Environment variables are loaded from a local `.env` file. Copy `.env.example` to `.env` and adjust values as needed. The server binds to `0.0.0.0` and defaults to port `4000`. Data is persisted in a SQLite database, configured via the `DATABASE_FILE` environment variable (defaults to `./data/vertex.db`).

## Available Scripts

- `npm run dev` – start the server with the Node watcher for local development
- `npm start` – run the server once in production mode
- `npm test` – execute Vitest against the service layer (auth, health, persistence)
- `npm run lint` – lint the backend project with ESLint

## Database Persistence

- SQLite powered via `better-sqlite3`, located at `DATABASE_FILE`
- Tables: `users`, `sessions`, and `library_entries` (with JSON payloads for nodes/edges/metadata)
- Tests use `:memory:` to avoid polluting the real database
- Delete the file in `server/data/` to reset local state

## Database Options

- **SQLite** (default): zero-config and ideal for quick prototyping. Uses `DATABASE_FILE` (defaults to `./data/vertex.db`).
- **Postgres**: recommended for multi-user deployments. Set `DATABASE_URL` (e.g., `postgres://vertex:password@localhost:5432/vertex`) and optionally `DATABASE_SSL=true`.

### Local Postgres setup (macOS with Homebrew)

```bash
brew install postgresql@16
brew services start postgresql@16
createdb vertex
psql -d vertex -c "CREATE USER vertex WITH PASSWORD 'vertex';"
psql -d vertex -c "GRANT ALL PRIVILEGES ON DATABASE vertex TO vertex;"

# .env
DATABASE_URL=postgres://vertex:vertex@localhost:5432/vertex
```

On Linux, use your package manager (`apt install postgresql`) and create an equivalent user/database. For remote environments supply the hosted connection string and set `DATABASE_SSL=true` if TLS is required.

## Project Layout

- `src/index.js` – bootstraps the Fastify instance and starts listening
- `src/app.js` – builds a configured Fastify app instance
- `src/routes/` – HTTP route definitions (auth, user, library, health)
- `src/controllers/` – request handlers for route logic
- `src/plugins/` – shared Fastify plugins (sensible responses, CORS, auth, store)
- `src/config/` – environment loading and related helpers
- `test/` – Vitest suites using `app.inject` for request simulation

Add additional routes by creating controller logic and registering them within `src/app.js` or dedicated route modules.
