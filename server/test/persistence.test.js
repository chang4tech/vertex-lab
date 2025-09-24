import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { buildApp } from '../src/app.js';

describe('database persistence', () => {
  it('retains users between restarts', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'vertex-db-'));
    const dbPath = join(dir, 'vertex.db');
    const email = `${randomUUID()}@example.com`;
    const password = 'password123';

    const app1 = buildApp({ logger: false, dbPath });
    try {
      const signupResponse = await app1.inject({
        method: 'POST',
        url: '/api/auth/signup',
        payload: {
          name: 'Persist User',
          email,
          password
        }
      });
      expect(signupResponse.statusCode).toBe(200);
    } finally {
      await app1.close();
    }

    const app2 = buildApp({ logger: false, dbPath });
    try {
      const loginResponse = await app2.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email, password }
      });
      expect(loginResponse.statusCode).toBe(200);
      const data = loginResponse.json();
      expect(data).toMatchObject({ email });
    } finally {
      await app2.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
