import Fastify from 'fastify';
import sensiblePlugin from './plugins/sensible.js';
import corsPlugin from './plugins/cors.js';
import storePlugin from './plugins/store.js';
import authPlugin from './plugins/auth.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import libraryRoutes from './routes/library.js';

export function buildApp(options = {}) {
  const app = Fastify({
    logger: options.logger ?? true,
    disableRequestLogging: options.disableRequestLogging ?? false
  });

  const dbPath = options.dbPath ?? ':memory:';
  const databaseUrl = options.databaseUrl ?? null;
  const databaseSSL = options.databaseSSL ?? undefined;

  app.decorate('config', {
    isProduction: options.isProduction ?? false,
    dbPath,
    databaseUrl,
    databaseSSL
  });

  app.register(storePlugin, { dbPath, databaseUrl, databaseSSL });
  app.register(sensiblePlugin);
  app.register(corsPlugin);
  app.register(authPlugin);

  app.register(healthRoutes, { prefix: '/health' });
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(userRoutes, { prefix: '/api/user' });
  app.register(libraryRoutes, { prefix: '/api/library' });

  app.get('/', async () => ({ status: 'ok', service: 'vertex-lab-api' }));

  return app;
}
