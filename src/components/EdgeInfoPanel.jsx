import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useTheme } from '../contexts/ThemeContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { getNodeDisplayText } from '../utils/nodeUtils';

const RESERVED_EDGE_KEYS = new Set(['id', 'source', 'target', 'directed']);

const safeStringify = (value) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
};

const collectMetadataEntries = (value, prefix, depth = 0) => {
  if (depth > 3) {
    return [{ key: prefix, value: safeStringify(value), isMultiline: true }];
  }
  if (value == null) {
    return [{ key: prefix, value: 'null', isMultiline: false }];
  }
  if (typeof value !== 'object') {
    return [{ key: prefix, value: String(value), isMultiline: false }];
  }
  if (Array.isArray(value)) {
    return [{ key: prefix, value: safeStringify(value), isMultiline: true }];
  }
  const entries = [];
  Object.entries(value).forEach(([childKey, childValue]) => {
    const nextPrefix = `${prefix}.${childKey}`;
    entries.push(...collectMetadataEntries(childValue, nextPrefix, depth + 1));
  });
  if (entries.length === 0) {
    entries.push({ key: prefix, value: '{}', isMultiline: false });
  }
  return entries;
};

const buildMetadataEntries = (edge) => {
  if (!edge || typeof edge !== 'object') return [];
  const entries = [];
  Object.entries(edge).forEach(([key, value]) => {
    if (RESERVED_EDGE_KEYS.has(key) || value === undefined) return;
    if (key === 'metadata' && value && typeof value === 'object') {
      entries.push(...collectMetadataEntries(value, 'metadata'));
      return;
    }
    if (value == null) {
      entries.push({ key, value: 'null', isMultiline: false });
      return;
    }
    if (typeof value === 'object') {
      entries.push({ key, value: safeStringify(value), isMultiline: true });
      return;
    }
    entries.push({ key, value: String(value), isMultiline: false });
  });
  return entries;
};

const resolveNodeLabel = (node, id, intl) => {
  if (node) {
    return getNodeDisplayText(node);
  }
  if (id === undefined || id === null) {
    return intl.formatMessage({ id: 'edgeInfo.unknownNode', defaultMessage: 'Unknown node' });
  }
  return intl.formatMessage({ id: 'edgeInfo.nodeFallback', defaultMessage: 'Node {id}' }, { id });
};

const normalizeEdge = (edge, index, nodeMap, intl) => {
  const sourceId = edge?.source;
  const targetId = edge?.target;
  const sourceNode = nodeMap.get(sourceId);
  const targetNode = nodeMap.get(targetId);
  const internalId = edge?.id != null ? edge.id : `${sourceId ?? 'unknown'}_${targetId ?? 'unknown'}_${index}`;
  const sourceLabel = resolveNodeLabel(sourceNode, sourceId, intl);
  const targetLabel = resolveNodeLabel(targetNode, targetId, intl);
  return {
    id: internalId,
    sourceId,
    targetId,
    directed: Boolean(edge?.directed),
    sourceNode,
    targetNode,
    sourceLabel,
    targetLabel,
    label: `${sourceLabel} -> ${targetLabel}`,
    metadataEntries: buildMetadataEntries(edge),
    original: edge,
  };
};

const EdgeInfoPanel = ({
  edges = [],
  nodes = [],
  selectedNodeIds = [],
  visible = true,
  onClose,
  topOffset = 80,
  rightOffset = 0,
  onResetView,
}) => {
  const { currentTheme } = useTheme();
  const intl = useIntl();
  const isMobile = useIsMobile();
  const panelWidth = isMobile ? 280 : 320;

  const nodeMap = React.useMemo(() => {
    const map = new Map();
    if (!Array.isArray(nodes)) return map;
    nodes.forEach((node) => {
      if (!node || node.id == null) return;
      map.set(node.id, node);
    });
    return map;
  }, [nodes]);

  const normalizedEdges = React.useMemo(() => {
    if (!Array.isArray(edges)) return [];
    return edges
      .filter((edge) => edge && typeof edge === 'object')
      .map((edge, index) => normalizeEdge(edge, index, nodeMap, intl));
  }, [edges, nodeMap, intl]);

  const selectedSet = React.useMemo(() => {
    if (!Array.isArray(selectedNodeIds)) return new Set();
    return new Set(selectedNodeIds);
  }, [selectedNodeIds]);

  const edgesTouchingSelection = React.useMemo(() => {
    if (selectedSet.size === 0) return [];
    return normalizedEdges.filter((edge) => selectedSet.has(edge.sourceId) || selectedSet.has(edge.targetId));
  }, [normalizedEdges, selectedSet]);

  const edgesConnectingSelection = React.useMemo(() => {
    if (selectedSet.size < 2) return [];
    return normalizedEdges.filter((edge) => selectedSet.has(edge.sourceId) && selectedSet.has(edge.targetId));
  }, [normalizedEdges, selectedSet]);

  const sortedEdges = React.useMemo(() => {
    if (normalizedEdges.length === 0) return [];
    const rankForEdge = (edge) => {
      const connects = selectedSet.has(edge.sourceId) && selectedSet.has(edge.targetId);
      if (connects) return 0;
      const touches = selectedSet.has(edge.sourceId) || selectedSet.has(edge.targetId);
      if (touches) return 1;
      return 2;
    };
    return [...normalizedEdges].sort((a, b) => {
      const rankDiff = rankForEdge(a) - rankForEdge(b);
      if (rankDiff !== 0) return rankDiff;
      return a.label.localeCompare(b.label);
    });
  }, [normalizedEdges, selectedSet]);

  const [activeEdgeId, setActiveEdgeId] = React.useState(null);

  React.useEffect(() => {
    if (normalizedEdges.length === 0) {
      if (activeEdgeId !== null) {
        setActiveEdgeId(null);
      }
      return;
    }
    let nextId = null;
    if (edgesConnectingSelection.length > 0) {
      nextId = edgesConnectingSelection[0].id;
    } else if (edgesTouchingSelection.length > 0) {
      nextId = edgesTouchingSelection[0].id;
    } else if (activeEdgeId && normalizedEdges.some((edge) => edge.id === activeEdgeId)) {
      nextId = activeEdgeId;
    } else {
      nextId = normalizedEdges[0].id;
    }
    if (nextId !== activeEdgeId) {
      setActiveEdgeId(nextId);
    }
  }, [normalizedEdges, edgesTouchingSelection, edgesConnectingSelection, activeEdgeId]);

  const activeEdge = React.useMemo(() => {
    if (!activeEdgeId) return null;
    return normalizedEdges.find((edge) => edge.id === activeEdgeId) || null;
  }, [normalizedEdges, activeEdgeId]);

  if (!visible) return null;

  const safeTop = typeof topOffset === 'number' && Number.isFinite(topOffset) ? topOffset : 80;
  const safeRight = typeof rightOffset === 'number' && Number.isFinite(rightOffset) ? rightOffset : 0;
  const topStyle = `calc(${safeTop}px + env(safe-area-inset-top, 0px))`;
  const heightStyle = `calc(100vh - ${safeTop}px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))`;
  const rightStyle = `calc(${safeRight}px + env(safe-area-inset-right, 0px))`;

  const panelStyle = {
    position: 'fixed',
    top: topStyle,
    right: rightStyle,
    width: `${panelWidth}px`,
    height: heightStyle,
    backgroundColor: currentTheme.colors.panelBackground,
    borderLeft: `1px solid ${currentTheme.colors.panelBorder}`,
    borderBottom: `1px solid ${currentTheme.colors.panelBorder}`,
    boxShadow: `-2px 0 8px ${currentTheme.colors.panelShadow}`,
    zIndex: 99,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const headerStyle = {
    padding: '16px',
    borderBottom: `1px solid ${currentTheme.colors.panelBorder}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: currentTheme.colors.menuBackground,
  };

  const contentStyle = {
    flex: 1,
    overflow: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  const cardStyle = {
    backgroundColor: currentTheme.colors.inputBackground,
    border: `1px solid ${currentTheme.colors.inputBorder}`,
    borderRadius: 8,
    padding: '12px',
  };

  const detailRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    color: currentTheme.colors.primaryText,
    marginBottom: 6,
    gap: 12,
  };

  const detailLabelStyle = {
    fontWeight: 600,
    color: currentTheme.colors.secondaryText,
    minWidth: 90,
  };

  const edgeListContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  };

  const renderMetadata = (edge) => {
    if (!edge || edge.metadataEntries.length === 0) {
      return (
        <div style={{ color: currentTheme.colors.secondaryText, fontSize: '13px' }}>
          <FormattedMessage id="edgeInfo.noMetadata" defaultMessage="No additional metadata" />
        </div>
      );
    }
    return edge.metadataEntries.map((entry) => (
      <div key={entry.key} style={{ marginBottom: 8 }}>
        <div style={{ fontSize: '12px', color: currentTheme.colors.secondaryText }}>{entry.key}</div>
        {entry.isMultiline ? (
          <pre
            style={{
              margin: '4px 0 0 0',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              backgroundColor: currentTheme.colors.panelBackground,
              border: `1px solid ${currentTheme.colors.panelBorder}`,
              borderRadius: 4,
              padding: '8px',
              fontSize: '12px',
              color: currentTheme.colors.primaryText,
            }}
          >{entry.value}</pre>
        ) : (
          <div style={{ marginTop: 4, fontSize: '13px', color: currentTheme.colors.primaryText }}>{entry.value}</div>
        )}
      </div>
    ));
  };

  const renderEdgeButton = (edge) => {
    const isActive = activeEdgeId === edge.id;
    const touches = selectedSet.has(edge.sourceId) || selectedSet.has(edge.targetId);
    const connects = selectedSet.has(edge.sourceId) && selectedSet.has(edge.targetId);
    const backgroundColor = isActive ? currentTheme.colors.primaryButton : currentTheme.colors.inputBackground;
    const color = isActive ? (currentTheme.colors.primaryButtonText || '#ffffff') : currentTheme.colors.primaryText;
    const borderColor = connects
      ? currentTheme.colors.primaryButton
      : touches
        ? currentTheme.colors.secondaryText
        : currentTheme.colors.inputBorder;
    return (
      <button
        key={edge.id}
        onClick={() => setActiveEdgeId(edge.id)}
        type="button"
        style={{
          border: `1px solid ${borderColor}`,
          borderRadius: 8,
          padding: '10px',
          backgroundColor,
          color,
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: '14px' }}>{edge.label}</div>
        <div style={{ fontSize: '12px', opacity: 0.85 }}>
          <FormattedMessage
            id="edgeInfo.edgeSummary"
            defaultMessage="{source} -> {target}"
            values={{ source: edge.sourceId ?? '?', target: edge.targetId ?? '?' }}
          />
        </div>
        {(connects || touches) && (
          <div style={{
            fontSize: '11px',
            fontWeight: 600,
            color,
            opacity: 0.9,
          }}>
            {connects ? (
              <FormattedMessage id="edgeInfo.connectsSelectionBadge" defaultMessage="Between selected nodes" />
            ) : (
              <FormattedMessage id="edgeInfo.touchesSelectionBadge" defaultMessage="Touches selection" />
            )}
          </div>
        )}
      </button>
    );
  };

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <h3 style={{ margin: 0, color: currentTheme.colors.primaryText, fontSize: '16px', fontWeight: 600 }}>
          <FormattedMessage id="edgeInfo.title" defaultMessage="Edge Info" />
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onResetView && (
            <button
              type="button"
              onClick={onResetView}
              style={{
                border: `1px solid ${currentTheme.colors.inputBorder}`,
                background: currentTheme.colors.panelBackground,
                color: currentTheme.colors.primaryText,
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <FormattedMessage id="edgeInfo.resetView" defaultMessage="Reset view" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              fontSize: '16px',
              cursor: 'pointer',
              color: currentTheme.colors.secondaryText,
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>
      </div>
      <div style={contentStyle}>
        {normalizedEdges.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: currentTheme.colors.secondaryText,
            marginTop: '40px',
            padding: '0 8px',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔗</div>
            <div style={{ marginBottom: 6 }}>
              <FormattedMessage id="edgeInfo.noEdges" defaultMessage="No edges in this diagram yet." />
            </div>
            <div style={{ fontSize: '13px' }}>
              <FormattedMessage id="edgeInfo.selectPrompt" defaultMessage="Select an edge or two nodes to view connection details." />
            </div>
          </div>
        ) : (
          <>
            <div style={cardStyle}>
              <h4 style={{ margin: '0 0 8px 0', color: currentTheme.colors.primaryText, fontSize: '14px' }}>
                <FormattedMessage id="edgeInfo.summary" defaultMessage="Summary" />
              </h4>
              <div style={{ fontSize: '13px', color: currentTheme.colors.secondaryText, display: 'grid', gap: 4 }}>
                <div>
                  <FormattedMessage id="edgeInfo.totalEdges" defaultMessage="Total edges: {count}" values={{ count: intl.formatNumber(normalizedEdges.length) }} />
                </div>
                {selectedSet.size > 0 && (
                  <div>
                    <FormattedMessage
                      id="edgeInfo.connectedToSelection"
                      defaultMessage="Connected to selection: {count}"
                      values={{ count: edgesTouchingSelection.length }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div style={cardStyle}>
              <h4 style={{ margin: '0 0 8px 0', color: currentTheme.colors.primaryText, fontSize: '14px' }}>
                <FormattedMessage id="edgeInfo.edgeDetails" defaultMessage="Edge Details" />
              </h4>
              {activeEdge ? (
                <div>
                  <div style={detailRowStyle}>
                    <span style={detailLabelStyle}>
                      <FormattedMessage id="edgeInfo.edgeId" defaultMessage="Edge ID" />
                    </span>
                    <span>{activeEdge.original?.id ?? activeEdge.id ?? 'N/A'}</span>
                  </div>
                  <div style={detailRowStyle}>
                    <span style={detailLabelStyle}>
                      <FormattedMessage id="edgeInfo.source" defaultMessage="Source" />
                    </span>
                    <span>
                      {activeEdge.sourceLabel}
                      {activeEdge.sourceId != null && (
                        <span style={{ color: currentTheme.colors.secondaryText }}> ({activeEdge.sourceId})</span>
                      )}
                    </span>
                  </div>
                  <div style={detailRowStyle}>
                    <span style={detailLabelStyle}>
                      <FormattedMessage id="edgeInfo.target" defaultMessage="Target" />
                    </span>
                    <span>
                      {activeEdge.targetLabel}
                      {activeEdge.targetId != null && (
                        <span style={{ color: currentTheme.colors.secondaryText }}> ({activeEdge.targetId})</span>
                      )}
                    </span>
                  </div>
                  <div style={detailRowStyle}>
                    <span style={detailLabelStyle}>
                      <FormattedMessage id="edgeInfo.directed" defaultMessage="Directed" />
                    </span>
                    <span>
                      {activeEdge.directed ? (
                        <FormattedMessage id="edgeInfo.directedYes" defaultMessage="Yes" />
                      ) : (
                        <FormattedMessage id="edgeInfo.directedNo" defaultMessage="No" />
                      )}
                    </span>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: currentTheme.colors.secondaryText }}>
                      <FormattedMessage id="edgeInfo.metadata" defaultMessage="Metadata" />
                    </div>
                    <div style={{ marginTop: 8 }}>
                      {renderMetadata(activeEdge)}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: currentTheme.colors.secondaryText, fontSize: '13px' }}>
                  <FormattedMessage id="edgeInfo.selectPrompt" defaultMessage="Select an edge or two nodes to view connection details." />
                </div>
              )}
            </div>

            <div>
              <h4 style={{ margin: '0 0 8px 0', color: currentTheme.colors.primaryText, fontSize: '14px' }}>
                <FormattedMessage id="edgeInfo.list" defaultMessage="Edges" />
              </h4>
              <div style={edgeListContainerStyle}>
                {sortedEdges.map(renderEdgeButton)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EdgeInfoPanel;
