# Backend Setup Guide

Follow these steps to work with the Fastify backend that lives in the `server/` directory.

## 1. Install Dependencies

```bash
cd server
npm install
```

## 2. Configure Environment

```bash
cp .env.example .env
# Update PORT, LOG_LEVEL, DATABASE_FILE, DATABASE_URL, or DATABASE_SSL if needed
```

By default data is stored in `./server/data/vertex.db`. Delete the file to reset your local state. Configure Postgres by setting `DATABASE_URL` and (optionally) `DATABASE_SSL=true`.

## 3. Run the Server

```bash
npm run dev
```

The server listens on `http://localhost:4000` by default. Adjust the port in `.env` if it conflicts with other services.

Running `npm run dev` first executes `npm run postgres:start`, which uses Homebrew to start `postgresql@14` and create the `vertex` database/user if they do not exist. Override `DATABASE_URL` if you manage Postgres differently.

## 4. Run Tests

```bash
npm test
```

Vitest is configured in `vitest.config.js` to execute suites from the `test/` directory. Tests use the in-memory database, so they won't touch your persisted data.

## 5. Lint the Backend

```bash
npm run lint
```

ESLint uses `eslint.config.js`, inheriting the recommended rules for Node.js.

## 6. Integrate with Frontend

- Point the React app to the API base URL (`http://localhost:4000` by default).
- Copy `.env.example` from the project root to `.env.local` (ignored) and adjust `VITE_API_BASE_URL` if the backend runs on another host/port.
- Override runtime settings during deploys by setting `window.__VERTEX_CONFIG__ = { apiBaseUrl: 'https://api.example.com' }` in `index.html` or a dedicated config script. (the default `public/runtime-config.js` is copied to the build and can be edited in-place).
- Add additional routes under `server/src/routes/` and their controllers under `server/src/controllers/`.
- Remember to export any shared types or contracts so the frontend can consume them.
- When the backend is offline, the frontend falls back to local storage for saved graphs. Unsynced drafts are highlighted in the UI and automatically re-sync once the API returns.

### Postgres quick start

```bash
# macOS (Homebrew)
brew install postgresql@16
brew services start postgresql@16
createdb vertex
psql -d vertex -c "CREATE USER vertex WITH PASSWORD 'vertex';"
psql -d vertex -c "GRANT ALL PRIVILEGES ON DATABASE vertex TO vertex;"

# .env
DATABASE_URL=postgres://vertex:vertex@localhost:5432/vertex
DATABASE_SSL=false
```

Linux users can install via their package manager (e.g. `apt install postgresql`). For managed providers (Render, Supabase, RDS, etc.), paste the provided connection string and set `DATABASE_SSL=true` when TLS is required.

## 7. Git Workflow

Keep backend changes isolated to the `server/` folder when possible.

```bash
# from project root
git status
# review changes
git add server README.md doc/BACKEND_SETUP.md
# commit once you're satisfied
git commit -m "Add Fastify backend scaffold"
```

Push your branch once both frontend and backend tests pass.
