import fp from 'fastify-plugin';
import cookie from '@fastify/cookie';

const SESSION_COOKIE = 'vertex_session';

async function authPlugin(fastify) {
  await fastify.register(cookie, {
    hook: 'onRequest',
    parseOptions: {}
  });

  fastify.decorateRequest('currentUser', null);

  fastify.addHook('preHandler', async (request) => {
    const sessionId = request.cookies?.[SESSION_COOKIE];
    if (!sessionId) return;
    const session = await fastify.store.getSession(sessionId);
    if (!session) return;
    const user = await fastify.store.getUserById(session.userId);
    if (!user) {
      await fastify.store.clearSession(sessionId);
      return;
    }
    request.currentUser = user;
  });

  fastify.decorate('issueSession', async (reply, userId) => {
    const sessionId = await fastify.store.createSession(userId);
    reply.setCookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: fastify.config?.isProduction ?? false,
      maxAge: 60 * 60 * 24 * 7
    });
    return sessionId;
  });

  fastify.decorate('clearSessionCookie', async (request, reply) => {
    const sessionId = request.cookies?.[SESSION_COOKIE];
    if (sessionId) {
      await fastify.store.clearSession(sessionId);
    }
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
  });
}

export default fp(authPlugin, {
  name: 'auth-plugin'
});
