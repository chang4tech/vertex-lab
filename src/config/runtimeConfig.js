const DEFAULT_CONFIG = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
};

let runtimeConfig = { ...DEFAULT_CONFIG };

const mergeConfig = (next = {}) => {
  if (!next || typeof next !== 'object') return;
  runtimeConfig = {
    ...runtimeConfig,
    ...next
  };
  if (typeof window !== 'undefined') {
    window.__VERTEX_CONFIG__ = { ...runtimeConfig };
  }
};

if (typeof window !== 'undefined') {
  mergeConfig(window.__VERTEX_CONFIG__);
  window.__setVertexConfig__ = (next) => {
    mergeConfig(next);
    return { ...runtimeConfig };
  };
}

export function getRuntimeConfig() {
  return { ...runtimeConfig };
}

export function setRuntimeConfig(partial) {
  mergeConfig(partial);
  return getRuntimeConfig();
}

export function resetRuntimeConfig() {
  runtimeConfig = { ...DEFAULT_CONFIG };
  if (typeof window !== 'undefined') {
    mergeConfig(window.__VERTEX_CONFIG__);
  }
  return getRuntimeConfig();
}
