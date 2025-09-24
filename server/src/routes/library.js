import { libraryController } from '../controllers/libraryController.js';

async function libraryRoutes(fastify) {
  fastify.get('/', libraryController.list);
  fastify.post('/', libraryController.create);
  fastify.delete('/:id', libraryController.remove);
}

export default libraryRoutes;
