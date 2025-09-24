import { buildApp } from './app.js';
import { env } from './config/env.js';

async function start() {
  const app = buildApp({
    logger: {
      level: env.logLevel,
      transport: env.nodeEnv === 'development' ? {
        target: 'pino-pretty',
        options: {
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      } : undefined
    },
    isProduction: env.nodeEnv === 'production',
    dbPath: env.databaseFile,
    databaseUrl: env.databaseUrl,
    databaseSSL: env.databaseUrl ? env.databaseSSL : undefined
  });

  try {
    await app.listen({ port: env.port, host: '0.0.0.0' });
    app.log.info(`Server listening on port ${env.port}`);
  } catch (error) {
    app.log.error(error, 'Failed to start server');
    process.exit(1);
  }
}

start();
