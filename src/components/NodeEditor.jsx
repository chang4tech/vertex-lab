import React, { useState, useEffect, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useTheme } from '../contexts/ThemeContext';
import {
  NODE_COLORS,
  NODE_COLOR_INFO,
  NODE_SHAPES,
  NODE_ICONS,
  updateNode,
  addTag,
  removeTag,
  hasTag,
  getNodeTextColor
} from '../utils/nodeUtils';
import { loadTags } from '../utils/tagUtils';

const NodeEditor = ({ node, visible, onSave, onClose, onDelete }) => {
  const { currentTheme } = useTheme();
  const intl = useIntl();
  const [editedNode, setEditedNode] = useState(node);
  const [activeTab, setActiveTab] = useState('basic');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (visible && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [visible]);

  useEffect(() => {
    setEditedNode(node);
  }, [node]);

  // Lock body scroll while editor is open
  useEffect(() => {
    if (!visible) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, [visible]);

  if (!visible) return null;

  const handleSave = () => {
    onSave(node.id, editedNode);
    onClose();
  };

  const handleCancel = () => {
    setEditedNode(node);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(intl.formatMessage({ 
      id: 'nodeEditor.confirmDelete', 
      defaultMessage: 'Are you sure you want to delete this node and all its children?' 
    }))) {
      onDelete(node.id);
      onClose();
    }
  };

  const handleTagToggle = (tagId) => {
    if (hasTag(editedNode, tagId)) {
      setEditedNode(removeTag(editedNode, tagId));
    } else {
      setEditedNode(addTag(editedNode, tagId));
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const tabs = [
    { id: 'basic', label: intl.formatMessage({ id: 'nodeEditor.basic', defaultMessage: 'Basic' }) },
    { id: 'style', label: intl.formatMessage({ id: 'nodeEditor.style', defaultMessage: 'Style' }) },
    { id: 'tags', label: intl.formatMessage({ id: 'nodeEditor.tags', defaultMessage: 'Tags' }) },
    { id: 'advanced', label: intl.formatMessage({ id: 'nodeEditor.advanced', defaultMessage: 'Advanced' }) }
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="node-editor-title"
      onClick={handleOverlayClick}
      style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: currentTheme.colors.overlayBackground,
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: currentTheme.colors.panelBackground,
        borderRadius: '12px',
        boxShadow: `0 8px 32px ${currentTheme.colors.panelShadow}`,
        width: 'min(860px, 95vw)',
        height: 'min(80vh, 820px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: `1px solid ${currentTheme.colors.panelBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 id="node-editor-title" style={{
            margin: 0,
            color: currentTheme.colors.primaryText,
            fontSize: '18px',
            fontWeight: '600'
          }}>
            <FormattedMessage id="nodeEditor.title" defaultMessage="Edit Node" />
          </h3>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: currentTheme.colors.secondaryText,
              padding: '4px'
            }}
            aria-label={intl.formatMessage({ id: 'common.close', defaultMessage: 'Close' })}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '0 12px',
          borderBottom: `1px solid ${currentTheme.colors.panelBorder}`
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                background: activeTab === tab.id ? currentTheme.colors.menuHover : 'transparent',
                color: activeTab === tab.id ? currentTheme.colors.primaryText : currentTheme.colors.secondaryText,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? '600' : '400',
                borderBottom: activeTab === tab.id ? `2px solid ${currentTheme.colors.primaryButton}` : '2px solid transparent'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          padding: '20px',
          overflowY: 'auto',
          flex: 1,
        }}>
          {activeTab === 'basic' && (
            <BasicTab 
              editedNode={editedNode} 
              setEditedNode={setEditedNode} 
              currentTheme={currentTheme}
              textareaRef={textareaRef}
            />
          )}
          {activeTab === 'style' && (
            <StyleTab 
              editedNode={editedNode} 
              setEditedNode={setEditedNode} 
              currentTheme={currentTheme}
            />
          )}
          {activeTab === 'tags' && (
            <TagsTab 
              editedNode={editedNode} 
              onTagToggle={handleTagToggle} 
              currentTheme={currentTheme}
            />
          )}
          {activeTab === 'advanced' && (
            <AdvancedTab 
              editedNode={editedNode} 
              setEditedNode={setEditedNode} 
              currentTheme={currentTheme}
            />
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px',
          borderTop: `1px solid ${currentTheme.colors.panelBorder}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={handleDelete}
            style={{
              padding: '8px 16px',
              border: `1px solid ${currentTheme.colors.error}`,
              backgroundColor: 'transparent',
              color: currentTheme.colors.error,
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <FormattedMessage id="nodeEditor.delete" defaultMessage="Delete" />
          </button>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleCancel}
              style={{
                padding: '8px 16px',
                border: `1px solid ${currentTheme.colors.panelBorder}`,
                backgroundColor: 'transparent',
                color: currentTheme.colors.secondaryText,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <FormattedMessage id="common.cancel" defaultMessage="Cancel" />
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '8px 16px',
                border: 'none',
                backgroundColor: currentTheme.colors.primaryButton,
                color: currentTheme.colors.primaryButtonText,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              <FormattedMessage id="common.save" defaultMessage="Save" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Basic tab component
const BasicTab = ({ editedNode, setEditedNode, currentTheme, textareaRef }) => {
  const intl = useIntl();
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px'
  };
  const cardStyle = {
    padding: '12px',
    border: `1px solid ${currentTheme.colors.panelBorder}`,
    borderRadius: '8px',
    backgroundColor: currentTheme.colors.panelBackground,
  };
  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    color: currentTheme.colors.primaryText,
    fontSize: '14px',
    fontWeight: '600'
  };
  const inputBase = {
    width: '100%',
    padding: '12px',
    border: `1px solid ${currentTheme.colors.inputBorder}`,
    borderRadius: '4px',
    backgroundColor: currentTheme.colors.inputBackground,
    color: currentTheme.colors.primaryText,
    fontSize: '14px',
    fontFamily: 'inherit'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={gridStyle}>
        {/* Label */}
        <div style={cardStyle}>
          <label style={labelStyle}>
            <FormattedMessage id="nodeEditor.label" defaultMessage="Label" />
          </label>
          <textarea
            ref={textareaRef}
            value={editedNode.label}
            onChange={(e) => setEditedNode({ ...editedNode, label: e.target.value })}
            style={{ ...inputBase, minHeight: '96px', resize: 'vertical' }}
            placeholder={intl.formatMessage({ id: 'nodeEditor.labelPlaceholder', defaultMessage: 'Enter node text...' })}
          />
        </div>

        {/* Icon */}
        <div style={cardStyle}>
          <label style={labelStyle}>
            <FormattedMessage id="nodeEditor.icon" defaultMessage="Icon" />
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
            gap: '8px'
          }}>
            {Object.entries(NODE_ICONS).map(([key, icon]) => (
              <button
                key={key}
                onClick={() => setEditedNode({ ...editedNode, icon })}
                style={{
                  padding: '8px',
                  border: `2px solid ${editedNode.icon === icon ? currentTheme.colors.primaryButton : currentTheme.colors.panelBorder}`,
                  backgroundColor: editedNode.icon === icon ? currentTheme.colors.menuHover : 'transparent',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  minHeight: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={key.toLowerCase()}
              >
                {icon || '∅'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notes - full width */}
      {editedNode.notes !== undefined && (
        <div style={cardStyle}>
          <label style={labelStyle}>
            <FormattedMessage id="nodeEditor.notes" defaultMessage="Notes" />
          </label>
          <textarea
            value={editedNode.notes}
            onChange={(e) => setEditedNode({ ...editedNode, notes: e.target.value })}
            style={{ ...inputBase, minHeight: '72px', resize: 'vertical' }}
            placeholder="Additional notes..."
          />
        </div>
      )}
    </div>
  );
};

// Style tab component
const StyleTab = ({ editedNode, setEditedNode, currentTheme }) => {
  // Responsive two-column cards using CSS grid via inline styles
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px'
  };
  const cardStyle = {
    padding: '12px',
    border: `1px solid ${currentTheme.colors.panelBorder}`,
    borderRadius: '8px',
    backgroundColor: currentTheme.colors.panelBackground,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={gridStyle}>
        {/* Colors */}
        <div style={cardStyle}>
          <label style={{
            display: 'block',
            marginBottom: '12px',
            color: currentTheme.colors.primaryText,
            fontSize: '14px',
            fontWeight: '600'
          }}>
            <FormattedMessage id="nodeEditor.color" defaultMessage="Color" />
          </label>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            color: currentTheme.colors.secondaryText,
            fontSize: '12px'
          }}>
            <span><FormattedMessage id="nodeEditor.colorHint" defaultMessage="Pick the node fill. Text adjusts automatically for contrast." /></span>
            {editedNode?.color && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border: `1px solid ${currentTheme.colors.panelBorder}`,
                    backgroundColor: editedNode.color || '#ffffff'
                  }} />
                  <span><FormattedMessage id="nodeEditor.colorFill" defaultMessage="Fill" /></span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '2px 8px',
                  borderRadius: 12,
                  border: `1px solid ${currentTheme.colors.inputBorder}`,
                  backgroundColor: currentTheme.colors.inputBackground
                }}>
                  <span style={{ color: getNodeTextColor(editedNode, { colors: currentTheme.colors }), fontWeight: 600 }}>Aa</span>
                  <span><FormattedMessage id="nodeEditor.colorText" defaultMessage="Text" /></span>
                </div>
              </div>
            )}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
            gap: '8px'
          }}>
            {Object.entries(NODE_COLORS).map(([key, color]) => (
              <button
                key={key}
                onClick={() => setEditedNode({ ...editedNode, color })}
                style={{
                  width: '40px',
                  height: '40px',
                  border: `3px solid ${editedNode.color === color ? currentTheme.colors.primaryButton : currentTheme.colors.panelBorder}`,
                  backgroundColor: color,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                title={NODE_COLOR_INFO[color]?.name || key}
              >
                {editedNode.color === color && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: NODE_COLOR_INFO[color]?.border || currentTheme.colors.primaryText,
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}>
                    ✓
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Shape */}
        <div style={cardStyle}>
          <label style={{
            display: 'block',
            marginBottom: '12px',
            color: currentTheme.colors.primaryText,
            fontSize: '14px',
            fontWeight: '600'
          }}>
            <FormattedMessage id="nodeEditor.shape" defaultMessage="Shape" />
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px'
          }}>
            {Object.entries(NODE_SHAPES).map(([key, shape]) => (
              <button
                key={key}
                onClick={() => setEditedNode({ ...editedNode, shape })}
                style={{
                  padding: '12px',
                  border: `2px solid ${editedNode.shape === shape ? currentTheme.colors.primaryButton : currentTheme.colors.panelBorder}`,
                  backgroundColor: editedNode.shape === shape ? currentTheme.colors.menuHover : 'transparent',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: currentTheme.colors.primaryText,
                  textAlign: 'center'
                }}
              >
                {key.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Typography (full width) */}
      <div style={cardStyle}>
        <label style={{
          display: 'block',
          marginBottom: '12px',
          color: currentTheme.colors.primaryText,
          fontSize: '14px',
          fontWeight: '600'
        }}>
          <FormattedMessage id="nodeEditor.fontSize" defaultMessage="Font Size" />
        </label>
        <input
          type="range"
          min="12"
          max="24"
          value={editedNode.fontSize || 16}
          onChange={(e) => setEditedNode({ ...editedNode, fontSize: parseInt(e.target.value) })}
          style={{ width: '100%' }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          color: currentTheme.colors.secondaryText,
          fontSize: '12px',
          marginTop: '4px'
        }}>
          <span>12px</span>
          <span>{editedNode.fontSize || 16}px</span>
          <span>24px</span>
        </div>
      </div>
    </div>
  );
};

// Tags tab component
const TagsTab = ({ editedNode, onTagToggle, currentTheme }) => {
  const availableTags = loadTags();
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px'
  };
  const cardStyle = {
    padding: '12px',
    border: `1px solid ${currentTheme.colors.panelBorder}`,
    borderRadius: '8px',
    backgroundColor: currentTheme.colors.panelBackground,
  };
  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    color: currentTheme.colors.primaryText,
    fontSize: '14px',
    fontWeight: '600'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={cardStyle}>
        <div style={{ color: currentTheme.colors.primaryText, fontSize: '14px' }}>
          <FormattedMessage id="nodeEditor.tagsHelp" defaultMessage="Tags help organize and categorize your nodes" />
        </div>
      </div>

      <div style={gridStyle}>
        <div style={cardStyle}>
          <label style={labelStyle}>
            <FormattedMessage id="nodeEditor.availableTags" defaultMessage="Available Tags" />
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {availableTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => onTagToggle(tag.id)}
                style={{
                  padding: '6px 12px',
                  border: `2px solid ${tag.color}`,
                  backgroundColor: hasTag(editedNode, tag.id) ? tag.color : 'transparent',
                  color: hasTag(editedNode, tag.id) ? 'white' : tag.color,
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <label style={labelStyle}>
            <FormattedMessage id="nodeEditor.selectedTags" defaultMessage="Selected Tags" />
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(editedNode.tags || []).map(tagId => {
              const tag = availableTags.find(t => t.id === tagId);
              if (tag) {
                return (
                  <span
                    key={tagId}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: tag.color,
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}
                  >
                    {tag.name}
                  </span>
                );
              }
              // Deleted tag: show greyed out with marker
              return (
                <span
                  key={tagId}
                  title={String(tagId)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: currentTheme.colors.menuHover,
                    color: currentTheme.colors.secondaryText,
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    border: `1px dashed ${currentTheme.colors.panelBorder}`
                  }}
                >
                  {`${tagId} (Deleted)`}
                </span>
              );
            })}
            {(editedNode.tags || []).length === 0 && (
              <span style={{ color: currentTheme.colors.secondaryText, fontSize: '13px' }}>
                <FormattedMessage id="nodeEditor.noTags" defaultMessage="No tags selected" />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Advanced tab component
const AdvancedTab = ({ editedNode, setEditedNode, currentTheme }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px'
  };
  const cardStyle = {
    padding: '12px',
    border: `1px solid ${currentTheme.colors.panelBorder}`,
    borderRadius: '8px',
    backgroundColor: currentTheme.colors.panelBackground,
  };
  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    color: currentTheme.colors.primaryText,
    fontSize: '14px',
    fontWeight: '600'
  };
  const roInput = {
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${currentTheme.colors.inputBorder}`,
    borderRadius: '4px',
    backgroundColor: currentTheme.colors.menuHover,
    color: currentTheme.colors.secondaryText,
    fontSize: '14px'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={gridStyle}>
        <div style={cardStyle}>
          <label style={labelStyle}>
            <FormattedMessage id="nodeEditor.nodeId" defaultMessage="Node ID" />
          </label>
          <input type="text" value={editedNode.id} readOnly style={roInput} />
        </div>

        {editedNode.createdAt && (
          <div style={cardStyle}>
            <label style={labelStyle}>
              <FormattedMessage id="nodeEditor.created" defaultMessage="Created" />
            </label>
            <input type="text" value={formatDate(editedNode.createdAt)} readOnly style={roInput} />
          </div>
        )}

        {editedNode.updatedAt && (
          <div style={cardStyle}>
            <label style={labelStyle}>
              <FormattedMessage id="nodeEditor.updated" defaultMessage="Last Updated" />
            </label>
            <input type="text" value={formatDate(editedNode.updatedAt)} readOnly style={roInput} />
          </div>
        )}

        <div style={cardStyle}>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: 0 }}>
            <input
              type="checkbox"
              checked={editedNode.isCollapsed || false}
              onChange={(e) => setEditedNode({ ...editedNode, isCollapsed: e.target.checked })}
            />
            <FormattedMessage id="nodeEditor.collapsed" defaultMessage="Collapse child nodes" />
          </label>
        </div>
      </div>
    </div>
  );
};

export default NodeEditor;
