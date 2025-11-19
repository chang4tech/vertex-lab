const SCHEMA_PREFIX = 'vertex_graph_schema_';

export function schemaKey(graphId = 'default') {
  const id = graphId || 'default';
  return `${SCHEMA_PREFIX}${id}`;
}

export function loadSchema(graphId = 'default') {
  try {
    const raw = localStorage.getItem(schemaKey(graphId));
    return raw ? JSON.parse(raw) : { types: [], edgeTypes: [] };
  } catch {
    return { types: [], edgeTypes: [] };
  }
}

export function saveSchema(graphId = 'default', schema) {
  try {
    localStorage.setItem(schemaKey(graphId), JSON.stringify(schema || { types: [], edgeTypes: [] }));
  } catch {}
}

