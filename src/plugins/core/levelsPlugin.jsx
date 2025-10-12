import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useTheme } from '../../contexts/ThemeContext';

function LevelsAbout() {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  return (
    <div style={{ color: colors.primaryText }}>
      <p style={{ marginTop: 0 }}>
        <FormattedMessage
          id="plugin.levels.about.summary"
          defaultMessage="Use levels to organize your graph without relying on parent/child metadata."
        />
      </p>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <FormattedMessage
            id="plugin.levels.about.assign"
            defaultMessage="Assign levels to nodes via the node context menu command."
          />
        </li>
        <li>
          <FormattedMessage
            id="plugin.levels.about.clear"
            defaultMessage="Clear legacy hierarchy links to keep the graph purely level-based."
          />
        </li>
      </ul>
    </div>
  );
}

function LevelsPanel({ groupedLevels, onSelectNode, appearance = 'standalone' }) {
  const { currentTheme } = useTheme();
  const intl = useIntl();
  const colors = currentTheme.colors;
  const isEmbedded = appearance === 'embedded';
  const containerStyle = isEmbedded
    ? {
        width: '100%',
        padding: '18px 20px',
        borderRadius: 14,
        border: `1px solid ${colors.panelBorder}`,
        background: colors.panelBackground,
        boxShadow: '0 18px 44px -32px rgba(15, 23, 42, 0.28)',
        color: colors.primaryText,
        pointerEvents: 'auto',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }
    : {
        width: 260,
        padding: 16,
        borderRadius: 12,
        border: `1px solid ${colors.panelBorder}`,
        background: colors.panelBackground,
        boxShadow: `0 12px 24px ${colors.panelShadow}`,
        color: colors.primaryText,
        pointerEvents: 'auto',
        boxSizing: 'border-box',
      };
  return (
    <div style={containerStyle}>
      <h3 style={{ margin: 0, color: colors.primaryText }}>
        <FormattedMessage id="plugin.levels.title" defaultMessage="Levels" />
      </h3>
      {groupedLevels.length === 0 ? (
        <p style={{ color: colors.secondaryText, marginTop: 12 }}>
          <FormattedMessage
            id="plugin.levels.empty"
            defaultMessage="No levels assigned yet."
          />
        </p>
      ) : (
        groupedLevels.map(({ level, nodes }) => (
          <div key={level} style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {intl.formatMessage(
                { id: 'plugin.levels.levelHeading', defaultMessage: 'Level {level}' },
                { level: intl.formatNumber(level) }
              )}
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }}>
              {nodes.map((node) => (
                <li key={node.id} style={{ listStyle: 'disc' }}>
                  <button
                    type="button"
                    onClick={() => onSelectNode(node.id)}
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      color: colors.primaryButton,
                      fontWeight: 500,
                    }}
                  >
                    #{node.id} {node.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}

export const levelsPlugin = {
  id: 'core.levels',
  name: 'Node Levels',
  nameMessageId: 'plugin.levels.title',
  description: 'Manage level assignments without parent/child relationships.',
  version: '1.0.0',
  author: 'Vertex Lab Core',
  slots: {
    aboutPage: {
      markdown: `
* Assign a numeric level to a node from the context menu.
* Clear legacy hierarchy links so the graph relies solely on levels.
      `.trim(),
      render: () => <LevelsAbout />
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

          const promptLabel = 'Enter level for node:';
          const raw = window.prompt(promptLabel, '0');
          if (raw == null) return;
          const value = raw.trim();
          if (value === '') return;
          const level = Number(value);
          if (!Number.isFinite(level)) {
            window.alert?.('Level must be a valid number.');
            return;
          }

          const maxLevel = Number.isFinite(api.maxLevel) ? api.maxLevel : 99;
          const clampedLevel = Math.max(0, Math.min(maxLevel, Math.round(level)));

          if (typeof api.updateNodes === 'function') {
            api.updateNodes((draft) => draft.map((node) => (
              node.id === sourceId
                ? {
                    ...node,
                    level: clampedLevel,
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
        title: 'Clear Legacy Links',
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
        title: 'Levels',
        allowCollapse: true,
        visible: () => true,
        render: (api) => {
          const nodes = Array.isArray(api?.nodes) ? api.nodes : [];
          const groups = nodes.reduce((acc, node) => {
            const level = node.level ?? 0;
            if (!acc.has(level)) acc.set(level, []);
            acc.get(level).push(node);
            return acc;
          }, new Map());

          const groupedLevels = Array.from(groups.keys())
            .sort((a, b) => a - b)
            .map((level) => ({
              level,
              nodes: groups.get(level) ?? [],
            }));

          return (
            <LevelsPanel
              groupedLevels={groupedLevels}
              onSelectNode={(id) => {
                if (id == null) return;
                api.selectNodes?.([id], { center: true });
                api.setHighlightedNodes?.([id]);
              }}
              appearance="embedded"
            />
          );
        }
      }
    ]
  }
};

export default levelsPlugin;
