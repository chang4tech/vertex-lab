const sanitizeEntry = (entry) => ({
  id: entry.id,
  graphId: entry.graphId,
  name: entry.name,
  nodes: entry.nodes,
  edges: entry.edges,
  createdAt: entry.createdAt,
  updatedAt: entry.updatedAt,
  metadata: entry.metadata
});

export const libraryController = {
  async list(request, reply) {
    if (!request.currentUser) {
      return reply.status(401).send({ message: 'Not authenticated' });
    }
    const entries = await request.server.store.listLibrary(request.currentUser.id);
    return entries.map(sanitizeEntry);
  },

  async create(request, reply) {
    if (!request.currentUser) {
      return reply.status(401).send({ message: 'Not authenticated' });
    }
    const { name, nodes, edges, metadata } = request.body || {};
    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      return reply.badRequest('Nodes and edges must be arrays');
    }
    const entry = await request.server.store.upsertLibraryEntry(request.currentUser.id, {
      name,
      nodes,
      edges,
      metadata
    });
    return sanitizeEntry(entry);
  },

  async remove(request, reply) {
    if (!request.currentUser) {
      return reply.status(401).send({ message: 'Not authenticated' });
    }
    const { id } = request.params;
    if (!id) {
      return reply.badRequest('Graph id missing');
    }
    const removed = await request.server.store.deleteLibraryEntry(request.currentUser.id, id);
    if (!removed) {
      return reply.notFound('Graph not found');
    }
    return { status: 'deleted', id };
  }
};
