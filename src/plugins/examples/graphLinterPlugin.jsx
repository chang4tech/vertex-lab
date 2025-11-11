import React from 'react';

const STORAGE_KEY = 'plugin_examples.graphLinter.settings';
const PANEL_VIS_KEY = 'plugin_examples.graphLinter.showPanel';

const defaultSettings = {
  maxLabelLength: 48,
  severity: {
    duplicates: 'warn',
    orphans: 'warn',
    cycles: 'error',
    longLabel: 'info',
  },
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {}
  return { ...defaultSettings };
}

function saveSettings(next) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
}

function isPanelVisible() {
  try { return localStorage.getItem(PANEL_VIS_KEY) === '1'; } catch { return false; }
}
function setPanelVisible(v) {
  try { localStorage.setItem(PANEL_VIS_KEY, v ? '1' : '0'); } catch {}
}

function buildAdjacency(nodes = [], edges = []) {
  const idSet = new Set(nodes.map(n => n.id));
  const adj = new Map();
  nodes.forEach(n => adj.set(n.id, []));
  (edges || []).forEach(e => {
    const s = e.source; const t = e.target;
    if (!idSet.has(s) || !idSet.has(t)) return;
    const directed = !!e.directed;
    if (directed) {
      adj.get(s).push(t);
    } else {
      adj.get(s).push(t);
      adj.get(t).push(s);
    }
  });
  return adj;
}

function detectDuplicates(nodes = [], settings) {
  const byLabel = new Map();
  nodes.forEach(n => {
    const key = String(n.label || '').trim().toLowerCase();
    if (!byLabel.has(key)) byLabel.set(key, []);
    byLabel.get(key).push(n);
  });
  const issues = [];
  byLabel.forEach((arr, key) => {
    if (!key) return; // skip empty label dup warning
    if (arr.length > 1) {
      arr.slice(1).forEach((n, idx) => {
        if (Array.isArray(n.lintSuppressions) && n.lintSuppressions.includes('duplicates')) return;
        issues.push({
          id: `dup:${n.id}`,
          rule: 'duplicates',
          severity: settings.severity.duplicates,
          nodeId: n.id,
          message: `Duplicate label: "${arr[0].label}"`,
        });
      });
    }
  });
  return issues;
}

function detectOrphans(nodes = [], edges = [], settings) {
  const adj = buildAdjacency(nodes, edges);
  const issues = [];
  nodes.forEach(n => {
    const suppressed = Array.isArray(n.lintSuppressions) && n.lintSuppressions.includes('orphans');
    if (suppressed) return;
    const deg = (adj.get(n.id) || []).length;
    if (deg === 0) {
      issues.push({ id: `orph:${n.id}`, rule: 'orphans', severity: settings.severity.orphans, nodeId: n.id, message: 'Orphan node (no connections)' });
    }
  });
  return issues;
}

function detectDirectedCycles(nodes = [], edges = [], settings) {
  const directedEdges = (edges || []).filter(e => !!e.directed);
  if (directedEdges.length === 0) return [];
  const adj = new Map();
  nodes.forEach(n => adj.set(n.id, []));
  directedEdges.forEach(e => { if (adj.has(e.source)) adj.get(e.source).push(e.target); });
  const issues = [];
  const temp = new Set();
  const perm = new Set();
  const onStack = [];
  function dfs(u) {
    temp.add(u);
    onStack.push(u);
    for (const v of adj.get(u) || []) {
      if (!temp.has(v) && !perm.has(v)) dfs(v);
      else if (temp.has(v)) {
        const cycle = [...onStack.slice(onStack.indexOf(v)), v];
        cycle.forEach(id => {
          const node = nodes.find(n => n.id === id);
          if (!node) return;
          const suppressed = Array.isArray(node.lintSuppressions) && node.lintSuppressions.includes('cycles');
          if (!suppressed) {
            issues.push({ id: `cycle:${id}:${Math.random().toString(36).slice(2)}`, rule: 'cycles', severity: settings.severity.cycles, nodeId: id, message: 'Directed cycle detected' });
          }
        });
      }
    }
    onStack.pop();
    temp.delete(u);
    perm.add(u);
  }
  nodes.forEach(n => { if (!perm.has(n.id)) dfs(n.id); });
  return issues;
}

function detectLongLabels(nodes = [], settings) {
  const maxLen = settings.maxLabelLength || defaultSettings.maxLabelLength;
  const issues = [];
  nodes.forEach(n => {
    const suppressed = Array.isArray(n.lintSuppressions) && n.lintSuppressions.includes('longLabel');
    if (suppressed) return;
    const label = String(n.label || '');
    if (label.length > maxLen) {
      issues.push({ id: `long:${n.id}`, rule: 'longLabel', severity: settings.severity.longLabel, nodeId: n.id, message: `Label too long (${label.length} > ${maxLen})` });
    }
  });
  return issues;
}

function groupByRule(issues) {
  const map = new Map();
  issues.forEach(i => { if (!map.has(i.rule)) map.set(i.rule, []); map.get(i.rule).push(i); });
  return map;
}

function HeaderActions({ api, issues, settings }) {
  const allNodeIds = Array.from(new Set(issues.map(i => i.nodeId).filter(Boolean)));
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button onClick={() => api.selectNodes?.(allNodeIds)} title="Select all offending nodes">Select All</button>
      <button onClick={() => api.onHighlightNodes?.(allNodeIds)} title="Highlight all offending nodes">Highlight All</button>
      <button onClick={() => setPanelVisible(false)} title="Hide panel">Hide</button>
    </div>
  );
}

function RuleSection({ api, rule, issues, settings }) {
  const color = rule === 'cycles' ? '#dc2626' : rule === 'duplicates' ? '#f59e0b' : rule === 'orphans' ? '#f59e0b' : '#2563eb';
  const titleMap = { duplicates: 'Duplicates', orphans: 'Orphans', cycles: 'Directed Cycles', longLabel: 'Long Labels' };

  const fixAll = () => {
    if (rule === 'duplicates') {
      const byLabel = new Map();
      (api.nodes || []).forEach(n => {
        const key = String(n.label || '').trim().toLowerCase();
        if (!byLabel.has(key)) byLabel.set(key, []);
        byLabel.get(key).push(n);
      });
      api.updateNodes?.((draft) => {
        const counts = new Map();
        draft.forEach(n => {
          const key = String(n.label || '').trim().toLowerCase();
          const i = (counts.get(key) || 0) + 1; counts.set(key, i);
          if (i > 1) {
            n.label = `${n.label} (${i})`;
          }
        });
        return draft;
      });
    } else if (rule === 'orphans') {
      const ids = Array.from(new Set(issues.map(i => i.nodeId).filter(Boolean)));
      if (ids.length > 0) api.onDeleteNodes?.(ids);
    } else if (rule === 'longLabel') {
      const maxLen = settings.maxLabelLength || defaultSettings.maxLabelLength;
      api.updateNodes?.((draft) => {
        draft.forEach(n => {
          if (String(n.label || '').length > maxLen) {
            const s = String(n.label || '');
            n.label = s.slice(0, Math.max(0, maxLen - 1)) + '…';
          }
        });
        return draft;
      });
    } else if (rule === 'cycles') {
      // Tag nodes participating in cycles (non-destructive)
      api.updateNodes?.((draft) => {
        const ids = new Set(issues.map(i => i.nodeId));
        draft.forEach(n => {
          if (ids.has(n.id)) {
            const tags = Array.isArray(n.tags) ? n.tags : [];
            if (!tags.includes('cycle')) tags.push('cycle');
            n.tags = tags;
          }
        });
        return draft;
      });
    }
  };

  const suppress = (nodeId) => {
    api.updateNodes?.((draft) => {
      draft.forEach(n => {
        if (n.id === nodeId) {
          const arr = Array.isArray(n.lintSuppressions) ? n.lintSuppressions : [];
          if (!arr.includes(rule)) arr.push(rule);
          n.lintSuppressions = arr;
        }
      });
      return draft;
    });
  };

  return (
    <div style={{ border: `1px solid ${color}55`, borderRadius: 8, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: `${color}11`, color }}>
        <strong>{titleMap[rule] || rule}</strong>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 12, opacity: 0.8 }}>{issues.length} issue(s)</span>
          <button onClick={fixAll}>Fix All</button>
        </div>
      </div>
      <div style={{ padding: 8 }}>
        {issues.map((iss) => (
          <div key={iss.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px' }}>
            <div>
              <div style={{ fontSize: 13 }}>{iss.message}</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Severity: {iss.severity} • Node #{iss.nodeId}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => api.selectNodes?.([iss.nodeId])}>Select</button>
              <button onClick={() => api.onHighlightNodes?.([iss.nodeId])}>Highlight</button>
              <button onClick={() => suppress(iss.nodeId)}>Suppress</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LinterPanel({ api }) {
  const [settings, setSettings] = React.useState(() => loadSettings());
  const nodes = api.nodes || [];
  const edges = api.edges || [];
  const issues = React.useMemo(() => {
    const arr = [];
    arr.push(...detectDuplicates(nodes, settings));
    arr.push(...detectOrphans(nodes, edges, settings));
    arr.push(...detectDirectedCycles(nodes, edges, settings));
    arr.push(...detectLongLabels(nodes, settings));
    return arr;
  }, [nodes, edges, settings]);

  const groups = React.useMemo(() => groupByRule(issues), [issues]);

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>Graph Linter</h3>
        <HeaderActions api={api} issues={issues} settings={settings} />
      </div>
      <div style={{ fontSize: 12, opacity: 0.8 }}>{issues.length} total issue(s)</div>
      {[...groups.entries()].map(([rule, groupIssues]) => (
        <RuleSection key={rule} api={api} rule={rule} issues={groupIssues} settings={settings} />
      ))}
      {issues.length === 0 && (
        <div style={{ padding: 12, color: '#16a34a' }}>No issues found.</div>
      )}
    </div>
  );
}

export const graphLinterPlugin = {
  id: 'examples.graphLinter',
  name: 'Graph Linter',
  version: '1.0.0',
  author: 'Vertex Lab Examples',
  slots: {
    sidePanels: [
      {
        id: 'graphLinterPanel',
        title: 'Graph Linter',
        allowCollapse: true,
        visible: () => isPanelVisible(),
        render: (api) => <LinterPanel api={api} />,
      },
    ],
    commands: [
      {
        id: 'examples.graphLinter.open',
        title: 'Open Graph Linter',
        when: 'canvas',
        run: () => setPanelVisible(true),
      },
      {
        id: 'examples.graphLinter.close',
        title: 'Hide Graph Linter',
        when: 'canvas',
        run: () => setPanelVisible(false),
      },
    ],
    configPage: {
      render: () => {
        const [settings, setSettings] = React.useState(() => loadSettings());
        const set = (partial) => setSettings((cur) => { const next = { ...cur, ...partial }; saveSettings(next); return next; });
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Max label length</span>
              <input type="number" min={8} max={200} value={settings.maxLabelLength}
                onChange={(e) => set({ maxLabelLength: Math.max(8, Math.min(200, parseInt(e.target.value || '0', 10))) })}
                style={{ width: 120 }} />
            </label>
            <div style={{ fontWeight: 600, marginTop: 8 }}>Severity</div>
            {['duplicates','orphans','cycles','longLabel'].map(rule => (
              <label key={rule} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 100, textTransform: 'capitalize' }}>{rule}</span>
                <select value={settings.severity[rule]}
                  onChange={(e) => set({ severity: { ...settings.severity, [rule]: e.target.value } })}>
                  <option value="info">info</option>
                  <option value="warn">warn</option>
                  <option value="error">error</option>
                </select>
              </label>
            ))}
          </div>
        );
      }
    },
    aboutPage: {
      markdown: `
# Graph Linter

Find common graph hygiene issues and fix them quickly.

Rules
- Duplicates: Flags nodes with duplicate labels. Fix All appends (2), (3), ...
- Orphans: Flags nodes with no connections. Fix All deletes orphans.
- Directed Cycles: Highlights nodes in directed cycles. Fix All tags nodes with 'cycle'.
- Long Labels: Flags labels longer than the configured threshold. Fix All truncates with an ellipsis.

Suppression
- In the panel, use "Suppress" on a node to ignore a specific rule for that node.

Commands
- Open/Hide Graph Linter via the Commands slot; also accessible via the Plugins Manager Control Hub.
      `.trim(),
    },
  },
};

export default graphLinterPlugin;

