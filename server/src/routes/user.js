import { userController } from '../controllers/userController.js';

async function userRoutes(fastify) {
  fastify.get('/', userController.current);
}

export default userRoutes;
