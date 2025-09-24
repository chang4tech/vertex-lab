import { describe, it, expect } from 'vitest';
import { buildApp } from '../src/app.js';

const signup = async (app, payload = {}) => {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/signup',
    payload: {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      ...payload
    }
  });
  return response;
};

describe('authentication flow', () => {
  it('allows signup, session creation, and user retrieval', async () => {
    const app = buildApp({ logger: false, dbPath: ':memory:' });

    const signupResponse = await signup(app);
    expect(signupResponse.statusCode).toBe(200);
    const cookie = signupResponse.cookies.find(c => c.name === 'vertex_session');
    expect(cookie).toBeDefined();

    const userResponse = await app.inject({
      method: 'GET',
      url: '/api/user',
      cookies: {
        vertex_session: cookie.value
      }
    });

    expect(userResponse.statusCode).toBe(200);
    expect(userResponse.json()).toMatchObject({
      email: 'test@example.com',
      library: []
    });
    await app.close();
  });

  it('supports login and library persistence', async () => {
    const app = buildApp({ logger: false, dbPath: ':memory:' });

    await signup(app);

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'test@example.com',
        password: 'password123'
      }
    });

    expect(loginResponse.statusCode).toBe(200);
    const cookie = loginResponse.cookies.find(c => c.name === 'vertex_session');
    expect(cookie).toBeDefined();

    const createEntry = await app.inject({
      method: 'POST',
      url: '/api/library',
      cookies: { vertex_session: cookie.value },
      payload: {
        name: 'Sample Graph',
        nodes: [{ id: 1 }],
        edges: []
      }
    });
    expect(createEntry.statusCode).toBe(200);

    const listEntries = await app.inject({
      method: 'GET',
      url: '/api/library',
      cookies: { vertex_session: cookie.value }
    });
    expect(listEntries.statusCode).toBe(200);
    const payload = listEntries.json();
    expect(Array.isArray(payload)).toBe(true);
    expect(payload[0]).toMatchObject({
      name: 'Sample Graph',
      nodes: [{ id: 1 }],
      edges: []
    });
    await app.close();
  });
});
