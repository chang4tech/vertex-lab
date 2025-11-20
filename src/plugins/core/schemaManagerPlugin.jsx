import React from 'react';
import { loadSchema, saveSchema } from '../../utils/schemaUtils.js';
import { validateSchema } from '../../utils/schemaValidation.js';

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

function EdgeTypeEditor({ et, onChange, onRemove }) {
  const [src, setSrc] = React.useState(Array.isArray(et.sourceTypes) ? et.sourceTypes.join(', ') : '');
  const [dst, setDst] = React.useState(Array.isArray(et.targetTypes) ? et.targetTypes.join(', ') : '');

  const applyLists = (partial = {}) => {
    const toList = (s) => String(s || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    const next = {
      ...et,
      sourceTypes: toList(src),
      targetTypes: toList(dst),
      ...partial,
    };
    onChange(next);
  };

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, marginBottom: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 100px auto', gap: 8, alignItems: 'center' }}>
        <input value={et.name || ''} onChange={(e) => onChange({ ...et, name: e.target.value })} placeholder="Edge type name" />
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={!!et.directed} onChange={(e) => onChange({ ...et, directed: e.target.checked })} /> directed
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={!!et.noCycle} onChange={(e) => onChange({ ...et, noCycle: e.target.checked })} /> noCycle
        </label>
        <button onClick={onRemove} aria-label={`remove-edgeType-${et.name}`}>Remove</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Source types (comma-separated)</div>
          <input value={src} onChange={(e) => setSrc(e.target.value)} onBlur={() => applyLists()} placeholder="TypeA, TypeB" style={{ width: '100%' }} />
        </div>
        <div>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Target types (comma-separated)</div>
          <input value={dst} onChange={(e) => setDst(e.target.value)} onBlur={() => applyLists()} placeholder="TypeA, TypeB" style={{ width: '100%' }} />
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
  const save = () => {
    const errs = validateSchema(schema);
    if (errs.length) { setStatus(`Validation errors: ${errs[0]} (+${Math.max(0, errs.length-1)} more)`); return; }
    saveSchema(graphId, schema); setStatus('Saved'); setTimeout(() => setStatus(''), 1500);
  };

  const exportSchema = () => {
    const errs = validateSchema(schema);
    if (errs.length) { setStatus('Cannot export: invalid schema'); return; }
    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `schema-${graphId}.json`;
    document.body.appendChild(a); a.click(); setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
  };

  const importSchema = async (file) => {
    const text = await file.text();
    let json;
    try { json = JSON.parse(text); } catch (e) { setStatus('Invalid JSON'); return; }
    const errs = validateSchema(json);
    if (errs.length) { setStatus(`Invalid schema: ${errs[0]}`); return; }
    setSchema(json); setStatus('Loaded');
  };

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3 style={{ margin: 0 }}>Schema Manager</h3>
      <div style={{ fontSize: 13, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
        <strong>Tip — Create a Template Pack:</strong>
        <ol style={{ margin: '6px 0 0 16px', padding: 0 }}>
          <li>Define your node/edge types here (with required fields).</li>
          <li>Switch to the canvas to add sample nodes & tags.</li>
          <li>Open Templates → Export Pack to bundle schema + graph.</li>
        </ol>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={addType}>Add Type</button>
        <button onClick={() => {
          const next = { ...(schema || {}), edgeTypes: Array.isArray(schema.edgeTypes) ? [...schema.edgeTypes] : [] };
          next.edgeTypes.push({ name: 'relates_to', directed: false, sourceTypes: [], targetTypes: [], noCycle: false });
          setSchema(next);
        }}>Add Edge Type</button>
        <button onClick={save}>Save</button>
        <button onClick={exportSchema}>Export</button>
        <label>
          <input type="file" accept="application/json" style={{ display: 'none' }} onChange={async (e)=>{ const f=e.target.files?.[0]; if (f) await importSchema(f); e.target.value=''; }} />
          <span role="button" style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>Import…</span>
        </label>
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
      <div>
        <div style={{ fontWeight: 600, marginBottom: 6, marginTop: 6 }}>Edge Types</div>
        {(schema.edgeTypes || []).length === 0 && <div style={{ fontSize: 12, opacity: 0.7 }}>No edge types defined</div>}
        {(schema.edgeTypes || []).map((et, i) => (
          <EdgeTypeEditor
            key={i}
            et={et}
            onChange={(newET) => {
              const next = { ...schema, edgeTypes: [...(schema.edgeTypes || [])] };
              next.edgeTypes[i] = newET; setSchema(next);
            }}
            onRemove={() => {
              const next = { ...schema, edgeTypes: [...(schema.edgeTypes || [])] };
              next.edgeTypes.splice(i, 1); setSchema(next);
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

Define node types (with properties) and edge types for your graph. Node types have a name, color, and a list of properties (name, type, required, default, enum). Edge types include a name, direction, optional source/target type constraints, and an optional no-cycle constraint.

Stored per graph (localStorage). Other plugins (e.g., linter) can read the schema to validate nodes.
      `.trim(),
    },
  },
};

export default schemaManagerPlugin;
