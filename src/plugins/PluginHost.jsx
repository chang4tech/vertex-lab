import React from 'react';
import PluginErrorBoundary from './PluginErrorBoundary.jsx';

function PanelRenderer({ render, appApi }) {
  // Call provided render so errors bubble to the boundary above
  return render(appApi);
}

// Simple plugin host that renders plugin-provided side panels
export function PluginHost({ plugins = [], appApi }) {
  if (!plugins || plugins.length === 0) return null;
  return (
    <>
      {plugins.flatMap((plugin) => {
        const panels = Array.isArray(plugin?.slots?.sidePanels) ? plugin.slots.sidePanels : [];
        const overlays = Array.isArray(plugin?.slots?.canvasOverlays) ? plugin.slots.canvasOverlays : [];
        return panels
          .filter((p) => (typeof p.visible === 'function' ? p.visible(appApi) : true))
          .map((panel) => (
            <PluginErrorBoundary key={`${plugin.id}:${panel.id}`} pluginId={plugin.id}>
              <PanelRenderer render={panel.render} appApi={appApi} />
            </PluginErrorBoundary>
          ))
          .concat(
            overlays
              .filter((o) => (typeof o.visible === 'function' ? o.visible(appApi) : true))
              .map((overlay) => (
                <PluginErrorBoundary key={`${plugin.id}:overlay:${overlay.id}`} pluginId={plugin.id}>
                  <PanelRenderer render={overlay.render} appApi={appApi} />
                </PluginErrorBoundary>
              ))
          );
      })}
    </>
  );
}

export default PluginHost;
