#!/usr/bin/env bash
set -euo pipefail

DB_NAME=${DATABASE_NAME:-vertex}
DB_USER=${DATABASE_USER:-vertex}
DB_PASSWORD=${DATABASE_PASSWORD:-vertex}
DB_HOST=${DATABASE_HOST:-localhost}
DB_PORT=${DATABASE_PORT:-5432}
SUPERUSER=${PG_SUPERUSER:-$USER}

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew is required to manage postgresql@14. Install Homebrew first." >&2
  exit 1
fi

if ! brew list postgresql@14 >/dev/null 2>&1; then
  echo "Installing postgresql@14 via Homebrew…"
  brew install postgresql@14
fi

if ! brew services list | awk '{print $1 " " $2}' | grep -q "postgresql@14 started"; then
  echo "Starting postgresql@14 service…"
  brew services start postgresql@14 >/dev/null
fi

echo "Waiting for Postgres to accept connections on ${DB_HOST}:${DB_PORT}…"
for _ in {1..30}; do
  if pg_isready -q -h "$DB_HOST" -p "$DB_PORT"; then
    break
  fi
  sleep 1
  echo -n '.'
done
echo

if ! pg_isready -q -h "$DB_HOST" -p "$DB_PORT"; then
  echo "Postgres is not responding on ${DB_HOST}:${DB_PORT}." >&2
  exit 1
fi

role_exists=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$SUPERUSER" -d postgres -Atqc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'") || true
if [[ -z "$role_exists" ]]; then
  echo "Creating role '${DB_USER}'…"
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$SUPERUSER" -d postgres -c "CREATE ROLE \"${DB_USER}\" WITH LOGIN PASSWORD '${DB_PASSWORD}';"
else
  echo "Role '${DB_USER}' already exists."
fi

db_exists=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$SUPERUSER" -d postgres -Atqc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'") || true
if [[ -z "$db_exists" ]]; then
  echo "Creating database '${DB_NAME}'…"
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$SUPERUSER" -d postgres -c "CREATE DATABASE \"${DB_NAME}\" OWNER \"${DB_USER}\";"
else
  echo "Database '${DB_NAME}' already exists."
fi

echo "Granting privileges…"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$SUPERUSER" -d "$DB_NAME" <<SQL
GRANT ALL PRIVILEGES ON DATABASE "${DB_NAME}" TO "${DB_USER}";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "${DB_USER}";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "${DB_USER}";
SQL

echo "Local Postgres is ready."
