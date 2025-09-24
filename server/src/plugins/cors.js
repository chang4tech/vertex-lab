import fp from 'fastify-plugin';
import cors from '@fastify/cors';

async function corsPlugin(fastify) {
  await fastify.register(cors, {
    origin: true,
    credentials: true
  });
}

export default fp(corsPlugin, {
  name: 'cors-plugin'
});
