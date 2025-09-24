import dotenv from 'dotenv';
import { resolve, dirname } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

const envResult = dotenv.config();

if (envResult.error && process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line no-console
  console.warn('No .env file found; relying on process environment variables.');
}

const defaultDatabaseFile = process.env.DATABASE_FILE
  ? resolve(process.cwd(), process.env.DATABASE_FILE)
  : resolve(process.cwd(), 'data/vertex.db');

const databaseUrl = process.env.DATABASE_URL ? String(process.env.DATABASE_URL).trim() : null;
const databaseSSL = process.env.DATABASE_SSL
  ? process.env.DATABASE_SSL === 'true' || process.env.DATABASE_SSL === '1'
  : false;

let dataDir = null;
if (!databaseUrl && defaultDatabaseFile !== ':memory:') {
  dataDir = dirname(defaultDatabaseFile);
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
}

export const env = {
  port: Number(process.env.PORT || 4000),
  logLevel: process.env.LOG_LEVEL || 'info',
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseFile: defaultDatabaseFile,
  databaseUrl,
  databaseSSL,
  dataDir
};

export const isProduction = env.nodeEnv === 'production';
