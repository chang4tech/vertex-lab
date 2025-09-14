import React from 'react';

// Simple plugin host that renders plugin-provided side panels
export function PluginHost({ plugins = [], appApi }) {
  if (!plugins || plugins.length === 0) return null;
  return (
    <>
      {plugins.flatMap((plugin) => {
        const panels = plugin.slots?.sidePanels || [];
        return panels
          .filter((p) => (typeof p.visible === 'function' ? p.visible(appApi) : true))
          .map((panel) => (
            <React.Fragment key={`${plugin.id}:${panel.id}`}>
              {panel.render(appApi)}
            </React.Fragment>
          ));
      })}
    </>
  );
}

export default PluginHost;

