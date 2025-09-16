import React from 'react';
import { corePlugins } from '../plugins';
import { mergePlugins } from '../plugins/registry.js';
import { getPluginLogsById, subscribePluginErrors, clearPluginLogsById } from '../plugins/errorLog.js';
import { loadCustomPluginsFromStorage } from '../utils/customPluginLoader';
import { loadPluginPrefs, savePluginPrefs } from '../utils/pluginUtils';

function usePlugins() {
  const [plugins, setPlugins] = React.useState(corePlugins);
  React.useEffect(() => {
    (async () => {
      const custom = await loadCustomPluginsFromStorage();
      setPlugins(mergePlugins(corePlugins, custom));
    })();
  }, []);
  return plugins;
}

export default function PluginPage({ pluginId, tab = 'config' }) {
  const plugins = usePlugins();
  const plugin = plugins.find(p => p.id === pluginId);
  const [logs, setLogs] = React.useState(() => getPluginLogsById(pluginId));
  const [activeTab, setActiveTab] = React.useState(tab);

  React.useEffect(() => {
    return subscribePluginErrors(() => setLogs(getPluginLogsById(pluginId)));
  }, [pluginId]);

  if (!plugin) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Plugin Not Found</h2>
        <p>Could not locate plugin with id: <code>{pluginId}</code></p>
      </div>
    );
  }

  const configSlot = plugin.slots?.configPage;
  const hasConfig = configSlot && typeof configSlot.render === 'function';
  const ConfigView = () => {
    if (!hasConfig) {
      return <div style={{ color: '#6b7280' }}>This plugin does not provide a config page.</div>;
    }
    const defaults = loadPluginPrefs([plugin]);
    const api = {
      pluginPrefs: defaults,
      setPluginEnabled: (id, enabled) => {
        const next = { ...defaults, [id]: enabled };
        savePluginPrefs(next);
      },
    };
    return configSlot.render(api);
  };

  const ConsoleView = () => (
    <div>
      <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
        <button onClick={() => {
          const text = logs.map(e => `[${new Date(e.time).toISOString()}] (${e.level}) ${e.message}`).join('\n');
          navigator.clipboard?.writeText(text).catch(() => {});
        }}>Copy</button>
        <button onClick={() => { clearPluginLogsById(pluginId); setLogs([]); }}>Clear</button>
      </div>
      {logs.length === 0 ? (
        <div style={{ color: '#6b7280' }}>No logs yet.</div>
      ) : (
        <div style={{ fontFamily: 'monospace', background: '#0b1021', color: '#e5e7eb', padding: 12, borderRadius: 6 }}>
          {logs.slice(-200).map((e, i) => (
            <div key={i} style={{ color: e.level === 'error' ? '#fca5a5' : e.level === 'warn' ? '#fde68a' : '#e5e7eb' }}>
              [{new Date(e.time).toLocaleTimeString()}] ({e.level}) {e.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>{plugin.name || plugin.id}</h2>
          {plugin.description && <div style={{ color: '#6b7280' }}>{plugin.description}</div>}
        </div>
        <nav style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setActiveTab('config')} disabled={activeTab==='config'}>Config</button>
          <button onClick={() => setActiveTab('console')} disabled={activeTab==='console'}>Console</button>
          <button onClick={() => { window.location.hash = '#/'; }}>Back</button>
        </nav>
      </header>

      <main style={{ marginTop: 16 }}>
        {activeTab === 'console' ? <ConsoleView /> : <ConfigView />}
      </main>
    </div>
  );
}

