const ALLOWED_PROP_TYPES = new Set(['string', 'number', 'boolean', 'string[]', 'number[]']);

export const SCHEMA_JSON_SCHEMA = {
  type: 'object',
  required: ['types'],
  additionalProperties: true,
  properties: {
    types: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name'],
        additionalProperties: true,
        properties: {
          name: { type: 'string', minLength: 1 },
          color: { type: 'string' },
          properties: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'type'],
              additionalProperties: true,
              properties: {
                name: { type: 'string', minLength: 1 },
                type: { enum: Array.from(ALLOWED_PROP_TYPES) },
                required: { type: 'boolean' },
                default: {},
                enum: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      }
    },
    edgeTypes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name'],
        additionalProperties: true,
        properties: {
          name: { type: 'string', minLength: 1 },
          directed: { type: 'boolean' },
          sourceTypes: { type: 'array', items: { type: 'string' } },
          targetTypes: { type: 'array', items: { type: 'string' } },
          // When true, the relation must be acyclic (no directed cycles)
          noCycle: { type: 'boolean' }
        }
      }
    }
  }
};

export function validateSchema(schema) {
  const errors = [];
  if (!schema || typeof schema !== 'object') {
    return ['Schema must be an object'];
  }
  const types = schema.types;
  if (!Array.isArray(types)) errors.push('types must be an array');
  const edgeTypes = schema.edgeTypes;
  if (edgeTypes != null && !Array.isArray(edgeTypes)) errors.push('edgeTypes must be an array when provided');

  if (Array.isArray(types)) {
    const typeNames = new Set();
    types.forEach((t, idx) => {
      if (!t || typeof t !== 'object') { errors.push(`types[${idx}] must be an object`); return; }
      if (typeof t.name !== 'string' || t.name.trim() === '') errors.push(`types[${idx}].name is required`);
      const key = String(t.name || '').toLowerCase();
      if (typeNames.has(key)) errors.push(`Duplicate type name: ${t.name}`); else typeNames.add(key);
      if (t.properties != null && !Array.isArray(t.properties)) errors.push(`types[${idx}].properties must be an array`);
      if (Array.isArray(t.properties)) {
        const pnames = new Set();
        t.properties.forEach((p, j) => {
          if (!p || typeof p !== 'object') { errors.push(`types[${idx}].properties[${j}] must be an object`); return; }
          if (typeof p.name !== 'string' || p.name.trim() === '') errors.push(`types[${idx}].properties[${j}].name is required`);
          if (!ALLOWED_PROP_TYPES.has(p.type)) errors.push(`types[${idx}].properties[${j}].type invalid`);
          const pname = String(p.name || '').toLowerCase();
          if (pnames.has(pname)) errors.push(`Duplicate property name '${p.name}' in type '${t.name}'`); else pnames.add(pname);
          if (Array.isArray(p.enum)) {
            const nonStr = p.enum.find(v => typeof v !== 'string');
            if (nonStr != null) errors.push(`types[${idx}].properties[${j}].enum must be array of strings`);
          }
        });
      }
    });
  }

  if (Array.isArray(edgeTypes)) {
    edgeTypes.forEach((et, i) => {
      if (!et || typeof et !== 'object') { errors.push(`edgeTypes[${i}] must be an object`); return; }
      if (typeof et.name !== 'string' || et.name.trim() === '') errors.push(`edgeTypes[${i}].name is required`);
      if (et.sourceTypes != null && !Array.isArray(et.sourceTypes)) errors.push(`edgeTypes[${i}].sourceTypes must be an array`);
      if (et.targetTypes != null && !Array.isArray(et.targetTypes)) errors.push(`edgeTypes[${i}].targetTypes must be an array`);
      if (et.noCycle != null && typeof et.noCycle !== 'boolean') errors.push(`edgeTypes[${i}].noCycle must be boolean when provided`);
    });
  }

  return errors;
}
