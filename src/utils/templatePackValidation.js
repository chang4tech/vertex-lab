const ALLOWED_PROP_TYPES = new Set(['string', 'number', 'boolean', 'string[]', 'number[]']);

export function validateTemplatePack(pack) {
  const errors = [];
  if (!pack || typeof pack !== 'object') return ['Pack must be a JSON object'];

  // meta
  if (!pack.meta || typeof pack.meta !== 'object') errors.push('meta is required');
  if (!pack.meta || typeof pack.meta.name !== 'string' || pack.meta.name.trim() === '') errors.push('meta.name is required');

  // requires
  if (pack.requires != null && typeof pack.requires !== 'object') errors.push('requires must be an object when provided');
  const req = pack.requires || {};
  if (req.plugins != null && !Array.isArray(req.plugins)) errors.push('requires.plugins must be an array when provided');
  if (Array.isArray(req.plugins)) {
    req.plugins.forEach((p, i) => {
      if (!p || typeof p !== 'object' || typeof p.id !== 'string' || p.id.trim() === '') errors.push(`requires.plugins[${i}].id is required`);
    });
  }
  if (req.capabilities != null && !Array.isArray(req.capabilities)) errors.push('requires.capabilities must be an array when provided');

  // schema (optional)
  if (pack.schema != null && typeof pack.schema !== 'object') errors.push('schema must be an object when provided');
  if (pack.schema && pack.schema.types != null && !Array.isArray(pack.schema.types)) errors.push('schema.types must be an array when provided');
  if (pack.schema && Array.isArray(pack.schema.types)) {
    const tnames = new Set();
    pack.schema.types.forEach((t, i) => {
      if (!t || typeof t !== 'object' || typeof t.name !== 'string' || !t.name.trim()) errors.push(`schema.types[${i}].name is required`);
      const k = String(t?.name || '').toLowerCase();
      if (tnames.has(k)) errors.push(`Duplicate schema type: ${t?.name}`); else tnames.add(k);
      if (t.properties != null && !Array.isArray(t.properties)) errors.push(`schema.types[${i}].properties must be an array`);
      (t.properties || []).forEach((p, j) => {
        if (!p || typeof p !== 'object' || typeof p.name !== 'string' || !p.name.trim()) errors.push(`schema.types[${i}].properties[${j}].name is required`);
        if (!ALLOWED_PROP_TYPES.has(p.type)) errors.push(`schema.types[${i}].properties[${j}].type invalid`);
      });
    });
  }

  // tags
  if (pack.tags != null && !Array.isArray(pack.tags)) errors.push('tags must be an array when provided');
  if (Array.isArray(pack.tags)) {
    pack.tags.forEach((t, i) => {
      if (!t || typeof t !== 'object' || typeof t.name !== 'string' || !t.name.trim()) errors.push(`tags[${i}].name is required`);
      if (t.color && typeof t.color !== 'string') errors.push(`tags[${i}].color must be a string when provided`);
    });
  }

  // properties (global)
  if (pack.properties != null && !Array.isArray(pack.properties)) errors.push('properties must be an array when provided');
  if (Array.isArray(pack.properties)) {
    pack.properties.forEach((p, i) => {
      if (!p || typeof p !== 'object' || typeof p.name !== 'string' || !p.name.trim()) errors.push(`properties[${i}].name is required`);
      if (!ALLOWED_PROP_TYPES.has(p.type)) errors.push(`properties[${i}].type invalid`);
    });
  }

  // nodes
  if (pack.nodes != null && !Array.isArray(pack.nodes)) errors.push('nodes must be an array when provided');
  if (Array.isArray(pack.nodes)) {
    pack.nodes.forEach((n, i) => {
      if (!n || typeof n !== 'object') errors.push(`nodes[${i}] must be an object`);
      if (n.label != null && typeof n.label !== 'string') errors.push(`nodes[${i}].label must be a string when provided`);
      if (n.type != null && typeof n.type !== 'string') errors.push(`nodes[${i}].type must be a string when provided`);
    });
  }

  // edges
  if (pack.edges != null && !Array.isArray(pack.edges)) errors.push('edges must be an array when provided');
  if (Array.isArray(pack.edges)) {
    pack.edges.forEach((e, i) => {
      if (!e || typeof e !== 'object') errors.push(`edges[${i}] must be an object`);
      if (e.source == null) errors.push(`edges[${i}].source is required`);
      if (e.target == null) errors.push(`edges[${i}].target is required`);
      if (e.directed != null && typeof e.directed !== 'boolean') errors.push(`edges[${i}].directed must be boolean when provided`);
    });
  }

  return errors;
}

