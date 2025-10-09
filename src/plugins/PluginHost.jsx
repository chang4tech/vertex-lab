import React, { useEffect, useMemo, useRef } from 'react';
import PluginErrorBoundary from './PluginErrorBoundary.jsx';
import { appendPluginLog } from './errorLog.js';

function PanelRenderer({ render, appApi }) {
  // Call provided render so errors bubble to the boundary above
  return render(appApi);
}

const descriptorsEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const da = a[i];
    const db = b[i];
    if (!da || !db) return false;
    if (da.key !== db.key) return false;
    if (da.pluginId !== db.pluginId) return false;
    if (da.overlayId !== db.overlayId) return false;
    if (da.slot !== db.slot) return false;
    if ((da.order ?? 0) !== (db.order ?? 0)) return false;
    if (da.element !== db.element) return false;
  }
  return true;
};

// Simple plugin host that renders plugin-provided side panels
export function PluginHost({ plugins = [], appApi, onOverlaysChange, hideSidePanels = false }) {
  const overlayDescriptors = useMemo(() => {
    if (!plugins || plugins.length === 0) return [];
    return plugins.flatMap((plugin) => {
      const overlays = Array.isArray(plugin?.slots?.canvasOverlays) ? plugin.slots.canvasOverlays : [];
      const withPluginApi = (render) => (hostApi) => {
        const api = {
          ...hostApi,
          plugin: {
            id: plugin.id,
            log: (message, level = 'info') => appendPluginLog({ pluginId: plugin.id, level, message: String(message) }),
            openHub: () => {
              try { sessionStorage.setItem('vertex_plugin_return', window.location.hash || '#/'); } catch {}
              try { window.location.hash = `#/plugin/${encodeURIComponent(plugin.id)}`; } catch {}
            },
            // Back-compat shims
            openConfig: () => { try { window.location.hash = `#/plugin/${encodeURIComponent(plugin.id)}`; } catch {} },
            openConsole: () => { try { window.location.hash = `#/plugin/${encodeURIComponent(plugin.id)}`; } catch {} },
          },
        };
        return render(api);
      };

      return overlays
        .filter((overlay) => (typeof overlay.visible === 'function' ? overlay.visible(appApi) : true))
        .map((overlay) => ({
          key: `${plugin.id}:overlay:${overlay.id}`,
          pluginId: plugin.id,
          overlayId: overlay.id,
          slot: overlay.slot,
          order: overlay.order,
          style: overlay.style,
          layoutKey: overlay.layoutKey || `${plugin.id}:${overlay.id}`,
          element: (
            <PluginErrorBoundary key={`${plugin.id}:overlay:${overlay.id}`} pluginId={plugin.id}>
              <PanelRenderer render={withPluginApi(overlay.render)} appApi={appApi} />
            </PluginErrorBoundary>
          ),
        }));
    });
  }, [plugins, appApi]);

  const lastDescriptorsRef = useRef();

  useEffect(() => {
    if (typeof onOverlaysChange === 'function') {
      if (descriptorsEqual(lastDescriptorsRef.current, overlayDescriptors)) return;
      // console.log('PluginHost overlays changed', overlayDescriptors);
      lastDescriptorsRef.current = overlayDescriptors;
      onOverlaysChange(overlayDescriptors);
    }
  }, [overlayDescriptors, onOverlaysChange]);

  if (!plugins || plugins.length === 0) return null;

  const sidePanelEntries = useMemo(() => {
    if (!plugins || plugins.length === 0) return [];
    const entries = [];
    plugins.forEach((plugin) => {
      const panels = Array.isArray(plugin?.slots?.sidePanels) ? plugin.slots.sidePanels : [];
      const withPluginApi = (render) => (hostApi) => {
        const api = {
          ...hostApi,
          plugin: {
            id: plugin.id,
            log: (message, level = 'info') => appendPluginLog({ pluginId: plugin.id, level, message: String(message) }),
            openHub: () => {
              try { sessionStorage.setItem('vertex_plugin_return', window.location.hash || '#/'); } catch {}
              try { window.location.hash = `#/plugin/${encodeURIComponent(plugin.id)}`; } catch {}
            },
            openConfig: () => { try { window.location.hash = `#/plugin/${encodeURIComponent(plugin.id)}`; } catch {} },
            openConsole: () => { try { window.location.hash = `#/plugin/${encodeURIComponent(plugin.id)}`; } catch {} },
          },
        };
        return render(api);
      };

      panels
        .filter((panel) => (typeof panel.visible === 'function' ? panel.visible(appApi) : true))
        .forEach((panel) => {
          const element = (
            <PluginErrorBoundary key={`${plugin.id}:${panel.id}`} pluginId={plugin.id}>
              <PanelRenderer render={withPluginApi(panel.render)} appApi={appApi} />
            </PluginErrorBoundary>
          );
          entries.push({
            key: `${plugin.id}:${panel.id}`,
            order: panel.order ?? 0,
            element,
          });
        });
    });
    entries.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return entries;
  }, [plugins, appApi]);

  const isMobile = !!appApi?.isMobile;
  const menuBarBottom = appApi?.menuBarBottom ?? 80;
  const overlayRightInset = appApi?.overlayRightInset ?? 0;
  const sidePanelContainerStyle = isMobile || hideSidePanels
    ? { display: 'none' }
    : {
        position: 'fixed',
        top: `calc(${menuBarBottom + 12}px + env(safe-area-inset-top))`,
        right: `calc(${16 + overlayRightInset}px + env(safe-area-inset-right))`,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        pointerEvents: 'none',
        zIndex: 10115,
      };

  return (
    <>
      {sidePanelEntries.length > 0 && !hideSidePanels && (
        <div className="plugin-side-panels" style={sidePanelContainerStyle}>
          {sidePanelEntries.map(({ key, element }) => (
            <div key={key} className="plugin-side-panels__item">
              {element}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default PluginHost;
