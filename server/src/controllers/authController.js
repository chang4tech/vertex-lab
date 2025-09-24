const sanitizeUser = (user) => {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
};

export const authController = {
  async signup(request, reply) {
    const { name, email, password } = request.body || {};
    if (!email || !password) {
      return reply.badRequest('Email and password are required');
    }

    try {
      const user = await request.server.store.createUser({ name, email, password });
      await request.server.issueSession(reply, user.id);
      return sanitizeUser(user);
    } catch (error) {
      if (error.message === 'USER_EXISTS') {
        return reply.conflict('An account already exists for this email');
      }
      request.log.error(error, 'Failed to sign up user');
      return reply.internalServerError('Unable to create account');
    }
  },

  async login(request, reply) {
    const { email, password } = request.body || {};
    if (!email || !password) {
      return reply.badRequest('Email and password are required');
    }

    const result = await request.server.store.verifyUser({ email, password });
    if (!result) {
      return reply.unauthorized('Invalid email or password');
    }

    await request.server.issueSession(reply, result.id);
    return sanitizeUser(result);
  },

  async logout(request, reply) {
    await request.server.clearSessionCookie(request, reply);
    return { status: 'signed-out' };
  }
};
