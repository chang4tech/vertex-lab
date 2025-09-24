const sanitizeUser = (user) => {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
};

export const userController = {
  async current(request, reply) {
    if (!request.currentUser) {
      return reply.status(401).send({ message: 'Not authenticated' });
    }

    const library = await request.server.store.listLibrary(request.currentUser.id);
    return {
      ...sanitizeUser(request.currentUser),
      library
    };
  }
};
