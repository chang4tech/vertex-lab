import fp from 'fastify-plugin';
import sensible from '@fastify/sensible';

async function sensiblePlugin(fastify) {
  await fastify.register(sensible);
}

export default fp(sensiblePlugin, {
  name: 'sensible-plugin'
});
