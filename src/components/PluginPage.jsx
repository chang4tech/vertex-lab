import React from 'react';
import { corePlugins, bundledCustomPlugins } from '../plugins';
import { mergePlugins } from '../plugins/registry.js';
import { getPluginLogsById, subscribePluginErrors, clearPluginLogsById } from '../plugins/errorLog.js';
import { loadCustomPluginsFromStorage } from '../utils/customPluginLoader';
import { loadPluginPrefs, savePluginPrefs } from '../utils/pluginUtils';
import { FormattedMessage, useIntl } from 'react-intl';
import Markdown from './common/Markdown.jsx';
import { useTheme } from '../contexts/ThemeContext';

function resolveWindowPlugins() {
  if (typeof window === 'undefined') return null;
  const loaded = window.__vertexAllPlugins;
  return Array.isArray(loaded) ? loaded : null;
}

function usePlugins() {
  const initialPlugins = React.useMemo(() => {
    const fromWindow = resolveWindowPlugins();
    return fromWindow || mergePlugins(corePlugins, bundledCustomPlugins);
  }, []);
  const [plugins, setPlugins] = React.useState(initialPlugins);
  const [isLoading, setIsLoading] = React.useState(!resolveWindowPlugins());

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleUpdate = (event) => {
      const next = event?.detail?.plugins;
      if (Array.isArray(next)) {
        setPlugins(next);
        setIsLoading(false);
        return;
      }
      const fallback = resolveWindowPlugins();
      if (fallback) {
        setPlugins(fallback);
        setIsLoading(false);
      }
    };
    window.addEventListener('vertex:plugins-updated', handleUpdate);
    return () => {
      window.removeEventListener('vertex:plugins-updated', handleUpdate);
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const custom = await loadCustomPluginsFromStorage();
      if (cancelled) return;
      const fromWindow = resolveWindowPlugins();
      const arrays = fromWindow
        ? [fromWindow, corePlugins, bundledCustomPlugins, custom]
        : [corePlugins, bundledCustomPlugins, custom];
      const merged = mergePlugins(...arrays);
      setPlugins(prev => mergePlugins(prev, merged));
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return [plugins, isLoading];
}

export default function PluginPage({ pluginId }) {
  const [plugins, pluginsLoading] = usePlugins();
  const plugin = plugins.find(p => p.id === pluginId);
  const [logs, setLogs] = React.useState(() => getPluginLogsById(pluginId));
  const { currentTheme } = useTheme();
  const intl = useIntl();
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
    if (pluginsLoading) {
      return (
        <div style={{ padding: 24 }}>
          <h2><FormattedMessage id="plugin.hub.title" defaultMessage="Control Hub" /></h2>
          <p><FormattedMessage id="plugin.hub.loading" defaultMessage="Loading plugin…" /></p>
        </div>
      );
    }
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

  const pluginDisplayName = plugin.nameMessageId
    ? intl.formatMessage({ id: plugin.nameMessageId, defaultMessage: plugin.name || plugin.id })
    : (plugin.name || plugin.id);

  const pluginDescription = plugin.descriptionId
    ? intl.formatMessage({ id: plugin.descriptionId, defaultMessage: plugin.description })
    : plugin.description;

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto', color: colors.primaryText }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>
            {pluginDisplayName} — <FormattedMessage id="plugin.hub.title" defaultMessage="Control Hub" />
          </h2>
          {pluginDescription && <div style={subtleTextStyle}>{pluginDescription}</div>}
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
