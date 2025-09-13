import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useTheme } from '../contexts/ThemeContext';
import { 
  getNodeDisplayText, 
  getThemeNodeColor,
  NODE_SHAPES,
  NODE_COLOR_INFO,
  PRIORITY_LEVELS
} from '../utils/nodeUtils';

const NodeInfoPanel = ({ 
  selectedNodes = [], 
  visible = true, 
  onClose, 
  onEditNode,
  onDeleteNodes,
  onToggleCollapse 
}) => {
  const { currentTheme } = useTheme();
  const intl = useIntl();

  const isMultiSelection = selectedNodes.length > 1;
  const singleNode = selectedNodes.length === 1 ? selectedNodes[0] : null;

  // Calculate statistics for multi-selection
  const stats = React.useMemo(() => {
    if (selectedNodes.length === 0) return null;

    const shapes = {};
    const colors = {};
    const tags = new Set();
    let totalTags = 0;
    let collapsedCount = 0;
    let withIcons = 0;
    let withNotes = 0;

    selectedNodes.forEach(node => {
      // Count shapes
      const shape = node.shape || NODE_SHAPES.CIRCLE;
      shapes[shape] = (shapes[shape] || 0) + 1;

      // Count colors
      const color = node.color || '#ffffff';
      colors[color] = (colors[color] || 0) + 1;

      // Collect tags
      if (node.tags && node.tags.length > 0) {
        totalTags += node.tags.length;
        node.tags.forEach(tag => tags.add(tag));
      }

      // Count special properties
      if (node.isCollapsed) collapsedCount++;
      if (node.icon && node.icon.trim()) withIcons++;
      if (node.notes && node.notes.trim()) withNotes++;
    });

    return {
      shapes,
      colors,
      uniqueTags: Array.from(tags),
      totalTags,
      collapsedCount,
      withIcons,
      withNotes
    };
  }, [selectedNodes]);

  if (!visible) return null;

  const formatDate = (dateString) => {
    if (!dateString) return intl.formatMessage({ id: 'common.unknown' });
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return intl.formatMessage({ id: 'common.invalid' });
    }
  };

  const getShapeName = (shape) => {
    const shapeKey = Object.keys(NODE_SHAPES).find(key => NODE_SHAPES[key] === shape);
    return shapeKey ? intl.formatMessage({ 
      id: `nodeShape.${shapeKey.toLowerCase()}`,
      defaultMessage: shapeKey 
    }) : shape;
  };

  const getColorName = (color) => {
    const colorInfo = Object.entries(NODE_COLOR_INFO).find(([colorValue]) => colorValue === color);
    return colorInfo ? colorInfo[1].name : color;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 48, // Below menu bar
      right: 0,
      width: '320px',
      height: 'calc(100vh - 48px)',
      backgroundColor: currentTheme.colors.panelBackground,
      borderLeft: `1px solid ${currentTheme.colors.panelBorder}`,
      borderBottom: `1px solid ${currentTheme.colors.panelBorder}`,
      boxShadow: `-2px 0 8px ${currentTheme.colors.panelShadow}`,
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: `1px solid ${currentTheme.colors.panelBorder}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: currentTheme.colors.menuBackground
      }}>
        <h3 style={{
          margin: 0,
          color: currentTheme.colors.primaryText,
          fontSize: '16px',
          fontWeight: '600'
        }}>
          {isMultiSelection ? (
            <FormattedMessage 
              id="nodeInfo.multiSelection" 
              defaultMessage="{count} Nodes Selected"
              values={{ count: selectedNodes.length }}
            />
          ) : singleNode ? (
            <FormattedMessage id="nodeInfo.nodeDetails" defaultMessage="Node Details" />
          ) : (
            <FormattedMessage id="nodeInfo.noSelection" defaultMessage="No Selection" />
          )}
        </h3>
        <button
          onClick={onClose}
          style={{
            border: 'none',
            background: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            color: currentTheme.colors.secondaryText,
            padding: '4px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px'
      }}>
        {selectedNodes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: currentTheme.colors.secondaryText,
            marginTop: '40px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <FormattedMessage 
              id="nodeInfo.selectPrompt" 
              defaultMessage="Select a node to view its details"
            />
          </div>
        ) : isMultiSelection ? (
          // Multi-selection view
          <div>
            {/* Summary */}
            <div style={{
              backgroundColor: currentTheme.colors.inputBackground,
              border: `1px solid ${currentTheme.colors.inputBorder}`,
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <h4 style={{
                margin: '0 0 8px 0',
                color: currentTheme.colors.primaryText,
                fontSize: '14px'
              }}>
                <FormattedMessage id="nodeInfo.summary" defaultMessage="Summary" />
              </h4>
              <div style={{ color: currentTheme.colors.secondaryText, fontSize: '13px' }}>
                <div>
                  <FormattedMessage 
                    id="nodeInfo.totalNodes" 
                    defaultMessage="Total nodes: {count}"
                    values={{ count: selectedNodes.length }}
                  />
                </div>
                <div>
                  <FormattedMessage 
                    id="nodeInfo.withTags" 
                    defaultMessage="With tags: {count}"
                    values={{ count: stats.totalTags }}
                  />
                </div>
                <div>
                  <FormattedMessage 
                    id="nodeInfo.collapsed" 
                    defaultMessage="Collapsed: {count}"
                    values={{ count: stats.collapsedCount }}
                  />
                </div>
                <div>
                  <FormattedMessage 
                    id="nodeInfo.withIcons" 
                    defaultMessage="With icons: {count}"
                    values={{ count: stats.withIcons }}
                  />
                </div>
              </div>
            </div>

            {/* Shapes Distribution */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{
                margin: '0 0 8px 0',
                color: currentTheme.colors.primaryText,
                fontSize: '14px'
              }}>
                <FormattedMessage id="nodeInfo.shapes" defaultMessage="Shapes" />
              </h4>
              {Object.entries(stats.shapes).map(([shape, count]) => (
                <div key={shape} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                  color: currentTheme.colors.secondaryText,
                  fontSize: '13px'
                }}>
                  <span>{getShapeName(shape)}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>

            {/* Colors Distribution */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{
                margin: '0 0 8px 0',
                color: currentTheme.colors.primaryText,
                fontSize: '14px'
              }}>
                <FormattedMessage id="nodeInfo.colors" defaultMessage="Colors" />
              </h4>
              {Object.entries(stats.colors).map(([color, count]) => (
                <div key={color} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 0',
                  color: currentTheme.colors.secondaryText,
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: getThemeNodeColor({ color }, currentTheme),
                      border: `1px solid ${currentTheme.colors.panelBorder}`,
                      borderRadius: '3px'
                    }} />
                    <span>{getColorName(color)}</span>
                  </div>
                  <span>{count}</span>
                </div>
              ))}
            </div>

            {/* Tags */}
            {stats.uniqueTags.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{
                  margin: '0 0 8px 0',
                  color: currentTheme.colors.primaryText,
                  fontSize: '14px'
                }}>
                  <FormattedMessage id="nodeInfo.tags" defaultMessage="Tags" />
                </h4>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px'
                }}>
                  {stats.uniqueTags.map(tag => (
                    <span key={tag} style={{
                      backgroundColor: currentTheme.colors.primaryButton,
                      color: currentTheme.colors.primaryButtonText,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{
              borderTop: `1px solid ${currentTheme.colors.panelBorder}`,
              paddingTop: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <button
                onClick={() => onDeleteNodes && onDeleteNodes(selectedNodes.map(n => n.id))}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentTheme.colors.error,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                <FormattedMessage 
                  id="nodeInfo.deleteSelected" 
                  defaultMessage="Delete Selected ({count})"
                  values={{ count: selectedNodes.length }}
                />
              </button>
            </div>
          </div>
        ) : singleNode ? (
          // Single node view
          <div>
            {/* Node Preview */}
            <div style={{
              backgroundColor: currentTheme.colors.inputBackground,
              border: `1px solid ${currentTheme.colors.inputBorder}`,
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '24px',
                marginBottom: '8px'
              }}>
                {getNodeDisplayText(singleNode)}
              </div>
              <div style={{
                color: currentTheme.colors.secondaryText,
                fontSize: '12px'
              }}>
                ID: {singleNode.id}
              </div>
            </div>

            {/* Basic Properties */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{
                margin: '0 0 8px 0',
                color: currentTheme.colors.primaryText,
                fontSize: '14px'
              }}>
                <FormattedMessage id="nodeInfo.properties" defaultMessage="Properties" />
              </h4>
              
              <div style={{ fontSize: '13px', color: currentTheme.colors.secondaryText }}>
                <div style={{ marginBottom: '4px' }}>
                  <strong><FormattedMessage id="nodeInfo.position" defaultMessage="Position" />:</strong> 
                  {` (${Math.round(singleNode.x)}, ${Math.round(singleNode.y)})`}
                </div>
                
                <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong><FormattedMessage id="nodeInfo.shape" defaultMessage="Shape" />:</strong>
                  <span>{getShapeName(singleNode.shape || NODE_SHAPES.CIRCLE)}</span>
                </div>
                
                <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong><FormattedMessage id="nodeInfo.color" defaultMessage="Color" />:</strong>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: getThemeNodeColor(singleNode, currentTheme),
                    border: `1px solid ${currentTheme.colors.panelBorder}`,
                    borderRadius: '3px'
                  }} />
                  <span>{getColorName(singleNode.color || '#ffffff')}</span>
                </div>

                {singleNode.fontSize && (
                  <div style={{ marginBottom: '4px' }}>
                    <strong><FormattedMessage id="nodeInfo.fontSize" defaultMessage="Font Size" />:</strong>
                    {` ${singleNode.fontSize}px`}
                  </div>
                )}

                {singleNode.parentId && (
                  <div style={{ marginBottom: '4px' }}>
                    <strong><FormattedMessage id="nodeInfo.parent" defaultMessage="Parent ID" />:</strong>
                    {` ${singleNode.parentId}`}
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {singleNode.tags && singleNode.tags.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{
                  margin: '0 0 8px 0',
                  color: currentTheme.colors.primaryText,
                  fontSize: '14px'
                }}>
                  <FormattedMessage id="nodeInfo.tags" defaultMessage="Tags" />
                </h4>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px'
                }}>
                  {singleNode.tags.map(tag => (
                    <span key={tag} style={{
                      backgroundColor: currentTheme.colors.primaryButton,
                      color: currentTheme.colors.primaryButtonText,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {singleNode.notes && singleNode.notes.trim() && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{
                  margin: '0 0 8px 0',
                  color: currentTheme.colors.primaryText,
                  fontSize: '14px'
                }}>
                  <FormattedMessage id="nodeInfo.notes" defaultMessage="Notes" />
                </h4>
                <div style={{
                  backgroundColor: currentTheme.colors.inputBackground,
                  border: `1px solid ${currentTheme.colors.inputBorder}`,
                  borderRadius: '6px',
                  padding: '8px',
                  fontSize: '13px',
                  color: currentTheme.colors.secondaryText,
                  whiteSpace: 'pre-wrap'
                }}>
                  {singleNode.notes}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{
                margin: '0 0 8px 0',
                color: currentTheme.colors.primaryText,
                fontSize: '14px'
              }}>
                <FormattedMessage id="nodeInfo.timestamps" defaultMessage="Timestamps" />
              </h4>
              <div style={{ fontSize: '12px', color: currentTheme.colors.secondaryText }}>
                <div style={{ marginBottom: '4px' }}>
                  <strong><FormattedMessage id="nodeInfo.created" defaultMessage="Created" />:</strong>
                  {` ${formatDate(singleNode.createdAt)}`}
                </div>
                <div>
                  <strong><FormattedMessage id="nodeInfo.updated" defaultMessage="Updated" />:</strong>
                  {` ${formatDate(singleNode.updatedAt)}`}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{
              borderTop: `1px solid ${currentTheme.colors.panelBorder}`,
              paddingTop: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <button
                onClick={() => onEditNode && onEditNode(singleNode.id)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentTheme.colors.primaryButton,
                  color: currentTheme.colors.primaryButtonText,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                <FormattedMessage id="nodeInfo.edit" defaultMessage="Edit Node" />
              </button>
              
              {singleNode.isCollapsed !== undefined && (
                <button
                  onClick={() => onToggleCollapse && onToggleCollapse(singleNode.id)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: currentTheme.colors.inputBackground,
                    color: currentTheme.colors.primaryText,
                    border: `1px solid ${currentTheme.colors.inputBorder}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  {singleNode.isCollapsed ? (
                    <FormattedMessage id="nodeInfo.expand" defaultMessage="Expand Node" />
                  ) : (
                    <FormattedMessage id="nodeInfo.collapse" defaultMessage="Collapse Node" />
                  )}
                </button>
              )}
              
              <button
                onClick={() => onDeleteNodes && onDeleteNodes([singleNode.id])}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: currentTheme.colors.error,
                  border: `1px solid ${currentTheme.colors.error}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                <FormattedMessage id="nodeInfo.delete" defaultMessage="Delete Node" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default NodeInfoPanel;