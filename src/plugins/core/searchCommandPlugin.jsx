import React from 'react';
import { FormattedMessage } from 'react-intl';
import Search from '../../components/Search.jsx';

const SETTINGS_KEY = 'plugin_core.search.settings';

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { includeTags: false, debounceMs: 0 };
}

function saveSettings(next) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch {}
}

const makeTagsProvider = () => ({
  id: 'core.search.tags',
  search: (query, nodes) => {
    if (!query || !query.trim()) return [];
    const ql = query.toLowerCase();
    const results = [];
    for (const n of nodes || []) {
      const tags = Array.isArray(n.tags) ? n.tags : [];
      const has = tags.some((t) => String(t).toLowerCase().includes(ql));
      if (has) {
        results.push({ node: n, score: 0.75, exact: false, matchedIndices: [] });
      }
    }
    return results;
  },
});

export const searchCommandPlugin = {
  id: 'core.search',
  name: 'Search',
  nameMessageId: 'plugin.search.name',
  version: '1.1.0',
  author: 'Vertex Lab Core',
  conflicts: [],
  slots: {
    commands: [
      {
        id: 'core.search.open',
        title: 'Open Search',
        when: 'canvas',
        run: (api) => {
          if (typeof api?.openSearch === 'function') api.openSearch();
        },
      },
    ],
    canvasOverlays: [
      {
        id: 'searchOverlay',
        slot: 'top-left',
        visible: (api) => !!api.isSearchOpen,
        render: (api) => {
          const settings = loadSettings();
          const providers = Array.isArray(api.searchProviders) ? [...api.searchProviders] : [];
          if (settings.includeTags) providers.push(makeTagsProvider());
          return (
            <Search
              nodes={api.nodes || []}
              visible={!!api.isSearchOpen}
              providers={providers}
              debounceMs={settings.debounceMs || 0}
              selectedNodeId={(api.selectedNodeIds || [])[0] ?? null}
              onSelectNode={(id) => { api.selectNode?.(id); api.closeSearch?.(); api.resetView?.(); }}
              onHighlightNodes={(ids) => api.onHighlightNodes?.(ids || [])}
              onClose={() => api.closeSearch?.()}
            />
          );
        },
      },
    ],
    configPage: {
      render: () => {
        const [settings, setSettings] = React.useState(() => loadSettings());
        const set = (partial) => {
          setSettings((cur) => {
            const next = { ...cur, ...partial };
            saveSettings(next);
            return next;
          });
        };
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={!!settings.includeTags}
                onChange={(e) => set({ includeTags: e.target.checked })}
              />
              <FormattedMessage id="plugin.search.includeTags" defaultMessage="Include tags in search" />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span><FormattedMessage id="plugin.search.debounce" defaultMessage="Debounce (ms)" /></span>
              <input
                type="number"
                min={0}
                step={50}
                value={settings.debounceMs || 0}
                onChange={(e) => set({ debounceMs: Math.max(0, parseInt(e.target.value || '0', 10)) })}
                style={{ width: 120 }}
              />
            </label>
          </div>
        );
      },
    },
  },
};

export default searchCommandPlugin;
