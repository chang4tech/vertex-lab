import fp from 'fastify-plugin';
import { createSqliteStore } from '../store/sqliteStore.js';
import { createPostgresStore } from '../store/postgresStore.js';

async function storePlugin(fastify, options) {
  const databaseUrl = options?.databaseUrl || fastify.config?.databaseUrl || process.env.DATABASE_URL;
  const usePostgres = Boolean(databaseUrl);

  if (usePostgres) {
    const { store, close } = await createPostgresStore({
      connectionString: databaseUrl,
      ssl: options?.databaseSSL || fastify.config?.databaseSSL || undefined
    });
    fastify.decorate('store', store);
    fastify.decorate('storeDriver', 'postgres');
    fastify.addHook('onClose', async () => {
      await close();
    });
  } else {
    const { store, close } = createSqliteStore({
      dbPath: options?.dbPath || fastify.config?.dbPath || ':memory:'
    });
    fastify.decorate('store', store);
    fastify.decorate('storeDriver', 'sqlite');
    fastify.addHook('onClose', async () => {
      await close();
    });
  }
}

export default fp(storePlugin, {
  name: 'store-plugin'
});
