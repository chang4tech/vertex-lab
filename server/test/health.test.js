import { describe, it, expect } from 'vitest';
import { buildApp } from '../src/app.js';

describe('health routes', () => {
  it('returns ok for status endpoint', async () => {
    const app = buildApp({ logger: false, dbPath: ':memory:' });
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    const payload = response.json();
    expect(payload.status).toBe('ok');
    expect(payload.service).toBeUndefined();
    await app.close();
  });

  it('exposes readiness endpoint', async () => {
    const app = buildApp({ logger: false, dbPath: ':memory:' });
    const response = await app.inject({ method: 'GET', url: '/health/readiness' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ready' });
    await app.close();
  });

  it('provides root ok endpoint', async () => {
    const app = buildApp({ logger: false, dbPath: ':memory:' });
    const response = await app.inject({ method: 'GET', url: '/' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok', service: 'vertex-lab-api' });
    await app.close();
  });
});
