import { getRuntimeConfig } from '../config/runtimeConfig.js';

const FALLBACK_BASE_URL = 'http://localhost:4000';

export function getApiBaseUrl() {
  const { apiBaseUrl } = getRuntimeConfig();
  const raw = typeof apiBaseUrl === 'string' && apiBaseUrl.trim().length > 0
    ? apiBaseUrl.trim()
    : FALLBACK_BASE_URL;
  return raw.replace(/\/$/, '');
}

export async function apiFetch(path, options = {}) {
  const isAbsolute = /^https?:\/\//i.test(path);
  const base = getApiBaseUrl();
  const target = isAbsolute
    ? path
    : `${base}${path.startsWith('/') ? path : `/${path}`}`;

  const init = {
    credentials: options.credentials ?? 'include',
    ...options,
  };

  return fetch(target, init);
}
