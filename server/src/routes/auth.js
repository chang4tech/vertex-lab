import { authController } from '../controllers/authController.js';

async function authRoutes(fastify) {
  fastify.post('/login', authController.login);
  fastify.post('/signup', authController.signup);
  fastify.post('/logout', authController.logout);
}

export default authRoutes;
