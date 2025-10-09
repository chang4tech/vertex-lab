import React from 'react';
import { corePlugins } from '../plugins';
import { mergePlugins } from '../plugins/registry.js';
import { getPluginLogsById, subscribePluginErrors, clearPluginLogsById } from '../plugins/errorLog.js';
import { loadCustomPluginsFromStorage } from '../utils/customPluginLoader';
import { loadPluginPrefs, savePluginPrefs } from '../utils/pluginUtils';
import { FormattedMessage } from 'react-intl';
import Markdown from './common/Markdown.jsx';
import { useTheme } from '../contexts/ThemeContext';

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

export default function PluginPage({ pluginId }) {
  const plugins = usePlugins();
  const plugin = plugins.find(p => p.id === pluginId);
  const [logs, setLogs] = React.useState(() => getPluginLogsById(pluginId));
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const subtleTextStyle = { color: colors.secondaryText };
  const buttonStyle = {
    border: `1px solid ${colors.inputBorder}`,
    background: colors.inputBackground,
    color: colors.primaryText,
    borderRadius: 6,
    padding: '6px 12px',
    cursor: 'pointer'
  };
  const consoleWrapperStyle = {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    background: colors.canvasBackground,
    color: colors.primaryText,
    padding: 12,
    borderRadius: 6,
    border: `1px solid ${colors.panelBorder}`,
    maxHeight: 360,
    overflow: 'auto'
  };

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
  const aboutSlot = plugin.slots?.aboutPage;
  const hasAbout = !!(aboutSlot && (typeof aboutSlot.render === 'function' || typeof aboutSlot.markdown === 'string'));
  const ConfigView = () => {
    if (!hasConfig) {
      return <div style={subtleTextStyle}>This plugin does not provide a config page.</div>;
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
        <button style={buttonStyle} onClick={() => {
          const text = logs.map(e => `[${new Date(e.time).toISOString()}] (${e.level}) ${e.message}`).join('\n');
          navigator.clipboard?.writeText(text).catch(() => {});
        }}><FormattedMessage id="plugin.hub.copy" defaultMessage="Copy" /></button>
        <button style={buttonStyle} onClick={() => { clearPluginLogsById(pluginId); setLogs([]); }}><FormattedMessage id="plugin.hub.clear" defaultMessage="Clear" /></button>
      </div>
      {logs.length === 0 ? (
        <div style={subtleTextStyle}>No logs yet.</div>
      ) : (
        <div style={consoleWrapperStyle}>
          {logs.slice(-200).map((e, i) => (
            <div
              key={i}
              style={{
                color: e.level === 'error'
                  ? colors.error
                  : e.level === 'warn'
                    ? colors.warning
                    : colors.primaryText
              }}
            >
              [{new Date(e.time).toLocaleTimeString()}] ({e.level}) {e.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto', color: colors.primaryText }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>
            {plugin.name || plugin.id} — <FormattedMessage id="plugin.hub.title" defaultMessage="Control Hub" />
          </h2>
          {plugin.description && <div style={subtleTextStyle}>{plugin.description}</div>}
        </div>
        <nav style={{ display: 'flex', gap: 8 }}>
          <button style={buttonStyle} onClick={() => {
            try {
              const ret = sessionStorage.getItem('vertex_plugin_return');
              if (ret) {
                sessionStorage.removeItem('vertex_plugin_return');
                window.location.hash = ret;
                return;
              }
            } catch {}
            if (window.history.length > 1) {
              try { window.history.back(); return; } catch {}
            }
            window.location.hash = '#/'
          }}><FormattedMessage id="plugin.hub.back" defaultMessage="Back" /></button>
        </nav>
      </header>

      <main style={{ marginTop: 16 }}>
        {hasAbout && (
          <section style={{ marginBottom: 16 }}>
            <h3 style={{ margin: '8px 0' }}><FormattedMessage id="plugin.hub.about" defaultMessage="How to Use" /></h3>
            {typeof aboutSlot.markdown === 'string' ? (
              <Markdown text={aboutSlot.markdown} />
            ) : (
              aboutSlot.render({})
            )}
          </section>
        )}
        <section style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '8px 0' }}><FormattedMessage id="plugin.hub.settings" defaultMessage="Settings" /></h3>
          <ConfigView />
        </section>

        <section>
          <h3 style={{ margin: '8px 0' }}><FormattedMessage id="plugin.hub.console" defaultMessage="Console" /></h3>
          <ConsoleView />
        </section>
      </main>
    </div>
  );
}
