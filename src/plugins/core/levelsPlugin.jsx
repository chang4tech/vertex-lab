import React from 'react';

export const levelsPlugin = {
  id: 'core.levels',
  name: 'Node Levels',
  description: 'Manage level assignments without parent/child relationships.',
  version: '1.0.0',
  author: 'Vertex Lab Core',
  slots: {
    aboutPage: {
      markdown: `
* Assign a numeric level to a node from the context menu.
* Remove legacy parent/child links and rely on level metadata instead.
      `.trim(),
      render: () => (
        <div style={{ color: '#374151' }}>
          <p style={{ marginTop: 0 }}>
            Use levels to organize your graph hierarchically without relying on parent-child pointers.
          </p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Assign levels to nodes via the node context menu command.</li>
            <li>Clear legacy parent links to keep the graph level based only.</li>
          </ul>
        </div>
      )
    },
    commands: [
      {
        id: 'core.levels.setLevel',
        title: 'Set Node Level…',
        when: (api, ctx) => {
          const id = ctx?.nodeId ?? api?.selectedNodeIds?.[0];
          return id != null;
        },
        run: (api, ctx) => {
          const sourceId = ctx?.nodeId ?? api?.selectedNodeIds?.[0];
          if (sourceId == null) return;

          if (typeof window === 'undefined') {
            console.warn('[levelsPlugin] window is not available for prompt input.');
            return;
          }

          const raw = window.prompt('Enter level for node:', '0');
          if (raw == null) return;
          const value = raw.trim();
          if (value === '') return;
          const level = Number(value);
          if (!Number.isFinite(level)) {
            window.alert?.('Level must be a valid number.');
            return;
          }

          if (typeof api.updateNodes === 'function') {
            api.updateNodes((draft) => draft.map((node) => (
              node.id === sourceId
                ? {
                    ...node,
                    level,
                    parentId: null,
                  }
                : node
            )));
          }

          api.setHighlightedNodes?.([sourceId]);
          api.selectNodes?.([sourceId], { center: true });
        }
      },
      {
        id: 'core.levels.clearParents',
        title: 'Remove Parent Links',
        when: (api) => Array.isArray(api?.nodes) && api.nodes.some(node => node?.parentId != null),
        run: (api) => {
          if (typeof api.updateNodes !== 'function') {
            console.warn('[levelsPlugin] updateNodes API is unavailable.');
            return;
          }

          api.updateNodes((draft) => draft.map((node) => (
            node.parentId != null
              ? { ...node, parentId: null }
              : node
          )));

          api.setHighlightedNodes?.([]);
        }
      }
    ],
    sidePanels: [
      {
        id: 'levelsInspector',
        order: 50,
        visible: () => true,
        render: (api) => {
          const nodes = Array.isArray(api?.nodes) ? api.nodes : [];
          const groups = nodes.reduce((acc, node) => {
            const level = node.level ?? 0;
            if (!acc.has(level)) acc.set(level, []);
            acc.get(level).push(node);
            return acc;
          }, new Map());

          const sortedLevels = Array.from(groups.keys()).sort((a, b) => a - b);

          return (
            <div style={{ width: 260, padding: 12, borderLeft: '1px solid #e5e7eb', background: '#fff' }}>
              <h3 style={{ margin: '8px 0' }}>Levels</h3>
              {sortedLevels.length === 0 ? (
                <p style={{ color: '#6b7280' }}>No levels assigned yet.</p>
              ) : (
                sortedLevels.map((level) => (
                  <div key={level} style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Level {level}</div>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {groups.get(level).map((node) => (
                        <li key={node.id} style={{ cursor: 'pointer', color: '#2563eb' }}
                          onClick={() => {
                            api.selectNodes?.([node.id], { center: true });
                            api.setHighlightedNodes?.([node.id]);
                          }}
                        >
                          #{node.id} {node.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          );
        }
      }
    ]
  }
};

export default levelsPlugin;
