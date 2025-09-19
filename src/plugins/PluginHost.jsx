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
export function PluginHost({ plugins = [], appApi, onOverlaysChange }) {
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
  return (
    <>
      {plugins.flatMap((plugin) => {
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

        return panels
          .filter((panel) => (typeof panel.visible === 'function' ? panel.visible(appApi) : true))
          .map((panel) => (
            <PluginErrorBoundary key={`${plugin.id}:${panel.id}`} pluginId={plugin.id}>
              <PanelRenderer render={withPluginApi(panel.render)} appApi={appApi} />
            </PluginErrorBoundary>
          ));
      })}
    </>
  );
}

export default PluginHost;
