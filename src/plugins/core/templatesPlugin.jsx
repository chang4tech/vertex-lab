import React from 'react';
import { loadTags, saveTags, generateTagId } from '../../utils/tagUtils.js';
import { validateTemplatePack } from '../../utils/templatePackValidation.js';

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

function applyPack({ pack, api, tagPlan }) {
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

  // Apply nodes/edges (optional)
  const nodes = Array.isArray(api.nodes) ? api.nodes : [];
  const edges = Array.isArray(api.edges) ? api.edges : [];
  const nextNodes = [...nodes];
  const idMap = new Map();
  let maxId = nodes.reduce((m, n) => Math.max(m, Number(n.id) || 0), 0);
  (pack.nodes || []).forEach(n => {
    const newId = ++maxId;
    idMap.set(n.id, newId);
    nextNodes.push({
      id: newId,
      label: n.label || `Node ${newId}`,
      x: typeof n.x === 'number' ? n.x : 400 + (Math.random() * 120 - 60),
      y: typeof n.y === 'number' ? n.y : 300 + (Math.random() * 120 - 60),
      level: n.level ?? 0,
      tags: Array.isArray(n.tags) ? n.tags : [],
      ...n.props,
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
      if (s != null && t != null) newEdges.push({ source: s, target: t, directed: !!e.directed });
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

  const handleFile = async (file) => {
    const text = await file.text();
    let json;
    try { json = JSON.parse(text); } catch (e) { setErrors([`JSON parse error: ${e.message}`]); return; }
    const errs = validateTemplatePack(json);
    setErrors(errs);
    setPack(json);
    const deps = summarizeDependencies(json, api);
    setDepSummary(deps);
    const existingTags = loadTags();
    const plan = computeTagPlan(json.tags || [], existingTags);
    setTagPlan(plan);
    setStatus('Ready');
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

  const loadSeed = async () => {
    try {
      const res = await fetch('/packs/paper_research_kit.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const errs = validateTemplatePack(json);
      setErrors(errs);
      setPack(json);
      const deps = summarizeDependencies(json, api);
      setDepSummary(deps);
      const existingTags = loadTags();
      const plan = computeTagPlan(json.tags || [], existingTags);
      setTagPlan(plan);
      setStatus('Loaded seed pack');
    } catch (e) {
      setErrors([`Failed to load seed pack: ${e.message}`]);
    }
  };

  const apply = () => {
    if (!pack) return;
    applyPack({ pack, api, tagPlan });
    setStatus('Applied. You can undo via Edit → Undo.');
  };

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3 style={{ margin: 0 }}>Templates</h3>
      <div style={{ display: 'flex', gap: 8 }}>
        <label>
          <input type="file" accept="application/json" style={{ display: 'none' }}
            onChange={async (e) => { const f = e.target.files?.[0]; if (f) await handleFile(f); e.target.value=''; }} />
          <span role="button" style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>Import Pack…</span>
        </label>
        <button onClick={exportPack} style={{ padding: '6px 10px' }}>Export Current as Pack</button>
        <button onClick={loadSeed} style={{ padding: '6px 10px' }}>Load Seed: Paper Research Kit</button>
      </div>
      {errors.length > 0 && (
        <div style={{ color: '#b91c1c' }}>
          <strong>Validation errors:</strong>
          <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
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
                {depSummary.missingPlugins?.length > 0 && (
                  <div style={{ color: '#b45309' }}>Missing plugins: {depSummary.missingPlugins.join(', ')}</div>
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
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={apply} style={{ padding: '6px 10px' }} disabled={errors.length > 0}>Apply</button>
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
      `.trim(),
    }
  }
};

export default templatesPlugin;
