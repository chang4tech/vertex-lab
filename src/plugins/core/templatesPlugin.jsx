import React from 'react';
import { loadTags, saveTags, generateTagId } from '../../utils/tagUtils.js';
import { validateTemplatePack } from '../../utils/templatePackValidation.js';
import { loadSchema, saveSchema } from '../../utils/schemaUtils.js';
import templateConfig from '../templates.config.json';

const VIS_KEY = 'plugin_core.templates.showPanel';

function getPanelVisible() { try { return localStorage.getItem(VIS_KEY) === '1'; } catch { return false; } }
function setPanelVisible(v) { try { localStorage.setItem(VIS_KEY, v ? '1' : '0'); } catch {} }

function nowVersion() {
  try {
    // package.json is bundled; use env injected by Vite if present
    return import.meta.env?.PACKAGE_VERSION || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function basicValidatePack(pack) {
  const errors = [];
  if (!pack || typeof pack !== 'object') return ['Pack must be a JSON object'];
  if (!pack.meta || typeof pack.meta.name !== 'string' || pack.meta.name.trim() === '') errors.push('meta.name is required');
  if (pack.tags && !Array.isArray(pack.tags)) errors.push('tags must be an array');
  if (pack.properties && !Array.isArray(pack.properties)) errors.push('properties must be an array');
  if (pack.nodes && !Array.isArray(pack.nodes)) errors.push('nodes must be an array');
  if (pack.edges && !Array.isArray(pack.edges)) errors.push('edges must be an array');
  return errors;
}

function summarizeDependencies(pack, api) {
  const requires = pack?.requires || {};
  const appOk = true; // TODO: compare versions if needed
  const missingPlugins = (requires.plugins || [])
    .filter(p => (api.pluginPrefs?.[p.id]) === false || api.pluginPrefs?.[p.id] === undefined)
    .map(p => p.id);
  const capabilities = requires.capabilities || [];
  return { appOk, missingPlugins, capabilities };
}

function computeTagPlan(incoming, existing) {
  const plan = [];
  const byName = new Map(existing.map(t => [String(t.name || '').toLowerCase(), t]));
  (incoming || []).forEach(t => {
    const name = String(t.name || '').trim();
    if (!name) return;
    const key = name.toLowerCase();
    const match = byName.get(key);
    if (match) {
      plan.push({ action: 'merge', incoming: t, target: match });
    } else {
      plan.push({ action: 'add', incoming: t, newId: t.id || generateTagId(name) });
    }
  });
  return plan;
}

function applyPack({ pack, api, tagPlan, mapping, importSchemaOption, includeEdgeTypes, existingSchema, graphId }) {
  // Apply tags
  if (Array.isArray(tagPlan) && tagPlan.length) {
    const existing = loadTags();
    const merged = [...existing];
    tagPlan.forEach(step => {
      if (step.action === 'add') {
        merged.push({ id: step.newId, name: step.incoming.name, color: step.incoming.color || '#94a3b8' });
      } else if (step.action === 'merge') {
        // no change to existing tag structure for MVP
      }
    });
    saveTags(merged);
  }

  // Build mapping helpers (types / properties)
  const typeMap = new Map();
  const propMap = new Map(); // key: lower(typeName) => Map(lower(incomingProp) => targetName or null(skip))
  if (mapping && Array.isArray(mapping.types)) {
    mapping.types.forEach((tm) => {
      const from = String(tm.incoming || '').toLowerCase();
      const to = tm.skip ? null : (tm.target || '').trim();
      typeMap.set(from, to || null);
      const propMappings = new Map();
      (tm.properties || []).forEach((pm) => {
        const pFrom = String(pm.incoming || '').toLowerCase();
        propMappings.set(pFrom, pm.skip ? null : (pm.target || pm.incoming));
      });
      propMap.set(from, propMappings);
    });
  }

  // Optionally import schema into Schema Manager (merge with existing)
  try {
    if (importSchemaOption && pack.schema && Array.isArray(pack.schema.types)) {
      const ex = existingSchema && Array.isArray(existingSchema.types) ? existingSchema : { types: [], edgeTypes: [] };
      const merged = { types: [...(ex.types || [])], edgeTypes: Array.isArray(ex.edgeTypes) ? [...ex.edgeTypes] : [] };
      const existingTypeByName = new Map((merged.types || []).map(t => [String(t.name || '').toLowerCase(), t]));
      const ensureType = (name, color) => {
        const key = String(name || '').toLowerCase();
        let t = existingTypeByName.get(key);
        if (!t) { t = { name, color, properties: [] }; merged.types.push(t); existingTypeByName.set(key, t); }
        if (!Array.isArray(t.properties)) t.properties = [];
        return t;
      };

      // Merge types/properties per mapping
      mapping?.types?.forEach((tm) => {
        if (tm.skip) return;
        const incoming = (pack.schema.types || []).find(t => String(t.name || '').toLowerCase() === String(tm.incoming || '').toLowerCase());
        if (!incoming) return;
        const targetName = tm.target?.trim() || incoming.name;
        const t = ensureType(targetName, incoming.color);
        const existingProps = new Map((t.properties || []).map(p => [String(p.name || '').toLowerCase(), p]));
        (tm.properties || []).forEach((pm) => {
          if (pm.skip) return;
          const inProp = (incoming.properties || []).find(p => String(p.name || '').toLowerCase() === String(pm.incoming || '').toLowerCase());
          if (!inProp) return;
          const targetPropName = pm.target?.trim() || inProp.name;
          const key = String(targetPropName).toLowerCase();
          if (!existingProps.has(key)) {
            (t.properties || (t.properties = [])).push({ name: targetPropName, type: inProp.type, required: !!inProp.required, default: inProp.default, enum: inProp.enum });
            existingProps.set(key, true);
          }
        });
      });

      // Merge edge types if requested
      if (includeEdgeTypes && Array.isArray(pack.schema.edgeTypes)) {
        const existingEdgeByName = new Map((merged.edgeTypes || []).map(et => [String(et.name || '').toLowerCase(), et]));
        (pack.schema.edgeTypes || []).forEach((et) => {
          const key = String(et.name || '').toLowerCase();
          if (!existingEdgeByName.has(key)) {
            merged.edgeTypes.push({ name: et.name, directed: !!et.directed, sourceTypes: et.sourceTypes || [], targetTypes: et.targetTypes || [], noCycle: !!et.noCycle });
            existingEdgeByName.set(key, true);
          }
        });
      }

      saveSchema(graphId || 'default', merged);
    }
  } catch {}

  // Apply nodes/edges (optional) with mapping for type/property names
  const nodes = Array.isArray(api.nodes) ? api.nodes : [];
  const edges = Array.isArray(api.edges) ? api.edges : [];
  const nextNodes = [...nodes];
  const idMap = new Map();
  let maxId = nodes.reduce((m, n) => Math.max(m, Number(n.id) || 0), 0);
  (pack.nodes || []).forEach(n => {
    const newId = ++maxId;
    idMap.set(n.id, newId);
    // Determine type mapping
    const incomingType = String(n.type || '').toLowerCase();
    const mappedType = typeMap.has(incomingType) ? typeMap.get(incomingType) : (n.type || undefined);
    // Collect extra props (exclude reserved keys)
    const reserved = new Set(['id','label','x','y','level','tags','type']);
    const props = {};
    Object.keys(n || {}).forEach(k => { if (!reserved.has(k)) props[k] = n[k]; });
    const pm = propMap.get(incomingType) || new Map();
    const remappedProps = {};
    Object.keys(props).forEach((k) => {
      const trg = pm.has(String(k).toLowerCase()) ? pm.get(String(k).toLowerCase()) : k;
      if (trg == null) return; // skip
      remappedProps[trg] = props[k];
    });

    nextNodes.push({
      id: newId,
      label: n.label || `Node ${newId}`,
      x: typeof n.x === 'number' ? n.x : 400 + (Math.random() * 120 - 60),
      y: typeof n.y === 'number' ? n.y : 300 + (Math.random() * 120 - 60),
      level: n.level ?? 0,
      tags: Array.isArray(n.tags) ? n.tags : [],
      type: mappedType || undefined,
      ...remappedProps,
    });
  });
  if (idMap.size > 0) {
    api.updateNodes?.(nextNodes);
  }
  if (Array.isArray(pack.edges) && pack.edges.length > 0) {
    const newEdges = [...edges];
    pack.edges.forEach(e => {
      const s = idMap.get(e.source) || e.source;
      const t = idMap.get(e.target) || e.target;
      if (s != null && t != null) newEdges.push({ source: s, target: t, directed: !!e.directed, type: e.type });
    });
    api.updateEdges?.(newEdges);
  }
}

function TemplatesPanel({ api }) {
  const [pack, setPack] = React.useState(null);
  const [errors, setErrors] = React.useState([]);
  const [depSummary, setDepSummary] = React.useState(null);
  const [tagPlan, setTagPlan] = React.useState([]);
  const [status, setStatus] = React.useState('');
  const [existingSchema, setExistingSchema] = React.useState(() => loadSchema(api.graphId || 'default'));
  const [typeMappings, setTypeMappings] = React.useState([]);
  const [importSchemaOption, setImportSchemaOption] = React.useState(false);
  const [includeEdgeTypes, setIncludeEdgeTypes] = React.useState(true);
  const missingPlugins = depSummary?.missingPlugins || [];
  const openSchemaManager = React.useCallback(() => {
    try {
      window.location.hash = '#/plugin/core.schemaManager';
    } catch {}
  }, []);

  // Compute mapping collision warnings (duplicate targets, existing prop conflicts)
  const mappingWarnings = React.useMemo(() => {
    const typeWarnings = new Map(); // idx -> [msg]
    const propWarnings = new Map(); // `${idx}:${j}` -> [msg]

    if (!Array.isArray(typeMappings) || typeMappings.length === 0) {
      return { typeWarnings, propWarnings, total: 0 };
    }

    // Type-level duplicate target detection
    const typeTargetCount = new Map();
    typeMappings.forEach((tm) => {
      if (tm.skip) return;
      const target = String(tm.target || tm.incoming || '').trim().toLowerCase();
      if (!target) return;
      typeTargetCount.set(target, (typeTargetCount.get(target) || 0) + 1);
    });

    typeMappings.forEach((tm, idx) => {
      if (tm.skip) return;
      const targetName = String(tm.target || tm.incoming || '').trim();
      const targetKey = targetName.toLowerCase();
      if (!targetKey) return;
      const count = typeTargetCount.get(targetKey) || 0;
      if (count > 1) {
        const arr = typeWarnings.get(idx) || [];
        arr.push(`Multiple types map to '${targetName}'. They will merge.`);
        typeWarnings.set(idx, arr);
      }

      // Property-level duplicate target detection within the same type
      const propTargetCount = new Map();
      (tm.properties || []).forEach((pm) => {
        if (pm.skip) return;
        const t = String(pm.target || pm.incoming || '').trim().toLowerCase();
        if (!t) return;
        propTargetCount.set(t, (propTargetCount.get(t) || 0) + 1);
      });
      (tm.properties || []).forEach((pm, j) => {
        if (pm.skip) return;
        const targetProp = String(pm.target || pm.incoming || '').trim();
        const key = targetProp.toLowerCase();
        const msgs = propWarnings.get(`${idx}:${j}`) || [];
        if (propTargetCount.get(key) > 1) {
          msgs.push(`Duplicate target property '${targetProp}' in '${targetName}'.`);
        }
        // Existing schema property collision (warn)
        const exType = (existingSchema?.types || []).find((t) => String(t.name || '').toLowerCase() === targetKey);
        if (exType) {
          const exists = (exType.properties || []).some((p) => String(p.name || '').toLowerCase() === key);
          if (exists && String(pm.incoming || '').toLowerCase() !== key) {
            msgs.push(`Target property '${targetProp}' already exists in type '${exType.name}'.`);
          }
        }
        if (msgs.length > 0) propWarnings.set(`${idx}:${j}`, msgs);
      });
    });

    const total = Array.from(typeWarnings.values()).reduce((sum, arr) => sum + arr.length, 0)
      + Array.from(propWarnings.values()).reduce((sum, arr) => sum + arr.length, 0);
    return { typeWarnings, propWarnings, total };
  }, [typeMappings, existingSchema]);

  const ingestPack = (json, statusMsg = 'Ready') => {
    const errs = validateTemplatePack(json);
    setErrors(errs);
    setPack(json);
    const deps = summarizeDependencies(json, api);
    setDepSummary(deps);
    const existingTags = loadTags();
    const plan = computeTagPlan(json.tags || [], existingTags);
    setTagPlan(plan);
    const graphId = api.graphId || 'default';
    const currentSchema = loadSchema(graphId);
    setExistingSchema(currentSchema);
    const existingTypeNames = new Set((currentSchema.types || []).map(t => String(t.name || '').toLowerCase()));
    const tm = (json.schema?.types || []).map((t) => {
      const incoming = String(t.name || '');
      const incomingKey = incoming.toLowerCase();
      const target = existingTypeNames.has(incomingKey) ? (currentSchema.types.find(x => String(x.name || '').toLowerCase() === incomingKey)?.name || incoming) : incoming;
      const properties = (t.properties || []).map((p) => ({ incoming: p.name, target: p.name, skip: false }));
      return { incoming, target, skip: false, properties };
    });
    setTypeMappings(tm);
    setImportSchemaOption(false);
    setIncludeEdgeTypes(true);
    setStatus(statusMsg);
  };

  const handleFile = async (file) => {
    const text = await file.text();
    let json;
    try { json = JSON.parse(text); } catch (e) { setErrors([`JSON parse error: ${e.message}`]); return; }
    ingestPack(json, 'Ready');
  };

  const exportPack = () => {
    const currentTags = loadTags();
    const payload = {
      meta: { name: 'Exported Pack', version: '1.0.0', author: 'Vertex', createdAt: new Date().toISOString() },
      requires: { app: `>=${nowVersion()}` },
      tags: currentTags,
      properties: [],
      nodes: api.nodes || [],
      edges: api.edges || [],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'template-pack.json';
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
  };

  const loadSeedPack = async (path, label) => {
    try {
      const res = await fetch(path, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      ingestPack(json, `Loaded seed: ${label}`);
    } catch (e) {
      setErrors([`Failed to load seed pack: ${e.message}`]);
    }
  };

  const enableMissingPlugins = () => {
    if (!Array.isArray(missingPlugins) || missingPlugins.length === 0) return;
    missingPlugins.forEach((pid) => api.setPluginEnabled?.(pid, true));
    setStatus('Enabled missing plugins (if available).');
  };

  const apply = () => {
    if (!pack || (missingPlugins && missingPlugins.length > 0)) return;
    const mapping = { types: typeMappings };
    applyPack({
      pack,
      api,
      tagPlan,
      mapping,
      importSchemaOption,
      includeEdgeTypes,
      existingSchema,
      graphId: api.graphId || 'default'
    });
    setStatus('Applied. You can undo via Edit → Undo.');
  };

  const groupedErrors = React.useMemo(() => {
    const groups = new Map();
    const put = (k, msg) => { if (!groups.has(k)) groups.set(k, []); groups.get(k).push(msg); };
    (errors || []).forEach((msg) => {
      const s = String(msg || '');
      const l = s.toLowerCase();
      if (l.startsWith('meta') || l.includes('meta.')) return put('Meta', s);
      if (l.startsWith('requires') || l.includes('requires.')) return put('Requires', s);
      if (l.startsWith('schema') || l.includes('schema.')) return put('Schema', s);
      if (l.startsWith('tags') || l.includes('tags[') || l.includes(' tags ')) return put('Tags', s);
      if (l.startsWith('properties') || l.includes('properties[')) return put('Properties', s);
      if (l.startsWith('nodes') || l.includes('nodes[')) return put('Nodes', s);
      if (l.startsWith('edges') || l.includes('edges[')) return put('Edges', s);
      return put('General', s);
    });
    return groups;
  }, [errors]);

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3 style={{ margin: 0 }}>Templates</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <label>
          <input type="file" accept="application/json" style={{ display: 'none' }}
            onChange={async (e) => { const f = e.target.files?.[0]; if (f) await handleFile(f); e.target.value=''; }} />
          <span role="button" style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>Import Pack…</span>
        </label>
        <button onClick={exportPack} style={{ padding: '6px 10px' }}>Export Current as Pack</button>
        {(templateConfig?.seeds || []).map((seed) => (
          <button key={seed.path} onClick={() => loadSeedPack(seed.path, seed.label)} style={{ padding: '6px 10px' }}>
            {seed.buttonLabel || `Load Seed: ${seed.label}`}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 13, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10 }}>
        <strong>How to create your own Template Pack:</strong>
        <ol style={{ margin: '6px 0 0 16px', padding: 0 }}>
          <li>Define schema via the Schema panel (types + edge types).</li>
          <li>Add sample nodes/edges/tags on the canvas.</li>
          <li>Return here and click “Export Current as Pack”.</li>
        </ol>
        <div style={{ marginTop: 8 }}>
          <button onClick={openSchemaManager} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #93c5fd', background: '#eff6ff', color: '#1d4ed8', cursor: 'pointer' }}>
            Open Schema Manager ↗
          </button>
        </div>
      </div>
      {errors.length > 0 && (
        <div style={{ color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 8 }}>
          <div style={{ padding: 8, background: '#fee2e2', borderBottom: '1px solid #fecaca', fontWeight: 600 }}>
            Validation errors ({errors.length})
          </div>
          <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from(groupedErrors.entries()).map(([section, msgs]) => (
              <div key={section}>
                <div style={{ fontWeight: 600 }}>{section} ({msgs.length})</div>
                <ul style={{ margin: '6px 0 0 16px' }}>
                  {msgs.map((m, i) => (<li key={`${section}-${i}`} style={{ lineHeight: 1.35 }}>{m}</li>))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
      {pack && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <div style={{ padding: 8, background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
            <strong>{pack.meta?.name || 'Unnamed Pack'}</strong>
            <span style={{ marginLeft: 8, opacity: 0.7 }}>v{pack.meta?.version || '1.0.0'}</span>
          </div>
          <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {depSummary && (
              <div style={{ fontSize: 12 }}>
                <div><strong>Requires</strong></div>
                {!depSummary.appOk && <div>App version mismatch</div>}
                {depSummary.capabilities?.length > 0 && (
                  <div>Capabilities: {depSummary.capabilities.join(', ')}</div>
                )}
                {missingPlugins.length > 0 && (
                  <div style={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>Missing plugins: {missingPlugins.join(', ')}</span>
                    <button onClick={enableMissingPlugins} style={{ padding: '2px 8px', fontSize: 12 }}>Enable</button>
                  </div>
                )}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 600 }}>Tags</div>
              {tagPlan.length === 0 && <div style={{ fontSize: 12, opacity: 0.7 }}>No new tags</div>}
              {tagPlan.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span>{step.incoming.name}</span>
                  <span style={{ opacity: 0.7 }}>({step.action === 'merge' ? 'merge with existing' : 'add as new'})</span>
                </div>
              ))}
            </div>
            {(pack.schema?.types?.length || 0) > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>Schema (optional)</span>
                  {mappingWarnings.total > 0 && (
                    <span style={{ fontSize: 12, color: '#b45309' }}>⚠ {mappingWarnings.total} mapping warning(s)</span>
                  )}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <input type="checkbox" checked={!!importSchemaOption} onChange={(e) => setImportSchemaOption(e.target.checked)} />
                  Import schema into Schema Manager
                </label>
                {(pack.schema?.edgeTypes?.length || 0) > 0 && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <input type="checkbox" checked={!!includeEdgeTypes} onChange={(e) => setIncludeEdgeTypes(e.target.checked)} />
                    Include edge types
                  </label>
                )}
                <div style={{ marginTop: 6, border: '1px solid #e5e7eb', borderRadius: 6 }}>
                  <div style={{ padding: 6, background: '#f8fafc', borderBottom: '1px solid #e5e7eb', fontSize: 12, opacity: 0.9 }}>
                    Type and property mapping (rename/skip). Renames apply to imported nodes and, if enabled, to the saved schema.
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8 }}>
                    {typeMappings.length === 0 && <div style={{ fontSize: 12, opacity: 0.7 }}>No types in pack</div>}
                    {typeMappings.map((tm, idx) => (
                      <div key={`type-${idx}`} style={{ border: '1px solid #e5e7eb', borderRadius: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, background: '#f9fafb' }}>
                          <span style={{ fontWeight: 600 }}>Type:</span>
                          <span style={{ opacity: 0.8 }}>{tm.incoming}</span>
                          <span style={{ opacity: 0.6 }}>→</span>
                          <input
                            value={tm.target}
                            onChange={(e) => setTypeMappings((cur) => { const next=[...cur]; next[idx]={ ...tm, target: e.target.value }; return next; })}
                            placeholder={tm.incoming}
                            style={{ flex: 1, minWidth: 120 }}
                            disabled={tm.skip}
                          />
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input type="checkbox" checked={!!tm.skip} onChange={(e) => setTypeMappings((cur) => { const next=[...cur]; next[idx]={ ...tm, skip: e.target.checked }; return next; })} />
                            Skip
                          </label>
                          {(mappingWarnings.typeWarnings.get(idx) || []).map((msg, k) => (
                            <span key={`tw-${idx}-${k}`} style={{ fontSize: 12, color: '#b45309' }}>⚠ {msg}</span>
                          ))}
                        </div>
                        {(tm.properties || []).length > 0 && (
                          <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {(tm.properties || []).map((pm, j) => (
                              <div key={`prop-${idx}-${j}`} style={{ display: 'grid', gridTemplateColumns: '1fr 20px 1fr 80px auto', gap: 8, alignItems: 'center' }}>
                                <div style={{ opacity: 0.8 }}>{pm.incoming}</div>
                                <div style={{ textAlign: 'center', opacity: 0.6 }}>→</div>
                                <input
                                  value={pm.target}
                                  onChange={(e) => setTypeMappings((cur) => { const next=[...cur]; const t={...next[idx]}; const props=[...t.properties]; props[j] = { ...pm, target: e.target.value }; t.properties = props; next[idx] = t; return next; })}
                                  placeholder={pm.incoming}
                                  disabled={tm.skip || pm.skip}
                                />
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <input type="checkbox" checked={!!pm.skip} onChange={(e) => setTypeMappings((cur) => { const next=[...cur]; const t={...next[idx]}; const props=[...t.properties]; props[j] = { ...pm, skip: e.target.checked }; t.properties = props; next[idx] = t; return next; })} />
                                  Skip
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  {(mappingWarnings.propWarnings.get(`${idx}:${j}`) || []).map((m, x) => (
                                    <span key={`pw-${idx}-${j}-${x}`} style={{ fontSize: 12, color: '#b45309' }}>⚠ {m}</span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={apply} style={{ padding: '6px 10px' }} disabled={errors.length > 0 || missingPlugins.length > 0}>Apply</button>
              {missingPlugins.length > 0 && (
                <span style={{ fontSize: 12, color: '#b45309' }}>Enable required plugins first.</span>
              )}
              {status && <span style={{ fontSize: 12, opacity: 0.8 }}>{status}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const templatesPlugin = {
  id: 'core.templates',
  name: 'Templates',
  nameMessageId: 'plugin.templates.name',
  version: '0.1.0',
  author: 'Vertex Lab Core',
  slots: {
    sidePanels: [
      {
        id: 'templatesPanel',
        title: 'Templates',
        allowCollapse: true,
        visible: () => getPanelVisible(),
        render: (api) => <TemplatesPanel api={api} />,
      },
    ],
    commands: [
      {
        id: 'core.templates.open',
        title: 'Open Templates',
        when: 'canvas',
        run: () => setPanelVisible(true),
      },
      {
        id: 'core.templates.close',
        title: 'Hide Templates',
        when: 'canvas',
        run: () => setPanelVisible(false),
      },
    ],
    aboutPage: {
      markdown: `
# Templates

Import/export Template Packs that bundle tag sets, properties, optional schema fragments, and starter subgraphs. Imports run through validation and a pre‑flight summary before applying with a single undo boundary.

Notes
- JSON only; no executable code.
- Dependencies are summarized (plugins/capabilities); enabling missing plugins is suggested but not automatic.
- Tag conflicts are merged by name (case‑insensitive) by default.
 - Schema import: When packs include schema, you can map types/properties (rename/skip). Optionally import the schema into the Schema Manager and include edge types.
      `.trim(),
    }
  }
};

export default templatesPlugin;
