import { healthController } from '../controllers/healthController.js';

async function healthRoutes(fastify) {
  fastify.get('/', healthController.status);
  fastify.get('/readiness', healthController.readiness);
  fastify.get('/liveness', healthController.liveness);
}

export default healthRoutes;
