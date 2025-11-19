import React from 'react';
import { loadSchema, saveSchema } from '../../utils/schemaUtils.js';

function TypeEditor({ t, onChange, onRemove }) {
  const [propName, setPropName] = React.useState('');
  const [propType, setPropType] = React.useState('string');
  const [propReq, setPropReq] = React.useState(false);
  const [propDefault, setPropDefault] = React.useState('');
  const [propEnum, setPropEnum] = React.useState('');

  const addProp = () => {
    if (!propName.trim()) return;
    const next = { ...t, properties: Array.isArray(t.properties) ? [...t.properties] : [] };
    next.properties.push({ name: propName.trim(), type: propType, required: propReq, default: propDefault || undefined, enum: propEnum ? propEnum.split(',').map(s => s.trim()).filter(Boolean) : undefined });
    onChange(next);
    setPropName(''); setPropDefault(''); setPropEnum(''); setPropReq(false); setPropType('string');
  };

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input value={t.name} onChange={(e) => onChange({ ...t, name: e.target.value })} placeholder="Type name" style={{ flex: 1 }} />
        <input value={t.color || ''} onChange={(e) => onChange({ ...t, color: e.target.value })} placeholder="#color" style={{ width: 120 }} />
        <button onClick={onRemove} aria-label={`remove-${t.name}`}>Remove</button>
      </div>
      <div style={{ marginTop: 6 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Properties</div>
        {(t.properties || []).map((p, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px 160px 1fr', gap: 6, alignItems: 'center', marginBottom: 4 }}>
            <div>{p.name}</div>
            <div>{p.type}</div>
            <div>{p.required ? 'required' : ''}</div>
            <div style={{ opacity: 0.7 }}>{p.default != null ? String(p.default) : ''}</div>
            <div style={{ opacity: 0.7 }}>{Array.isArray(p.enum) ? p.enum.join(', ') : ''}</div>
          </div>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px 160px 1fr', gap: 6, alignItems: 'center', marginTop: 6 }}>
          <input value={propName} onChange={(e) => setPropName(e.target.value)} placeholder="name" />
          <select value={propType} onChange={(e) => setPropType(e.target.value)}>
            {['string','number','boolean','string[]','number[]'].map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" checked={propReq} onChange={(e) => setPropReq(e.target.checked)} /> req
          </label>
          <input value={propDefault} onChange={(e) => setPropDefault(e.target.value)} placeholder="default" />
          <input value={propEnum} onChange={(e) => setPropEnum(e.target.value)} placeholder="enum a,b,c" />
        </div>
        <div style={{ marginTop: 6 }}>
          <button onClick={addProp}>Add Property</button>
        </div>
      </div>
    </div>
  );
}

function SchemaPanel({ api }) {
  const graphId = api.graphId || 'default';
  const [schema, setSchema] = React.useState(() => loadSchema(graphId));
  const [status, setStatus] = React.useState('');

  const addType = () => {
    const next = { ...(schema || {}), types: Array.isArray(schema.types) ? [...schema.types] : [] };
    next.types.push({ name: 'Type', color: '#1e293b', properties: [] });
    setSchema(next);
  };
  const save = () => { saveSchema(graphId, schema); setStatus('Saved'); setTimeout(() => setStatus(''), 1500); };

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3 style={{ margin: 0 }}>Schema Manager</h3>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={addType}>Add Type</button>
        <button onClick={save}>Save</button>
        {status && <span style={{ fontSize: 12, opacity: 0.8 }}>{status}</span>}
      </div>
      <div>
        {(schema.types || []).length === 0 && <div style={{ fontSize: 12, opacity: 0.7 }}>No types defined</div>}
        {(schema.types || []).map((t, idx) => (
          <TypeEditor key={idx}
            t={t}
            onChange={(newT) => {
              const next = { ...schema, types: [...(schema.types || [])] };
              next.types[idx] = newT; setSchema(next);
            }}
            onRemove={() => {
              const next = { ...schema, types: [...(schema.types || [])] };
              next.types.splice(idx, 1); setSchema(next);
            }}
          />
        ))}
      </div>
    </div>
  );
}

export const schemaManagerPlugin = {
  id: 'core.schemaManager',
  name: 'Schema Manager',
  version: '0.1.0',
  author: 'Vertex Lab Core',
  slots: {
    sidePanels: [
      {
        id: 'schemaPanel',
        title: 'Schema',
        allowCollapse: true,
        visible: () => true,
        render: (api) => <SchemaPanel api={api} />,
      },
    ],
    commands: [
      { id: 'core.schema.open', title: 'Open Schema Manager', when: 'canvas', run: () => {} },
    ],
    aboutPage: {
      markdown: `
# Schema Manager

Define types and properties for your graph. Types have a name, color, and a list of properties (name, type, required, default, enum).

Stored per graph (localStorage). Other plugins (e.g., linter) can read the schema to validate nodes.
      `.trim(),
    },
  },
};

export default schemaManagerPlugin;

