import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import VertexCanvas from './VertexCanvas.jsx';
import { Minimap } from './components/panels/Minimap';
import { ContextMenu } from './components/menu/ContextMenu';
import Settings from './components/Settings';
import TagManager from './components/TagManager';
import PluginsManager from './components/PluginsManager';
import Search from './components/Search';
import ThemeSelector from './components/ThemeSelector';
import NodeEditor from './components/NodeEditor';
import HelpModal from './components/HelpModal';
import { MobileCanvasControls } from './components/mobile/MobileCanvasControls.jsx';
// Plugin system
import { PluginHost } from './plugins/PluginHost';
import { corePlugins } from './plugins';
import { mergePlugins } from './plugins/registry.js';
import { loadPluginPrefs, savePluginPrefs } from './utils/pluginUtils';
import { loadCustomPluginsFromStorage, addCustomPluginCode, removeStoredCustomPluginCodeById } from './utils/customPluginLoader';
import { collectPluginCommands, filterCommandsForContext } from './plugins/commands.js';
import { LocaleSelector } from './i18n/LocaleProvider';
import { useTheme } from './contexts/ThemeContext';
import { organizeLayout, detectCollisions } from './utils/layoutUtils';
import { APP_SHORTCUTS, formatShortcut } from './utils/shortcutUtils';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { updateNode } from './utils/nodeUtils';
import { createEnhancedNode } from './utils/nodeUtils';
import { addUndirectedEdge } from './utils/edgeUtils';
import { findNextConnectedNode } from './utils/navigationUtils';
import { useIsMobile } from './hooks/useIsMobile';

const OVERLAY_LAYOUT_STORAGE_KEY = 'vertex_overlay_layout';

const createEmptyOverlayLayout = () => ({ items: {}, slots: {} });

const loadOverlayLayoutOverrides = () => {
  if (typeof window === 'undefined') return createEmptyOverlayLayout();
  try {
    const raw = window.localStorage.getItem(OVERLAY_LAYOUT_STORAGE_KEY);
    if (!raw) return createEmptyOverlayLayout();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return createEmptyOverlayLayout();
    return {
      items: parsed.items && typeof parsed.items === 'object' ? parsed.items : {},
      slots: parsed.slots && typeof parsed.slots === 'object' ? parsed.slots : {},
    };
  } catch {
    return createEmptyOverlayLayout();
  }
};

const sanitizeOverlayLayoutPatch = (patch) => {
  if (!patch || typeof patch !== 'object') return createEmptyOverlayLayout();
  const result = {};
  if (patch.items && typeof patch.items === 'object') {
    result.items = {};
    Object.entries(patch.items).forEach(([key, value]) => {
      if (value === null) {
        result.items[key] = null;
      } else if (typeof value === 'object') {
        result.items[key] = { ...value };
      }
    });
  }
  if (patch.slots && typeof patch.slots === 'object') {
    result.slots = {};
    Object.entries(patch.slots).forEach(([key, value]) => {
      if (value === null) {
        result.slots[key] = null;
      } else if (typeof value === 'object') {
        result.slots[key] = { ...value };
      }
    });
  }
  return {
    items: result.items || undefined,
    slots: result.slots || undefined,
  };
};

const mergeOverlayLayout = (prev, patch) => {
  const next = sanitizeOverlayLayoutPatch(patch);
  let updated = prev;
  if (next.items) {
    updated = {
      ...updated,
      items: { ...updated.items },
    };
    Object.entries(next.items).forEach(([key, value]) => {
      if (value === null) {
        delete updated.items[key];
      } else {
        updated.items[key] = { ...(updated.items[key] || {}), ...value };
      }
    });
  }
  if (next.slots) {
    if (updated === prev) {
      updated = { ...updated }; // ensure new object before mutation
    }
    updated.slots = { ...updated.slots };
    Object.entries(next.slots).forEach(([key, value]) => {
      if (value === null) {
        delete updated.slots[key];
      } else {
        updated.slots[key] = { ...(updated.slots[key] || {}), ...value };
      }
    });
  }
  return updated;
};

// --- Menu Bar Component ---
const MenuBar = React.forwardRef(({
  onExport, onImport, onNew, onMakeCopy, onShowVersionHistory, onUndo, onRedo, onDelete, onAutoLayout, onSearch, onCenter, onZoomIn, onZoomOut, onResetZoom, onShowThemes,
  nodes, setNodes, setUndoStack, setRedoStack, setSelectedNodeId, canvasRef,
  showMinimap, setShowMinimap, showNodeInfoPanel, onToggleNodeInfoPanel,
  onToggleHelp, isHelpVisible,
  fileInputRef,
  graphId,
  graphTitle,
  setGraphTitle,
  pluginPrefs,
  onTogglePlugin,
  availablePlugins,
  customPlugins,
  onImportCustomPlugin,
  onRemoveCustomPlugin,
  maxLevel,
  onChangeMaxLevel,
}, ref) => {
  const isMobile = useIsMobile();
  const localMenuBarRef = useRef(null);

  // Merge refs
  React.useImperativeHandle(ref, () => localMenuBarRef.current);
  const menuRefs = {
    file: useRef(null),
    edit: useRef(null),
    view: useRef(null),
    library: useRef(null),
    settings: useRef(null),
    help: useRef(null),
  };
  const [openMenu, setOpenMenu] = useState(null); // 'file' | 'edit' | 'view' | 'settings' | null
  const [alignRight, setAlignRight] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('all');
  const [showTagManager, setShowTagManager] = useState(false);
  const [showPluginsManager, setShowPluginsManager] = useState(false);
  const intl = useIntl();
  const { currentTheme, toggleTheme } = useTheme();
  const [helpModal, setHelpModal] = useState({ open: false, titleId: null, messageId: null });
  const [graphIdCopied, setGraphIdCopied] = useState(false);

  useEffect(() => {
    if (!graphIdCopied) return undefined;
    const timeout = setTimeout(() => setGraphIdCopied(false), 2200);
    return () => clearTimeout(timeout);
  }, [graphIdCopied]);

  const handleCopyGraphId = useCallback(() => {
    const text = graphId ?? '';
    const fallbackCopy = () => {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
      } catch (fallbackError) {
        console.error('Graph ID copy fallback failed', fallbackError);
        return false;
      }
    };

    const attempt = navigator?.clipboard?.writeText
      ? navigator.clipboard.writeText(text).then(() => true).catch((err) => {
          console.warn('Clipboard API copy failed, falling back', err);
          return fallbackCopy();
        })
      : Promise.resolve(fallbackCopy());

    attempt.then((success) => {
      if (success) setGraphIdCopied(true);
    });
  }, [graphId]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!openMenu) return;

    const handleClickOutside = (event) => {
      if (localMenuBarRef.current && !localMenuBarRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenu]);

  const menuDropdown = (type, items) => openMenu === type && (
    <div className="menu-dropdown" style={{
      position: 'absolute',
      top: 'calc(100% + 4px)',
      left: alignRight[type] ? 'auto' : 0,
      right: alignRight[type] ? 0 : 'auto',
      // Ensure above floating FABs/help on mobile
      zIndex: 10140
    }}>{items}</div>
  );

  // Dynamically align dropdowns to the right edge of their trigger if they would overflow the viewport
  useEffect(() => {
    if (!openMenu) return;
    const ref = menuRefs[openMenu]?.current;
    if (!ref) return;
    const measure = () => {
      const dropdown = ref.querySelector('.menu-dropdown');
      const triggerRect = ref.getBoundingClientRect();
      const ddRect = dropdown?.getBoundingClientRect();
      const estimatedWidth = ddRect?.width || 260; // match menu min width
      const willOverflowRight = triggerRect.left + estimatedWidth + 8 > window.innerWidth;
      setAlignRight(prev => ({ ...prev, [openMenu]: !!willOverflowRight }));
    };
    // Measure after render and on resize
    const r = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => { cancelAnimationFrame(r); window.removeEventListener('resize', measure); };
  }, [openMenu]);

  // Build a merged shortcut display from APP_SHORTCUTS by description
  const getShortcut = (description, options = {}) => {
    const entries = APP_SHORTCUTS.filter(s => s.description === description);
    if (entries.length === 0) return '';
    const preferKey = options.preferKey; // e.g., '+' vs '=' for Zoom In
    // Detect cmd/ctrl variants with same non-cmd/ctrl modifiers
    const normMods = (mods) => (mods || []).filter(m => m !== 'cmd' && m !== 'ctrl').sort().join('+');
    const groups = new Map();
    entries.forEach(sc => {
      const other = normMods(sc.modifiers || []);
      const key = `${other}`; // group by other modifiers only
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(sc);
    });
    // Pick first group
    const group = Array.from(groups.values())[0];
    const hasCmd = group.some(sc => (sc.modifiers || []).includes('cmd'));
    const hasCtrl = group.some(sc => (sc.modifiers || []).includes('ctrl'));
    const otherMods = (group[0].modifiers || []).filter(m => m !== 'cmd' && m !== 'ctrl');
    if (hasCmd && hasCtrl) {
      // Use a representative key (use preferred if provided)
      const keyChar = preferKey || group[0].key;
      const cmdStr = formatShortcut({ key: keyChar, modifiers: ['cmd', ...otherMods] });
      const ctrlStr = formatShortcut({ key: keyChar, modifiers: ['ctrl', ...otherMods] });
      return `${cmdStr} / ${ctrlStr}`;
    }
    // Otherwise, pick preferred key or first
    let chosen = group[0];
    if (preferKey) {
      const found = group.find(g => g.key === preferKey);
      if (found) chosen = found;
    }
    return formatShortcut({ key: chosen.key, modifiers: chosen.modifiers || [] });
  };
  return (
    <>
      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
          pluginPrefs={pluginPrefs}
          onTogglePlugin={onTogglePlugin}
          initialTab={settingsTab}
          maxLevel={maxLevel}
          onMaxLevelChange={onChangeMaxLevel}
        />
      )}
      {showTagManager && <TagManager onClose={() => setShowTagManager(false)} />}
      {showPluginsManager && (
        <PluginsManager
          onClose={() => setShowPluginsManager(false)}
          pluginPrefs={pluginPrefs}
          onTogglePlugin={onTogglePlugin}
          availablePlugins={availablePlugins}
          customPlugins={customPlugins}
          onImportCustomPlugin={onImportCustomPlugin}
          onRemoveCustomPlugin={onRemoveCustomPlugin}
        />
      )}
      <HelpModal
        open={helpModal.open}
        titleId={helpModal.titleId}
        messageId={helpModal.messageId}
        onClose={() => setHelpModal({ open: false, titleId: null, messageId: null })}
      />
      {/* Header above menus: site title + graph title and ID */}
      <div style={{
        width: '100%',
        background: currentTheme.colors.menuBackground,
        borderBottom: `1px solid ${currentTheme.colors.menuBorder}`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 12px',
        height: 44,
        zIndex: 210,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0
      }}>
        <div style={{ fontWeight: 700, fontSize: isMobile ? 16 : 18, color: currentTheme.colors.menuText }}>🧠 Vertex Lab</div>
        <input
          aria-label={intl.formatMessage({ id: 'graph.title', defaultMessage: 'Graph title' })}
          value={graphTitle}
          onChange={(e) => setGraphTitle(e.target.value)}
          placeholder={intl.formatMessage({ id: 'graph.untitled', defaultMessage: 'Untitled' })}
          style={{
            height: 24,
            borderRadius: 6,
            border: `1px solid ${currentTheme.colors.inputBorder}`,
            background: currentTheme.colors.inputBackground,
            color: currentTheme.colors.primaryText,
            padding: '0 8px',
            outline: 'none'
          }}
        />
        {!isMobile && (
          <button
            type="button"
            onClick={handleCopyGraphId}
            style={{
              fontSize: 12,
              color: currentTheme.colors.secondaryText,
              opacity: graphIdCopied ? 0.95 : 0.6,
              background: graphIdCopied ? `${currentTheme.colors.primaryButton}1a` : 'transparent',
              border: graphIdCopied ? `1px solid ${currentTheme.colors.primaryButton}` : '1px solid transparent',
              borderRadius: 999,
              padding: '2px 10px',
              cursor: 'pointer',
              transition: 'background 120ms ease, border-color 120ms ease, opacity 120ms ease',
            }}
            title={graphIdCopied
              ? intl.formatMessage({ id: 'graphId.copied', defaultMessage: 'Graph ID copied to clipboard' })
              : intl.formatMessage({ id: 'graphId.copy', defaultMessage: 'Copy graph ID to clipboard' })}
          >
            {graphIdCopied
              ? intl.formatMessage({ id: 'graphId.copiedShort', defaultMessage: 'ID copied' })
              : intl.formatMessage({ id: 'graphId.label', defaultMessage: 'ID: {id}' }, { id: graphId })}
          </button>
        )}
      </div>
      <nav ref={localMenuBarRef} style={{
        width: '100%',
        background: currentTheme.colors.menuBackground,
        borderBottom: `1px solid ${currentTheme.colors.menuBorder}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        height: 36,
        // Raise above floating help/FABs so dropdowns are not covered on mobile
        zIndex: 10130,
        position: 'fixed',
        top: 44,
        left: 0,
        right: 0
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 8, flexWrap: 'nowrap', overflow: 'visible', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
        <div ref={menuRefs.file} style={{ cursor: 'pointer', position: 'relative' }}>
          <span className="menu-trigger" onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('File menu clicked');
            setOpenMenu(openMenu === 'file' ? null : 'file');
          }}><FormattedMessage id="menu.file" defaultMessage="File" /></span>
          {menuDropdown('file', <>
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('New clicked');
                onNew();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="file.new" defaultMessage="New" />
              <span className="menu-shortcut">{getShortcut('New Diagram')}</span>
            </div>
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Make a copy clicked');
                onMakeCopy();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="file.makeCopy" defaultMessage="Make a Copy" />
              <span className="menu-shortcut">{getShortcut('Make a Copy')}</span>
            </div>
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Version history clicked');
                onShowVersionHistory();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="file.versionHistory" defaultMessage="Version History" />
            </div>
            <div className="menu-separator" />
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Export JSON clicked');
                onExport();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="file.export" defaultMessage="Export JSON" />
              <span className="menu-shortcut">{getShortcut('Export JSON')}</span>
            </div>
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Export PNG clicked');
                if (canvasRef.current?.exportAsPNG) {
                  canvasRef.current.exportAsPNG();
                }
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="file.exportPng" defaultMessage="Export PNG" />
              <span className="menu-shortcut">{getShortcut('Export PNG')}</span>
            </div>
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Import JSON clicked');
                fileInputRef.current.click();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="file.import" defaultMessage="Import JSON" />
              <span className="menu-shortcut">{getShortcut('Import JSON')}</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={e => {
                console.log('File input change event');
                const file = e.target.files[0];
                if (!file) {
                  console.log('No file selected');
                  return;
                }
                console.log('Reading file:', file.name);
                const reader = new FileReader();
                reader.onload = evt => {
                  try {
                    const content = evt.target.result;
                    console.log('File content:', content);
                    const data = JSON.parse(content);
                    console.log('Parsed data:', data);
                    if (!Array.isArray(data)) {
                      throw new Error('Imported data must be an array');
                    }
                    if (!data.every(n => n.id && typeof n.x === 'number' && typeof n.y === 'number' && typeof n.label === 'string')) {
                      throw new Error('Invalid node format');
                    }
                    console.log('Importing valid data:', data.length, 'nodes');
                    onImport(data);
                  } catch (error) {
                    console.error('Import error:', error);
                    alert(`Import failed: ${error.message}`);
                  }
                };
                reader.onerror = error => {
                  console.error('File read error:', error);
                  alert('Failed to read file');
                };
                reader.readAsText(file);
                e.target.value = '';
              }}
            />
          </>)}
        </div>
        
        <div ref={menuRefs.edit} style={{ cursor: 'pointer', position: 'relative' }}>
          <span className="menu-trigger" onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Edit menu clicked');
            setOpenMenu(openMenu === 'edit' ? null : 'edit');
          }}><FormattedMessage id="menu.edit" defaultMessage="Edit" /></span>
          {menuDropdown('edit', <>
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Undo clicked');
                onUndo();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="edit.undo" defaultMessage="Undo" />
              <span className="menu-shortcut">{getShortcut('Undo')}</span>
            </div>
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Redo clicked');
                onRedo();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="edit.redo" defaultMessage="Redo" />
              <span className="menu-shortcut">{getShortcut('Redo')}</span>
            </div>
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Delete clicked');
                onDelete();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="edit.delete" defaultMessage="Delete" />
              <span className="menu-shortcut">{getShortcut('Delete Selected')}</span>
            </div>
            <div className="menu-separator" />
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Auto Layout clicked');
                onAutoLayout();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="edit.autoLayout" defaultMessage="Auto Layout" />
              <span className="menu-shortcut">⌘L</span>
            </div>
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Search clicked');
                onSearch();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="edit.search" defaultMessage="Search" />
              <span className="menu-shortcut">⌘F</span>
            </div>
          </>)}
        </div>
        <div ref={menuRefs.view} style={{ cursor: 'pointer', position: 'relative' }}>
          <span className="menu-trigger" onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('View menu clicked');
            setOpenMenu(openMenu === 'view' ? null : 'view');
          }}><FormattedMessage id="menu.view" defaultMessage="View" /></span>
          {menuDropdown('view', <>
            {/** helper for shortcut display */}
            {(() => { return null; })()}
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Center clicked (fit to view)');
                onCenter();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="view.center" defaultMessage="Center" />
              <span className="menu-shortcut">{getShortcut('Center Diagram', { preferKey: 'c' })}</span>
            </div>
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Zoom In clicked');
                onZoomIn();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="view.zoomIn" defaultMessage="Zoom In" />
              <span className="menu-shortcut">{getShortcut('Zoom In', { preferKey: '+' })}</span>
            </div>
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Zoom Out clicked');
                onZoomOut();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="view.zoomOut" defaultMessage="Zoom Out" />
              <span className="menu-shortcut">{getShortcut('Zoom Out', { preferKey: '-' })}</span>
            </div>
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Reset Zoom clicked');
                onResetZoom();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="view.resetZoom" defaultMessage="Reset Zoom" />
              <span className="menu-shortcut">{getShortcut('Reset Zoom', { preferKey: '0' })}</span>
            </div>
            <div className="menu-separator" />
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMinimap(!showMinimap);
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="view.showMinimap" defaultMessage="Show Minimap" />
              <span className="menu-shortcut">{formatShortcut({ key: 'm', modifiers: [] })}</span>
              {showMinimap && <span style={{ marginLeft: 8 }}>✓</span>}
            </div>
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleNodeInfoPanel();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="view.showNodeInfoPanel" defaultMessage="Show Node Info" />
              <span className="menu-shortcut">{formatShortcut({ key: 'i', modifiers: ['cmd'] })}</span>
              {showNodeInfoPanel && <span style={{ marginLeft: 8 }}>✓</span>}
            </div>
          </>)}
        </div>
        <div ref={menuRefs.library} style={{ cursor: 'pointer', position: 'relative' }}>
          <span className="menu-trigger" onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Library menu clicked');
            setOpenMenu(openMenu === 'library' ? null : 'library');
          }}><FormattedMessage id="menu.library" defaultMessage="Library" /></span>
          {menuDropdown('library', <>
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Save to Library clicked');
                const name = window.prompt(intl.formatMessage({ id: 'library.enterName' }));
                if (name) {
                  const library = JSON.parse(localStorage.getItem('vertex_library') || '{}');
                  library[name] = nodes;
                  localStorage.setItem('vertex_library', JSON.stringify(library));
                  alert(intl.formatMessage({ id: 'library.saved' }));
                }
                setOpenMenu(null);
              }}
            ><FormattedMessage id="library.save" defaultMessage="Save to Library" /></div>
            <div className="menu-separator" />
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Load from Library clicked');
                const library = JSON.parse(localStorage.getItem('vertex_library') || '{}');
                const templates = Object.keys(library);
                if (templates.length === 0) {
                  alert(intl.formatMessage({ id: 'library.noTemplates' }));
                  return;
                }
                const name = window.prompt(intl.formatMessage(
                  { id: 'library.availableTemplates' }) + '\n' + templates.join('\n')
                );
                if (name && library[name]) {
                  setNodes([...library[name]]);
                  setUndoStack([]);
                  setRedoStack([]);
                  setSelectedNodeId(null);
                  if (canvasRef.current?.center) {
                    canvasRef.current.center();
                  }
                } else if (name) {
                  alert(intl.formatMessage({ id: 'library.notFound' }));
                }
                setOpenMenu(null);
              }}
            ><FormattedMessage id="library.load" defaultMessage="Load from Library" /></div>
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Delete from Library clicked');
                const library = JSON.parse(localStorage.getItem('vertex_library') || '{}');
                const templates = Object.keys(library);
                if (templates.length === 0) {
                  alert(intl.formatMessage({ id: 'library.noTemplates' }));
                  return;
                }
                const name = window.prompt(intl.formatMessage(
                  { id: 'library.deletePrompt' }) + '\n\n' + 
                  intl.formatMessage({ id: 'library.availableTemplates' }) + '\n' + 
                  templates.join('\n')
                );
                if (name && library[name]) {
                  delete library[name];
                  localStorage.setItem('vertex_library', JSON.stringify(library));
                  alert(intl.formatMessage({ id: 'library.deleted' }));
                } else if (name) {
                  alert(intl.formatMessage({ id: 'library.notFound' }));
                }
                setOpenMenu(null);
              }}
            ><FormattedMessage id="library.delete" defaultMessage="Delete from Library" /></div>
          </>)}
        </div>
        <div ref={menuRefs.settings} style={{ cursor: 'pointer', position: 'relative' }}>
          <span className="menu-trigger" onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Settings menu clicked');
            setOpenMenu(openMenu === 'settings' ? null : 'settings');
          }}><FormattedMessage id="menu.settings" defaultMessage="Settings" /></span>
          {menuDropdown('settings', <>
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Keyboard Shortcuts clicked');
                setSettingsTab('all');
                setShowSettings(true);
                setOpenMenu(null);
              }}
            >
              <span><FormattedMessage id="settings.shortcuts" defaultMessage="Keyboard Shortcuts" /></span>
              <span className="menu-shortcut">?</span>
            </div>
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Plugins clicked');
                setShowPluginsManager(true);
                setOpenMenu(null);
              }}
            >
              <span><FormattedMessage id="settings.plugins" defaultMessage="Plugins" /></span>
            </div>
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Tag Manager clicked');
                setShowTagManager(true);
                setOpenMenu(null);
              }}
            >
              <span><FormattedMessage id="settings.tagsManager" defaultMessage="Tag Manager" /></span>
            </div>
            <div className="menu-separator" />
            <div className="menu-section">
              <FormattedMessage id="settings.language" defaultMessage="Language" />
              <LocaleSelector />
            </div>
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Toggle Dark Mode clicked');
                toggleTheme();
                setOpenMenu(null);
              }}
            ><FormattedMessage id="view.toggleTheme" defaultMessage="Toggle Theme" /></div>
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Choose Theme clicked');
                onShowThemes();
                setOpenMenu(null);
              }}
            ><FormattedMessage id="view.chooseTheme" defaultMessage="Choose Theme" /></div>
          </>)}
        </div>
        <div ref={menuRefs.help} style={{ cursor: 'pointer', position: 'relative' }}>
          <span className="menu-trigger" onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Help menu clicked');
            setOpenMenu(openMenu === 'help' ? null : 'help');
          }}><FormattedMessage id="menu.help" defaultMessage="Help" /></span>
          {menuDropdown('help', <>
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation();
                setHelpModal({ open: true, titleId: 'help.documentation', messageId: 'help.documentation.desc' });
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="help.documentation" defaultMessage="Documentation" />
            </div>
            <div className="menu-separator" />
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation();
                setHelpModal({ open: true, titleId: 'help.community', messageId: 'help.community.desc' });
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="help.community" defaultMessage="Help Community" />
            </div>
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation();
                setHelpModal({ open: true, titleId: 'help.feedback', messageId: 'help.feedback.desc' });
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="help.feedback" defaultMessage="Send Feedback" />
            </div>
            <div
              className="menu-item"
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation();
                setHelpModal({ open: true, titleId: 'help.report', messageId: 'help.report.desc' });
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="help.report" defaultMessage="Report a Problem" />
            </div>
          </>)}
        </div>
      </div>
    </nav>
    </>
  );
});

/**
 * React Version of the Vue Mind-Mapping Tool UI
 *
 * This file is a translation of the original Vue.js application into React.
 * All components have been recreated as functional React components using hooks.
 */

// --- Reusable Components ---

/**
 * Component: Dialog
 * A feature-rich, reusable dialog/modal component.
 * @param {object} props - Component props.
 * @param {boolean} props.visible - Whether the dialog is visible.
 * @param {function} props.onClose - Function to call when the dialog should close.
 * @param {string} props.title - The title of the dialog.
 * @param {React.Node} props.children - The content to display inside the dialog body.
 * @param {string} [props.width="300px"] - The width of the dialog.
 * @param {string} [props.maxWidth=""] - The max-width of the dialog.
 * @param {string} [props.top="50%"] - The vertical position of the dialog.
 */
const Dialog = ({ visible, onClose, title, children, width = "300px", maxWidth = "", top = "50%" }) => {
  const dialogContentRef = useRef(null);

  // Effect to handle side-effects when visibility changes
  useEffect(() => {
    // Function to handle Escape key press
    const handleKeyup = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (visible) {
      // When dialog opens, listen for Escape key and lock body scroll
      window.addEventListener('keyup', handleKeyup);
      document.body.classList.add('lock-scroll');
    }

    // Cleanup function to run when component unmounts or visibility changes
    return () => {
      window.removeEventListener('keyup', handleKeyup);
      document.body.classList.remove('lock-scroll');
    };
  }, [visible, onClose]);

  if (!visible) {
    return null;
  }

  // Closes the dialog if the click is on the backdrop itself
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="dialog_wrapper" onClick={handleBackdropClick}>
      <div
        ref={dialogContentRef}
        className="dialog_content"
        style={{ width, top, maxWidth }}
      >
        <div className="dialog_header">
          <span style={{ fontSize: '18px' }}>{title}</span>
          <div className="close-btn" onClick={onClose}>
            ✔
          </div>
        </div>
        <div className="dialog_body">
          {children}
        </div>
      </div>
    </div>
  );
};




/**
 * Component: MainHeader (Placeholder)
 * A placeholder for the asynchronously loaded header in the original app.
 */
const MainHeader = () => {
    // In a real app, this would be a more complex component.
    return <header> {/* Header content would go here */} </header>;
};


// --- Main Application Component ---

/**
 * The main application component.
 */
function App({ graphId = 'default' }) {
  const intl = useIntl();
  const isMobile = useIsMobile();
  const { currentTheme } = useTheme();
  const menuBarRef = useRef(null);
  const [overlayLayoutOverrides, setOverlayLayoutOverrides] = useState(() => loadOverlayLayoutOverrides());
  const [pluginOverlays, setPluginOverlays] = useState([]);
  const [menuBarBottom, setMenuBarBottom] = useState(80);


  // Undo/redo stacks
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Canvas ref for view actions
  const canvasRef = useRef();
  const initialFitDoneRef = useRef(false);
  const lastFitSizeRef = useRef({ width: 0, height: 0 });
  const updateOverlayLayout = useCallback((patch) => {
    if (!patch) return;
    setOverlayLayoutOverrides(prev => {
      const nextPatch = typeof patch === 'function' ? patch(prev) : patch;
      if (!nextPatch) return prev;
      const merged = mergeOverlayLayout(prev, nextPatch);
      return merged;
    });
  }, []);

  const resetOverlayLayout = useCallback(() => {
    setOverlayLayoutOverrides(createEmptyOverlayLayout());
    if (typeof window !== 'undefined') {
      try { window.localStorage.removeItem(OVERLAY_LAYOUT_STORAGE_KEY); } catch {}
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (
        (!overlayLayoutOverrides.items || Object.keys(overlayLayoutOverrides.items).length === 0) &&
        (!overlayLayoutOverrides.slots || Object.keys(overlayLayoutOverrides.slots).length === 0)
      ) {
        window.localStorage.removeItem(OVERLAY_LAYOUT_STORAGE_KEY);
      } else {
        window.localStorage.setItem(OVERLAY_LAYOUT_STORAGE_KEY, JSON.stringify(overlayLayoutOverrides));
      }
    } catch {}
  }, [overlayLayoutOverrides]);

  // Create file input ref
  const fileInputRef = useRef();

  // Graph-specific storage key helper
  const graphKey = useCallback((suffix) => (
    graphId === 'default' ? `vertex_${suffix}` : `vertex_graph_${graphId}_${suffix}`
  ), [graphId]);

  // Graph title state
  const [graphTitle, setGraphTitle] = useState(() => {
    try { return localStorage.getItem(graphKey('title')) || 'Untitled'; } catch { return 'Untitled'; }
  });
  useEffect(() => {
    try { localStorage.setItem(graphKey('title'), graphTitle); } catch {}
  }, [graphTitle, graphKey]);

  // Minimap and viewport state
  const [showMinimap, setShowMinimap] = useState(() => {
    const saved = localStorage.getItem('vertex_show_minimap');
    return saved !== null ? saved === 'true' : false;
  });
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 600 });

  // Save minimap visibility preference
  useEffect(() => {
    localStorage.setItem('vertex_show_minimap', showMinimap);
  }, [showMinimap]);

  // On mobile, hide minimap by default unless user explicitly enabled it
  useEffect(() => {
    const saved = localStorage.getItem('vertex_show_minimap');
    if (isMobile && saved === null && showMinimap) {
      setShowMinimap(false);
    }
  }, [isMobile]);

  // Diagram state with localStorage persistence
  const [nodes, setNodes] = useState(() => {
    const savedNodes = localStorage.getItem(graphKey('nodes'));
    if (savedNodes) {
      try {
        const parsedNodes = JSON.parse(savedNodes);
        // Upgrade existing nodes to support enhanced properties
        return parsedNodes.map(node => createEnhancedNode(node));
      } catch (e) {
        console.error('Failed to parse saved nodes:', e);
      }
    }
    // Default initial state if no saved state exists
    return [
      createEnhancedNode({ id: 1, label: intl.formatMessage({ id: 'node.centralTopic' }), x: 400, y: 300, level: 0 }),
      createEnhancedNode({ id: 2, label: `${intl.formatMessage({ id: 'node.branch' })} 1`, x: 250, y: 200, level: 1 }),
      createEnhancedNode({ id: 3, label: `${intl.formatMessage({ id: 'node.branch' })} 2`, x: 550, y: 200, level: 1 }),
      createEnhancedNode({ id: 4, label: `${intl.formatMessage({ id: 'node.branch' })} 3`, x: 250, y: 400, level: 1 }),
      createEnhancedNode({ id: 5, label: `${intl.formatMessage({ id: 'node.branch' })} 4`, x: 550, y: 400, level: 1 }),
    ];
  });
  const [selectedNodeIds, setSelectedNodeIds] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null); // Keep for backward compatibility
  const [edges, setEdges] = useState(() => {
    try {
      const saved = localStorage.getItem(graphKey('edges'));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    // Derive from parentId for legacy diagrams
    try {
      const savedNodes = localStorage.getItem(graphKey('nodes'));
      if (savedNodes) {
        const parsedNodes = JSON.parse(savedNodes);
        if (Array.isArray(parsedNodes)) {
          return [];
        }
      }
    } catch {}
    return [];
  });
  // Shift+E progressive toggle pointer (one pair per press)
  const [shiftPairIndex, setShiftPairIndex] = useState(0);
  const [shiftPairSelKey, setShiftPairSelKey] = useState('');

  // Do not localize existing node titles on language switch to avoid modifying user content

  // Help panel visibility state
  const [isHelpVisible, setIsHelpVisible] = useState(false);

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState([]);
  const altNavigationStateRef = useRef({
    active: false,
    previewId: null,
    previousHighlight: [],
  });

  // Theme state
  const [showThemes, setShowThemes] = useState(false);

  // Node editor state
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState(null);
  // Plugins (custom + merged)
  const [customPlugins, setCustomPlugins] = useState([]);
  const [allPlugins, setAllPlugins] = useState(corePlugins);
  // Plugin preferences
  const [pluginPrefs, setPluginPrefs] = useState(() => loadPluginPrefs(corePlugins));
  const prevPluginPrefsRef = useRef(pluginPrefs);
  const [pluginTips, setPluginTips] = useState([]);
  useEffect(() => {
    (async () => {
      const loaded = await loadCustomPluginsFromStorage();
      setCustomPlugins(loaded);
      setAllPlugins(mergePlugins(corePlugins, loaded));
      setPluginPrefs(prev => {
        const next = { ...loadPluginPrefs(mergePlugins(corePlugins, loaded)), ...prev };
        savePluginPrefs(next);
        return next;
      });
    })();
  }, []);
  const setPluginEnabled = useCallback((pluginId, enabled) => {
    setPluginPrefs(prev => {
      const next = { ...prev, [pluginId]: enabled };
      savePluginPrefs(next);
      return next;
    });
  }, []);

  // (moved below activePlugins) Show a one-time tip when a plugin gets enabled

  const importCustomPlugin = useCallback(async (code) => {
    try {
      const plugin = await addCustomPluginCode(code);
      setCustomPlugins(prev => {
        const exists = prev.some(p => p.id === plugin.id);
        return exists ? prev : [...prev, plugin];
      });
      setAllPlugins(prev => mergePlugins(prev, [plugin]));
      setPluginEnabled(plugin.id, true);
    } catch (e) {
      console.error('Failed to import plugin:', e);
      alert('Failed to import plugin. Ensure it exports a valid plugin object.');
    }
  }, [setPluginEnabled]);

  const removeCustomPlugin = useCallback((pluginId) => {
    removeStoredCustomPluginCodeById(pluginId);
    setCustomPlugins(prev => prev.filter(p => p.id !== pluginId));
    setAllPlugins(prev => prev.filter(p => p.id !== pluginId));
    setPluginPrefs(prev => {
      const next = { ...prev };
      delete next[pluginId];
      savePluginPrefs(next);
      return next;
    });
  }, []);

  // (moved below activePlugins) Show a one-time tip when a plugin gets enabled

  // Node info panel state
  const [showNodeInfoPanel, setShowNodeInfoPanel] = useState(() => {
    const saved = localStorage.getItem('vertex_show_node_info_panel');
    return saved !== null ? saved === 'true' : false;
  });

  // Responsive canvas size
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  useEffect(() => {
    const compute = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const sidePadding = 0;
      const rightPanel = showNodeInfoPanel ? 320 : 0;
      const topNav = menuBarRef.current?.offsetHeight || 0;
      const verticalMargin = 0;
      const width = Math.max(isMobile ? 320 : 600, W - sidePadding - rightPanel);
      const height = Math.max(isMobile ? 300 : 400, H - topNav - verticalMargin);
      setCanvasSize({ width, height });
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [showNodeInfoPanel, isMobile]);

  useEffect(() => {
    initialFitDoneRef.current = false;
    lastFitSizeRef.current = { width: 0, height: 0 };
  }, [graphId]);

  useEffect(() => {
    if (!Array.isArray(nodes) || nodes.length === 0) return;
    if (!canvasRef.current?.fitToView) return;

    const hasInteracted = canvasRef.current?.hasUserInteracted?.() ?? false;
    const size = { width: canvasSize.width, height: canvasSize.height };
    const lastSize = lastFitSizeRef.current;
    const sizeChanged = Math.abs(size.width - lastSize.width) > 80 || Math.abs(size.height - lastSize.height) > 80;

    if (initialFitDoneRef.current && (!sizeChanged || hasInteracted)) {
      return;
    }

    const runFit = () => {
      if (!canvasRef.current?.fitToView) return;
      canvasRef.current.fitToView({ markInteraction: false });
      initialFitDoneRef.current = true;
      lastFitSizeRef.current = size;
      canvasRef.current?.resetInteractionFlag?.();
    };

    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      const raf = window.requestAnimationFrame(runFit);
      return () => {
        if (typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
          window.cancelAnimationFrame(raf);
        }
      };
    }

    const timeout = setTimeout(runFit, 16);
    return () => clearTimeout(timeout);
  }, [nodes, canvasSize.width, canvasSize.height, graphId]);

  // Context menu state
  const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0, target: null, pointerType: 'mouse' });
  const activePlugins = useMemo(
    () => allPlugins.filter(p => (pluginPrefs[p.id] ?? true)),
    [allPlugins, pluginPrefs]
  );
  const pluginCommands = React.useMemo(() => collectPluginCommands(activePlugins), [activePlugins]);

  // Show a one-time tip when a plugin gets enabled (after activePlugins is defined)
  useEffect(() => {
    const prev = prevPluginPrefsRef.current || {};
    activePlugins.forEach(p => {
      const was = prev[p.id];
      const now = pluginPrefs[p.id] ?? true;
      if (now && !was) {
        try {
          const seen = localStorage.getItem('vertex_plugin_seen_' + p.id) === 'true';
          if (!seen) {
            setPluginTips(tips => tips.some(t => t.id === p.id) ? tips : [...tips, { id: p.id, name: p.name || p.id }]);
          }
        } catch {}
      }
    });
    prevPluginPrefsRef.current = pluginPrefs;
  }, [pluginPrefs, activePlugins]);

  // Save node info panel visibility preference
  useEffect(() => {
    localStorage.setItem('vertex_show_node_info_panel', showNodeInfoPanel);
  }, [showNodeInfoPanel]);

  // Handler functions wrapped in useCallback
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) {
      console.log('Cannot undo - stack empty');
      return;
    }
    console.log('Undo:', {
      undoStackSize: undoStack.length,
      redoStackSize: redoStack.length,
      currentNodes: nodes.length
    });
    const prevNodes = undoStack[undoStack.length - 1];
    setNodes([...prevNodes]);
    setRedoStack(rstack => [[...nodes], ...rstack]);
    setUndoStack(stack => stack.slice(0, -1));
  }, [undoStack, redoStack, nodes]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) {
      console.log('Cannot redo - stack empty');
      return;
    }
    console.log('Redo:', {
      undoStackSize: undoStack.length,
      redoStackSize: redoStack.length,
      currentNodes: nodes.length
    });
    const nextNodes = redoStack[0];
    setNodes([...nextNodes]);
    setUndoStack(stack => [...stack, [...nodes]]);
    setRedoStack(stack => stack.slice(1));
  }, [undoStack, redoStack, nodes]);

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(nodes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    const filename = `graph-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.json`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }, [nodes]);

  const handleImport = useCallback((data) => {
    console.log('handleImport called with:', data);
    const importedNodes = Array.isArray(data) ? data : data?.nodes;
    const importedEdges = Array.isArray(data) ? null : data?.edges;
    if (Array.isArray(importedNodes) &&
        importedNodes.every(n => n.id && typeof n.x === 'number' && typeof n.y === 'number' && typeof n.label === 'string')) {
      console.log('Importing valid diagram data:', importedNodes.length, 'nodes');
      const nodeMap = new Map(importedNodes.map(n => [n.id, n]));
      const levelCache = new Map();
      const computeLevel = (node) => {
        if (!node) return 0;
        if (node.level != null) return Number(node.level) || 0;
        if (levelCache.has(node.id)) return levelCache.get(node.id);
        if (node.parentId == null) {
          levelCache.set(node.id, 0);
          return 0;
        }
        const parent = nodeMap.get(node.parentId);
        const level = computeLevel(parent) + 1;
        levelCache.set(node.id, level);
        return level;
      };
      const upgraded = importedNodes.map(node => {
        const level = computeLevel(node);
        return createEnhancedNode({ ...node, level, parentId: null });
      });
      setNodes(upgraded);
      setEdges(Array.isArray(importedEdges) ? importedEdges : []);
      setUndoStack([]);
      setRedoStack([]);
      setSelectedNodeId(null);
      setTimeout(() => {
        if (canvasRef.current?.center) {
          console.log('Centering view on imported diagram');
          canvasRef.current.center();
        }
      }, 0);
    } else {
      console.error('Invalid diagram data:', data);
      alert('Invalid diagram data: Must contain nodes with id, label, x, y properties');
    }
  }, [canvasRef]);

  // Robust file-open handler for imports (keyboard-safe across browsers)
  const handleImportRequest = useCallback(async () => {
    try {
      if (window.showOpenFilePicker) {
        const [handle] = await window.showOpenFilePicker({
          multiple: false,
          types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
        });
        const file = await handle.getFile();
        const text = await file.text();
        const data = JSON.parse(text);
        handleImport(data);
        return;
      }
    } catch (err) {
      console.warn('showOpenFilePicker failed or was cancelled:', err);
      // fall through to legacy input
    }

    const ref = fileInputRef.current;
    if (ref && typeof ref.click === 'function') {
      try { ref.click(); return; } catch (e) { /* continue */ }
    }

    const tmp = document.createElement('input');
    tmp.type = 'file';
    tmp.accept = 'application/json';
    tmp.style.display = 'none';
    tmp.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(String(evt.target.result || 'null'));
          handleImport(data);
        } catch (error) {
          console.error('Import error:', error);
          alert(`Import failed: ${error.message}`);
        }
      };
      reader.onerror = () => alert('Failed to read file');
      reader.readAsText(file);
      document.body.removeChild(tmp);
    }, { once: true });
    document.body.appendChild(tmp);
    tmp.click();
  }, [fileInputRef, handleImport]);

  // Helper to push to undo stack
  const pushUndo = useCallback((newNodes) => {
    console.log('Push to undo stack:', {
      currentNodes: nodes.length,
      newNodes: newNodes.length,
      undoStackSize: undoStack.length,
      redoStackSize: redoStack.length
    });
    // Use functional updates to ensure state consistency
    setUndoStack(stack => [...stack, [...nodes]]);
    setRedoStack(() => []);
    setNodes(() => Array.isArray(newNodes) ? [...newNodes] : []);
  }, [nodes, undoStack.length, redoStack.length]);

  // Auto layout handler
  const handleAutoLayout = useCallback(() => {
    console.log('Applying auto layout to', nodes.length, 'nodes');
    const layoutedNodes = organizeLayout(nodes, canvasSize);
    pushUndo(layoutedNodes);
    // After layout changes, fit content into view for a clear result
    setTimeout(() => { canvasRef.current?.fitToView?.({ markInteraction: false }); canvasRef.current?.resetInteractionFlag?.(); }, 0);
  }, [nodes, pushUndo, canvasSize]);

  // Search handlers
  const handleShowSearch = useCallback(() => {
    setShowSearch(true);
  }, []);

  const handleCloseSearch = useCallback(() => {
    setShowSearch(false);
    setHighlightedNodeIds([]);
  }, []);

  const handleSelectSearchNode = useCallback((nodeId) => {
    setSelectedNodeId(nodeId);
    if (canvasRef.current?.focusOnNode) {
      canvasRef.current.focusOnNode(nodeId);
    }
  }, [canvasRef]);

  const handleHighlightNodes = useCallback((nodeIds) => {
    setHighlightedNodeIds(nodeIds);
  }, []);

  // Theme handlers
  const handleShowThemes = useCallback(() => {
    setShowThemes(true);
  }, []);

  const handleCloseThemes = useCallback(() => {
    setShowThemes(false);
  }, []);

  // Context menu actions
  const closeContextMenu = useCallback(() => setContextMenu(cm => ({ ...cm, open: false })), []);
  const openContextMenu = useCallback((payload) => {
    setContextMenu({
      open: true,
      x: payload.clientX ?? payload.screenX,
      y: payload.clientY ?? payload.screenY,
      target: payload,
      pointerType: payload.pointerType || 'mouse'
    });
  }, []);

  const [maxLevel, setMaxLevel] = useState(() => {
    if (typeof window === 'undefined') return 99;
    const saved = window.localStorage.getItem('vertex_max_level');
    const parsed = parseInt(saved, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 99;
  });

  useEffect(() => {
    try { window.localStorage.setItem('vertex_max_level', String(maxLevel)); } catch {}
  }, [maxLevel]);

  // Enhanced node creation helper
  const createNewNode = useCallback((anchorNode, position, options = {}) => {
    const maxId = Math.max(...nodes.map(n => n.id), 0);
    const baseLevel = anchorNode?.level ?? -1;
    const desiredLevel = options.level != null ? options.level : baseLevel + 1;
    const clampedLevel = Math.max(0, Math.min(maxLevel, desiredLevel));
    return createEnhancedNode({
      id: maxId + 1,
      label: intl.formatMessage({ id: 'node.newNode' }),
      x: position.x,
      y: position.y,
      level: clampedLevel,
      parentId: null
    });
  }, [nodes, intl, maxLevel]);

  // Compute a non-overlapping position for a new node near an anchor
  const findNonOverlappingPosition = useCallback((anchor, allNodes, levelOverride) => {
    const tempId = -1;
    const radii = [140, 180, 220, 260];
    const tries = 16;
    let best = { pos: { x: (anchor?.x ?? 0) + 140, y: anchor?.y ?? 0 }, score: Infinity };

    for (const r of radii) {
      for (let i = 0; i < tries; i++) {
        const angle = (2 * Math.PI / tries) * i;
        const pos = {
          x: (anchor?.x ?? 0) + Math.cos(angle) * r,
          y: (anchor?.y ?? 0) + Math.sin(angle) * r
        };
        const candidateLevel = Math.max(0, Math.min(maxLevel, levelOverride ?? (anchor?.level ?? -1) + 1));
        const candidate = {
          id: tempId,
          label: intl.formatMessage({ id: 'node.newNode' }),
          x: pos.x,
          y: pos.y,
          level: candidateLevel
        };
        const collisions = detectCollisions([...allNodes, candidate]);
        const involving = collisions.filter(c => c.nodeA === tempId || c.nodeB === tempId);
        if (involving.length === 0) {
          return pos;
        }
        const overlapSum = involving.reduce((s, c) => s + (c.overlap || 0), 0);
        if (overlapSum < best.score) {
          best = { pos, score: overlapSum };
        }
      }
    }
    return best.pos;
  }, [intl, maxLevel]);

  // Save nodes to localStorage whenever they change
  useEffect(() => {
    try { localStorage.setItem(graphKey('nodes'), JSON.stringify(nodes)); } catch {}
  }, [nodes, graphKey]);

  // Save edges to localStorage whenever they change
  useEffect(() => {
    try { localStorage.setItem(graphKey('edges'), JSON.stringify(edges)); } catch {}
  }, [edges, graphKey]);

  // Create a new diagram initializer used by menu and keyboard
  const handleNewDiagram = useCallback(() => {
    const initialNodes = [createEnhancedNode({ id: 1, label: intl.formatMessage({ id: 'node.centralTopic' }), x: 400, y: 300, level: 0 })];
    setNodes([...initialNodes]);
    setEdges([]);
    setUndoStack([]);
    setRedoStack([]);
    setSelectedNodeId(null);
    localStorage.removeItem(graphKey('nodes'));
    localStorage.removeItem(graphKey('edges'));
    setTimeout(() => { canvasRef.current?.fitToView?.({ markInteraction: false }); canvasRef.current?.resetInteractionFlag?.(); }, 0);
  }, [intl]);

  const handleMakeCopy = useCallback(() => {
    if (typeof window === 'undefined') {
      console.warn('Make Copy is only available in the browser');
      return;
    }

    const createId = () => (
      (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    );

    const newGraphId = createId();
    const storage = window.localStorage;

    try {
      storage.setItem(`vertex_graph_${newGraphId}_nodes`, JSON.stringify(nodes));
      storage.setItem(`vertex_graph_${newGraphId}_edges`, JSON.stringify(Array.isArray(edges) ? edges : []));
      storage.setItem(`vertex_graph_${newGraphId}_title`, graphTitle ?? '');
    } catch (error) {
      console.error('Failed to make a copy of the graph', error);
      const message = intl.formatMessage({
        id: 'file.makeCopyError',
        defaultMessage: 'Failed to make a copy. Please check browser storage permissions and try again.'
      });
      alert(message);
      return;
    }

    window.location.hash = `#/g/${newGraphId}`;
  }, [nodes, edges, graphTitle, intl]);

  const handleShowVersionHistory = useCallback(() => {
    const message = intl.formatMessage({
      id: 'file.versionHistoryUnavailable',
      defaultMessage: 'Version history is not available yet.'
    });
    alert(message);
  }, [intl]);

  // Node info panel handlers
  const handleToggleNodeInfoPanel = useCallback(() => {
    setShowNodeInfoPanel(prev => !prev);
  }, []);

  const hideNodeInfoPanel = useCallback(() => {
    setShowNodeInfoPanel(false);
  }, []);

  const handleMinimapViewportChange = useCallback((newViewport) => {
    if (canvasRef.current?.setViewport) {
      canvasRef.current.setViewport(newViewport);
    }
  }, []);

  const handleDeleteNode = useCallback((nodeId) => {
    const idsToDelete = [nodeId];
    pushUndo(nodes.filter(n => !idsToDelete.includes(n.id)));
    setEdges(prev => Array.isArray(prev) ? prev.filter(e => !idsToDelete.includes(e.source) && !idsToDelete.includes(e.target)) : prev);
    setSelectedNodeIds([]);
    setSelectedNodeId(null);
    setShowNodeEditor(false);
    setEditingNodeId(null);
  }, [nodes, pushUndo]);

  const selectNodes = useCallback((ids = [], options = {}) => {
    const list = Array.isArray(ids) ? ids.filter((id) => id !== undefined && id !== null) : [];
    if (list.length === 0) {
      setSelectedNodeIds([]);
      setSelectedNodeId(null);
      return;
    }

    const unique = Array.from(new Set(list));
    setSelectedNodeIds(unique);
    setSelectedNodeId(unique[0] ?? null);
    setShowNodeEditor(false);
    setEditingNodeId(null);

    if (options.center && unique[0] != null && canvasRef.current?.focusOnNode) {
      canvasRef.current.focusOnNode(unique[0]);
    }
  }, [canvasRef, setEditingNodeId, setSelectedNodeId, setSelectedNodeIds, setShowNodeEditor]);

  const previewAltNavigation = useCallback((direction) => {
    const state = altNavigationStateRef.current;
    const referenceId = state.previewId ?? selectedNodeId;
    if (referenceId == null) return;

    const nextNode = findNextConnectedNode({ nodes, edges, referenceId, direction });
    if (!nextNode) return;

    if (!state.active) {
      state.active = true;
      state.previousHighlight = Array.isArray(highlightedNodeIds) ? [...highlightedNodeIds] : [];
    }

    state.previewId = nextNode.id;
    setHighlightedNodeIds([nextNode.id]);
    if (canvasRef.current?.focusOnNode) {
      canvasRef.current.focusOnNode(nextNode.id);
    }
  }, [selectedNodeId, nodes, edges, highlightedNodeIds, canvasRef, setHighlightedNodeIds]);

  const finalizeAltNavigation = useCallback((commitSelection) => {
    const state = altNavigationStateRef.current;
    if (!state.active) return;

    const previewId = state.previewId;
    const previousHighlight = state.previousHighlight;

    altNavigationStateRef.current = {
      active: false,
      previewId: null,
      previousHighlight: [],
    };

    setHighlightedNodeIds(Array.isArray(previousHighlight) ? [...previousHighlight] : []);

    if (commitSelection && previewId != null) {
      selectNodes([previewId]);
    }
  }, [selectNodes, setHighlightedNodeIds]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCommandKey = e.metaKey || e.ctrlKey;
      const isAltArrow = e.altKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key);

      if (e.code === 'Space') {
        // Prevent spacebar from scrolling
        e.preventDefault();
      }

      if (isAltArrow && !isCommandKey) {
        e.preventDefault();
        previewAltNavigation(e.key);
        return;
      }

      if (e.key === 'Escape' && altNavigationStateRef.current.active) {
        finalizeAltNavigation(false);
      }

      if (e.code === 'Escape') {
        // Handle help panel
        setIsHelpVisible(false);
        window.localStorage.setItem('xmindHelpTriggerState', '0');
      } else if (isCommandKey) {
        switch (e.key.toLowerCase()) {
          case 'n': {
            if (e.shiftKey) {
              e.preventDefault();
              console.log('New diagram');
              const initialNodes = [createEnhancedNode({ id: 1, label: intl.formatMessage({ id: 'node.centralTopic' }), x: 400, y: 300, level: 0 })];
              setNodes([...initialNodes]);
              setUndoStack([]);
              setRedoStack([]);
              setSelectedNodeId(null);
                  localStorage.removeItem(graphKey('nodes'));
              setTimeout(() => {
                canvasRef.current?.center?.();
              }, 0);
            }
            break;
          }

          case 's': {
            e.preventDefault();
            if (e.shiftKey) {
              console.log('Export PNG');
              if (canvasRef.current?.exportAsPNG) {
                canvasRef.current.exportAsPNG();
              }
            } else {
              console.log('Export JSON');
              handleExport();
            }
            break;
          }

          case 'o': {
            if (e.shiftKey) {
              e.preventDefault();
              console.log('Import JSON');
              handleImportRequest();
            }
            break;
          }

          case 'z': {
            e.preventDefault();
            if (e.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
          }

          case 'l': {
            e.preventDefault();
            console.log('Auto layout shortcut');
            handleAutoLayout();
            break;
          }

          case 'f': {
            e.preventDefault();
            console.log('Search shortcut');
            handleShowSearch();
            break;
          }

          case 'i': {
            e.preventDefault();
            console.log('Toggle node info panel shortcut');
            handleToggleNodeInfoPanel();
            break;
          }

          case 'a': {
            if (e.shiftKey) {
              e.preventDefault();
              console.log('Select all nodes shortcut');
              setSelectedNodeIds(nodes.map(n => n.id));
            }
            break;
          }
        }
      } else if (!isCommandKey && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'm') {
        // handled by keyboard hook
      } else if (selectedNodeId) {
        // Node-specific shortcuts that require a selected node
        if (e.key === 'Tab') {
          const anchor = nodes.find(n => n.id === selectedNodeId);
          if (!anchor) return;
          e.preventDefault();
          const anchorLevel = anchor.level ?? 0;
          let targetLevel;
          if (e.altKey) {
            targetLevel = anchorLevel;
          } else if (e.shiftKey) {
            targetLevel = Math.max(0, anchorLevel - 1);
          } else {
            targetLevel = Math.min(maxLevel, anchorLevel + 1);
          }
          const positionAnchor = nodes.find(n => (n.level ?? 0) === targetLevel) || anchor;
          const { x, y } = findNonOverlappingPosition(positionAnchor, nodes, targetLevel);
          const newNode = createNewNode(positionAnchor, { x, y }, { level: targetLevel });
          pushUndo([...nodes, newNode]);
          setEdges(prev => addUndirectedEdge(Array.isArray(prev) ? prev : [], anchor.id, newNode.id));
        } else if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
          e.preventDefault();
          const newLabel = window.prompt(intl.formatMessage({ id: 'node.enterName' }), nodes.find(n => n.id === selectedNodeId)?.label || '');
          if (newLabel) {
            pushUndo(nodes.map(n => n.id === selectedNodeId ? { ...n, label: newLabel } : n));
          }
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          handleDeleteNode(selectedNodeId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvasRef, fileInputRef, handleUndo, handleRedo, handleExport, handleAutoLayout, handleShowSearch, handleToggleNodeInfoPanel, selectedNodeId, nodes, pushUndo, intl, createNewNode, findNonOverlappingPosition, handleDeleteNode, maxLevel, selectNodes, setEdges, previewAltNavigation, finalizeAltNavigation]);

  useEffect(() => {
    const handleKeyUp = (e) => {
      if (!altNavigationStateRef.current.active) return;
      const isArrow = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key);
      if (e.key === 'Alt' || (isArrow && !e.altKey)) {
        const shouldCommit = e.key === 'Alt' || !e.altKey;
        finalizeAltNavigation(shouldCommit);
      }
    };

    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, [finalizeAltNavigation]);

  useEffect(() => {
    if (!altNavigationStateRef.current.active) return;
    if (selectedNodeId == null) {
      finalizeAltNavigation(false);
    }
  }, [selectedNodeId, finalizeAltNavigation]);

  // Load help panel state from localStorage on initial render
  useEffect(() => {
    const savedState = window.localStorage.getItem('xmindHelpTriggerState');
    setIsHelpVisible(savedState === '1');
  }, []);

  // Toggles the help panel and saves the state
  const toggleHelp = useCallback(() => {
    setIsHelpVisible(prev => {
      const next = !prev;
      try {
        window.localStorage.setItem('xmindHelpTriggerState', next ? '1' : '0');
      } catch {}
      return next;
    });
  }, []);

  const triggerClass = `trigger ${isHelpVisible ? 'active' : ''}`;

  // Selection change handler
  const handleSelectionChange = useCallback((nodeIds) => {
    console.log('Selection changed:', nodeIds);
    setSelectedNodeIds(nodeIds);
    // Update single selection for backward compatibility
    setSelectedNodeId(nodeIds.length === 1 ? nodeIds[0] : null);
  }, []);

  // Node click handler (backward compatibility)
  const handleNodeClick = (nodeId) => {
    console.log('Node clicked:', { nodeId, currentSelected: selectedNodeId });
    selectNodes([nodeId]);
  };

  // Node double-click handler for editing
  const handleNodeDoubleClick = (nodeId) => {
    console.log('Node double-clicked for editing:', nodeId);
    setEditingNodeId(nodeId);
    setShowNodeEditor(true);
  };

  // Node editor handlers
  const handleCloseNodeEditor = useCallback(() => {
    setShowNodeEditor(false);
    setEditingNodeId(null);
  }, []);

  const handleSaveNode = useCallback((nodeId, nodeData) => {
    console.log('Saving node:', nodeId, nodeData);
    pushUndo(nodes.map(node => 
      node.id === nodeId ? updateNode(node, nodeData) : node
    ));
    setShowNodeEditor(false);
    setEditingNodeId(null);
  }, [nodes, pushUndo]);

  const handleToggleConnections = useCallback((ids, options = {}) => {
    if (!Array.isArray(ids) || ids.length < 2) return;
    const isShift = options.shift === true;

    const currentEdges = Array.isArray(edges) ? [...edges] : [];
    const pairKey = (a, b) => (a <= b ? `${a}-${b}` : `${b}-${a}`);
    const pairs = [];
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        pairs.push([ids[i], ids[j]]);
      }
    }
    const hasPair = (a, b) => currentEdges.some(e => pairKey(e.source, e.target) === pairKey(a, b) && !e.directed);

    let newEdges = [...currentEdges];

    if (isShift) {
      const sortedIds = [...ids].sort((a, b) => a - b);
      const selectionKey = sortedIds.join('-');
      const m = pairs.length;
      if (m > 0) {
        let idx = shiftPairIndex;
        const total = 1 << m;
        if (selectionKey !== shiftPairSelKey || idx >= total) {
          idx = 0;
          setShiftPairSelKey(selectionKey);
        }
        const next = (idx + 1) % total;
        const gray = next ^ (next >> 1);
        const desired = new Set();
        for (let bit = 0; bit < m; bit++) {
          if ((gray >> bit) & 1) {
            const [a, b] = pairs[bit];
            desired.add(pairKey(a, b));
          }
        }
        newEdges = newEdges.filter(e => {
          const key = pairKey(e.source, e.target);
          const internal = pairs.some(([a, b]) => key === pairKey(a, b));
          if (!internal) return true;
          if (e.directed) return true;
          return desired.has(key);
        });
        desired.forEach(key => {
          const exists = newEdges.some(e => pairKey(e.source, e.target) === key && !e.directed);
          if (!exists) {
            const [aStr, bStr] = key.split('-');
            const a = parseInt(aStr, 10);
            const b = parseInt(bStr, 10);
            newEdges.push({ source: a, target: b, directed: false });
          }
        });
        setShiftPairIndex(next);
      }
    } else {
      const allPresent = pairs.length > 0 && pairs.every(([a, b]) => hasPair(a, b));
      if (allPresent) {
        const removeSet = new Set(pairs.map(([a, b]) => pairKey(a, b)));
        newEdges = newEdges.filter(e => {
          const key = pairKey(e.source, e.target);
          return !removeSet.has(key) || !!e.directed;
        });
      } else {
        pairs.forEach(([a, b]) => {
          if (!hasPair(a, b)) {
            newEdges.push({ source: a, target: b, directed: false });
          }
        });
      }
    }

    setEdges(newEdges);
  }, [edges, shiftPairIndex, shiftPairSelKey]);

  const updateNodesFromPlugin = useCallback((updater) => {
    const draft = nodes.map(node => ({ ...node }));
    const next = typeof updater === 'function' ? updater(draft) : updater;
    if (!Array.isArray(next)) return;
    pushUndo(next);
  }, [nodes, pushUndo]);

  // Hook-based common keyboard shortcuts to avoid drift with menus/help
  useKeyboardShortcuts({
    onNew: handleNewDiagram,
    onMakeCopy: handleMakeCopy,
    onImport: handleImportRequest,
    onExport: handleExport,
    onExportPNG: () => canvasRef.current?.exportAsPNG?.(),
    onUndo: handleUndo,
    onRedo: handleRedo,
    selectedNodeId,
    selectedNodeIds,
    onDeleteNode: handleDeleteNode,
    onCenter: () => canvasRef.current?.fitToView?.(),
    onZoomIn: () => canvasRef.current?.zoom?.(1.1),
    onZoomOut: () => canvasRef.current?.zoom?.(0.9),
    onResetZoom: () => canvasRef.current?.resetZoom?.(),
    onToggleMinimap: () => setShowMinimap(v => !v),
    onToggleConnections: handleToggleConnections
  });

  const handleEditNodeFromPanel = useCallback((nodeId) => {
    setEditingNodeId(nodeId);
    setShowNodeEditor(true);
  }, []);

  const handleDeleteNodesFromPanel = useCallback((nodeIds) => {
    const ids = Array.isArray(nodeIds) ? nodeIds : [];
    pushUndo(nodes.filter(n => !ids.includes(n.id)));
    setEdges(prev => Array.isArray(prev) ? prev.filter(e => !ids.includes(e.source) && !ids.includes(e.target)) : prev);
    setSelectedNodeIds([]);
    setSelectedNodeId(null);
  }, [nodes, pushUndo]);

  const handleToggleCollapseFromPanel = useCallback((nodeId) => {
    pushUndo(nodes.map(node => 
      node.id === nodeId 
        ? { ...node, isCollapsed: !node.isCollapsed }
        : node
    ));
  }, [nodes, pushUndo]);

  useEffect(() => {
    const updateMenuMetrics = () => {
      const nav = menuBarRef.current;
      if (!nav) return;
      const offsetTop = nav.offsetTop || 0;
      const height = nav.offsetHeight || 0;
      setMenuBarBottom(offsetTop + height);
    };
    updateMenuMetrics();
    window.addEventListener('resize', updateMenuMetrics);
    return () => window.removeEventListener('resize', updateMenuMetrics);
  }, [isMobile]);

  const floatingHelpAllowance = isMobile ? 64 : 0;
  const pluginTipTop = menuBarBottom + 12 + floatingHelpAllowance;
  const mobileTipWidth = 'min(440px, calc(100vw - 24px - env(safe-area-inset-left) - env(safe-area-inset-right)))';
  const pluginTipContainerStyle = {
    position: 'fixed',
    top: `calc(${pluginTipTop}px + env(safe-area-inset-top))`,
    zIndex: 10020,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    ...(isMobile
      ? {
          alignItems: 'stretch',
          left: '50%',
          transform: 'translateX(-50%)',
          width: mobileTipWidth,
          maxWidth: mobileTipWidth,
        }
      : {
          alignItems: 'flex-end',
          right: `calc(24px + env(safe-area-inset-right))`,
          maxWidth: 360,
        }),
  };

  const pluginTipCardStyle = {
    background: '#111827',
    color: '#e5e7eb',
    padding: isMobile ? '14px 16px' : '10px 12px',
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'stretch' : 'center',
    gap: isMobile ? 12 : 8,
    width: '100%',
  };

  const pluginTipPrimaryButtonStyle = {
    background: currentTheme.colors?.primaryButton || '#2563eb',
    color: currentTheme.colors?.primaryButtonText || '#fff',
    border: 'none',
    borderRadius: 9999,
    padding: '8px 16px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(15,23,42,0.28)',
    marginLeft: isMobile ? 0 : 'auto',
    width: isMobile ? '100%' : 'auto',
  };

  const pluginTipDismissButtonStyle = {
    ...pluginTipPrimaryButtonStyle,
    background: 'transparent',
    color: currentTheme.colors?.primaryButtonText || '#fff',
    border: `1px solid ${currentTheme.colors?.primaryButtonText ? `${currentTheme.colors.primaryButtonText}55` : 'rgba(255,255,255,0.35)'}`,
    boxShadow: 'none',
  };

  const baseOverlayItems = useMemo(() => {
    const items = {
      help: { slot: 'top-right', order: isMobile ? 40 : 10 },
    };
    if (showMinimap) {
      items.minimap = { slot: 'bottom-right', order: isMobile ? 30 : 10 };
    }
    if (isMobile) {
      items.controls = { slot: 'bottom-right', order: showMinimap ? 10 : 20 };
    }
    return items;
  }, [isMobile, showMinimap]);

  const overlayItems = useMemo(() => {
    const merged = { ...baseOverlayItems };
    const overrides = overlayLayoutOverrides.items || {};
    Object.entries(overrides).forEach(([key, value]) => {
      if (value === null) {
        delete merged[key];
        return;
      }
      if (typeof value !== 'object') return;
      if (!merged[key] && value.slot == null) {
        return;
      }
      const current = merged[key] ? { ...merged[key] } : {};
      if (value.slot === null) {
        delete merged[key];
        return;
      }
      merged[key] = { ...current, ...value };
    });
    return merged;
  }, [baseOverlayItems, overlayLayoutOverrides.items]);

  const topOffsetPx = Math.max(menuBarBottom + (isMobile ? 12 : 8), isMobile ? 96 : 48);

  const baseSlotStyles = useMemo(() => ({
    'top-right': {
      className: 'overlay-slot overlay-slot--top-right',
      style: {
        top: `calc(${topOffsetPx}px + env(safe-area-inset-top))`,
        right: `calc(24px + env(safe-area-inset-right))`,
      },
    },
    'bottom-right': {
      className: 'overlay-slot overlay-slot--bottom-right',
      style: {
        bottom: `calc(24px + env(safe-area-inset-bottom))`,
        right: `calc(16px + env(safe-area-inset-right))`,
      },
    },
    'bottom-left': {
      className: 'overlay-slot overlay-slot--bottom-left',
      style: {
        bottom: `calc(24px + env(safe-area-inset-bottom))`,
        left: `calc(16px + env(safe-area-inset-left))`,
      },
    },
  }), [topOffsetPx]);

  const slotStyles = useMemo(() => {
    const merged = { ...baseSlotStyles };
    const overrides = overlayLayoutOverrides.slots || {};
    Object.entries(overrides).forEach(([slot, value]) => {
      if (value === null) {
        delete merged[slot];
        return;
      }
      if (typeof value !== 'object') return;
      const base = merged[slot] || { className: 'overlay-slot', style: {} };
      merged[slot] = {
        ...base,
        ...value,
        className: value.className || base.className || 'overlay-slot',
        style: { ...base.style, ...(value.style || {}) },
      };
      if (value.gap !== undefined && merged[slot].style.gap === undefined) {
        merged[slot].style.gap = typeof value.gap === 'number' ? `${value.gap}px` : value.gap;
      }
    });
    return merged;
  }, [baseSlotStyles, overlayLayoutOverrides.slots]);

  const overlayRenderers = useMemo(() => ({
    controls: () => (
      <MobileCanvasControls
        onZoomIn={() => canvasRef.current?.zoom?.(1.1)}
        onZoomOut={() => canvasRef.current?.zoom?.(0.9)}
        onResetZoom={() => canvasRef.current?.resetZoom?.()}
        onCenter={() => canvasRef.current?.fitToView?.()}
      />
    ),
    minimap: () => (
      <Minimap
        nodes={nodes}
        viewBox={viewBox}
        visible={showMinimap}
        onViewportChange={handleMinimapViewportChange}
      />
    ),
  }), [nodes, viewBox, showMinimap, handleMinimapViewportChange]);

  const combinedOverlayEntries = useMemo(() => {
    const entries = [];

    Object.entries(overlayItems).forEach(([id, config]) => {
      if (!config || config.hidden) return;
      const render = overlayRenderers[id];
      if (!render) return;
      entries.push({
        id,
        slot: config.slot || 'top-right',
        order: typeof config.order === 'number' ? config.order : 0,
        style: config.style,
        element: render(),
      });
    });

    (pluginOverlays || []).forEach((descriptor) => {
      if (!descriptor) return;
      const layoutKey = descriptor.layoutKey || descriptor.key || descriptor.pluginId + ':' + descriptor.overlayId;
      const layoutConfig = overlayItems[layoutKey] || {};
      const slot = layoutConfig.slot || descriptor.slot || 'top-right';
      const order = layoutConfig.order ?? descriptor.order ?? 0;
      const mergedStyle = {
        ...(descriptor.style || {}),
        ...(layoutConfig.style || {}),
      };
      entries.push({
        id: layoutKey,
        slot,
        order,
        style: mergedStyle,
        element: descriptor.element,
      });
    });

    return entries;
  }, [overlayItems, overlayRenderers, pluginOverlays]);

  const overlaySlotElements = useMemo(() => {
    const map = new Map();
    combinedOverlayEntries.forEach(({ slot, ...rest }) => {
      const slotName = slot || 'top-right';
      if (!map.has(slotName)) map.set(slotName, []);
      map.get(slotName).push(rest);
    });

    const elements = [];
    map.forEach((items, slotName) => {
      if (!items || items.length === 0) return;
      const slotConfig = slotStyles[slotName] || { className: 'overlay-slot', style: {} };
      const style = { ...(slotConfig.style || {}) };
      const sorted = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      elements.push(
        <div key={`overlay-slot-${slotName}`} className={slotConfig.className || 'overlay-slot'} style={style}>
          {sorted.map(({ id, style: itemStyle, element }) => (
            <div key={id} className="overlay-slot__item" style={itemStyle}>
              {element}
            </div>
          ))}
        </div>
      );
    });
    return elements;
  }, [combinedOverlayEntries, slotStyles]);

  const overlayLayoutSnapshot = useMemo(() => ({
    items: Object.fromEntries(Object.entries(overlayItems).map(([id, cfg]) => [id, { ...cfg }])),
    slots: Object.fromEntries(Object.entries(slotStyles).map(([slot, cfg]) => [slot, {
      ...cfg,
      style: { ...(cfg.style || {}) },
    }])),
    overrides: {
      items: { ...(overlayLayoutOverrides.items || {}) },
      slots: { ...(overlayLayoutOverrides.slots || {}) },
    },
  }), [overlayItems, slotStyles, overlayLayoutOverrides]);

  const pluginAppApi = useMemo(() => ({
    nodes,
    edges,
    selectedNodeIds,
    selectedNodes: selectedNodeIds.map(id => nodes.find(n => n.id === id)).filter(Boolean),
    selectNodes,
    selectNode: (id, options = {}) => selectNodes(id == null ? [] : [id], options),
    toggleConnection: (a, b, options = {}) => {
      if (a == null || b == null) return;
      handleToggleConnections([a, b], options);
    },
    updateNodes: updateNodesFromPlugin,
    maxLevel,
    showNodeInfoPanel,
    hideNodeInfoPanel,
    onEditNode: handleEditNodeFromPanel,
    onDeleteNodes: handleDeleteNodesFromPanel,
    onToggleCollapse: handleToggleCollapseFromPanel,
    onHighlightNodes: handleHighlightNodes,
    setPluginEnabled,
    pluginPrefs,
    overlayLayout: overlayLayoutSnapshot,
    setOverlayLayout: updateOverlayLayout,
    resetOverlayLayout,
    isHelpVisible,
    toggleHelp,
    isMobile,
  }), [
    nodes,
    edges,
    selectedNodeIds,
    selectNodes,
    handleToggleConnections,
    updateNodesFromPlugin,
    maxLevel,
    showNodeInfoPanel,
    hideNodeInfoPanel,
    handleEditNodeFromPanel,
    handleDeleteNodesFromPanel,
    handleToggleCollapseFromPanel,
    handleHighlightNodes,
    setPluginEnabled,
    pluginPrefs,
    overlayLayoutSnapshot,
    updateOverlayLayout,
    resetOverlayLayout,
    isHelpVisible,
    toggleHelp,
    isMobile,
  ]);


  return (
    <React.Fragment>
      <MenuBar
        ref={menuBarRef}
        onExport={handleExport}
        onImport={handleImport}
        nodes={nodes}
        setNodes={setNodes}
        setUndoStack={setUndoStack}
        setRedoStack={setRedoStack}
        setSelectedNodeId={setSelectedNodeId}
        canvasRef={canvasRef}
        onNew={handleNewDiagram}
        onMakeCopy={handleMakeCopy}
        onShowVersionHistory={handleShowVersionHistory}
        onExportPNG={() => alert('Export as PNG not implemented yet.')}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDelete={() => {
          console.log('Delete:', { selectedNodeId });
          if (!selectedNodeId) {
            console.log('No node selected for deletion');
            return;
          }
          handleDeleteNode(selectedNodeId);
        }}
        onAutoLayout={handleAutoLayout}
        onSearch={handleShowSearch}
        onCenter={() => {
          console.log('Center canvas (fit to view):', { canvasRef: !!canvasRef.current, fitToView: !!canvasRef.current?.fitToView });
          canvasRef.current?.fitToView?.();
        }}
        onZoomIn={() => {
          console.log('Zoom in:', { canvasRef: !!canvasRef.current, zoom: !!canvasRef.current?.zoom });
          if (canvasRef.current?.zoom) canvasRef.current.zoom(1.1);
        }}
        onZoomOut={() => {
          console.log('Zoom out:', { canvasRef: !!canvasRef.current, zoom: !!canvasRef.current?.zoom });
          if (canvasRef.current?.zoom) canvasRef.current.zoom(0.9);
        }}
        onResetZoom={() => {
          console.log('Reset zoom:', { canvasRef: !!canvasRef.current, resetZoom: !!canvasRef.current?.resetZoom });
          if (canvasRef.current?.resetZoom) canvasRef.current.resetZoom();
        }}
        onShowThemes={handleShowThemes}
        showMinimap={showMinimap}
        setShowMinimap={setShowMinimap}
        showNodeInfoPanel={showNodeInfoPanel}
        onToggleNodeInfoPanel={handleToggleNodeInfoPanel}
        onToggleHelp={toggleHelp}
        isHelpVisible={isHelpVisible}
        fileInputRef={fileInputRef}
        graphId={graphId}
        graphTitle={graphTitle}
        setGraphTitle={setGraphTitle}
        pluginPrefs={pluginPrefs}
        onTogglePlugin={setPluginEnabled}
        availablePlugins={corePlugins}
        customPlugins={customPlugins}
        onImportCustomPlugin={importCustomPlugin}
        onRemoveCustomPlugin={removeCustomPlugin}
        maxLevel={maxLevel}
        onChangeMaxLevel={setMaxLevel}
      />
      <div style={{ height: 80 }} />
      <MainHeader />

      {/* Plugin tips */}
      {pluginTips.length > 0 && (
        <div style={pluginTipContainerStyle}>
          {pluginTips.map(t => (
            <div key={t.id} style={pluginTipCardStyle}>
              <span style={{ fontSize: 12, lineHeight: 1.4 }}>
                <FormattedMessage id="plugin.hub.tip" defaultMessage="{name} enabled: explore its Control Hub" values={{ name: t.name }} />
              </span>
              <button
                style={pluginTipPrimaryButtonStyle}
                onClick={() => {
                  try { localStorage.setItem('vertex_plugin_seen_' + t.id, 'true'); } catch {}
                  window.location.hash = `#/plugin/${encodeURIComponent(t.id)}`;
                  setPluginTips(arr => arr.filter(x => x.id !== t.id));
                }}
              >
                <FormattedMessage id="plugin.hub.open" defaultMessage="Open Control Hub" />
              </button>
              <button
                style={pluginTipDismissButtonStyle}
                onClick={() => {
                  try { localStorage.setItem('vertex_plugin_seen_' + t.id, 'true'); } catch {}
                  setPluginTips(arr => arr.filter(x => x.id !== t.id));
                }}
              >
                <FormattedMessage id="plugin.hub.dismiss" defaultMessage="Dismiss" />
              </button>
            </div>
          ))}
        </div>
      )}

      {overlaySlotElements}

      {/* Diagram canvas */}
      <VertexCanvas
        ref={canvasRef}
        nodes={nodes}
        edges={edges}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        selectedNodeIds={selectedNodeIds}
        highlightedNodeIds={highlightedNodeIds}
        onSelectionChange={handleSelectionChange}
        onNodePositionChange={(id, x, y) => {
          pushUndo(nodes.map(n => n.id === id ? { ...n, x, y } : n));
        }}
        onViewBoxChange={setViewBox}
        onContextMenuRequest={openContextMenu}
        width={canvasSize.width}
        height={canvasSize.height}
      />

      {/* Search */}
      <Search
        nodes={nodes}
        visible={showSearch}
        selectedNodeId={selectedNodeId}
        onSelectNode={handleSelectSearchNode}
        onHighlightNodes={handleHighlightNodes}
        onClose={handleCloseSearch}
      />

      {/* Theme Selector */}
      {showThemes && (
        <ThemeSelector onClose={handleCloseThemes} />
      )}

      {/* Node Editor */}
      {showNodeEditor && editingNodeId && (
        <NodeEditor
          node={nodes.find(n => n.id === editingNodeId)}
          visible={showNodeEditor}
          onSave={handleSaveNode}
          onClose={handleCloseNodeEditor}
          onDelete={handleDeleteNode}
        />
      )}

      {/* Plugins */}
      <PluginHost
        plugins={activePlugins}
        onOverlaysChange={setPluginOverlays}
        appApi={pluginAppApi}
      />

      {/* Context Menu */}
      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        isOpen={contextMenu.open}
        pointerType={contextMenu.pointerType}
        onClose={closeContextMenu}
      >
        {contextMenu.target?.nodeId ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={() => {
              closeContextMenu();
              handleNodeDoubleClick(contextMenu.target.nodeId);
            }}><FormattedMessage id="nodeInfo.edit" defaultMessage="Edit Node" /></button>
            <button onClick={() => {
              closeContextMenu();
              handleToggleCollapseFromPanel(contextMenu.target.nodeId);
            }}><FormattedMessage id="nodeInfo.collapse" defaultMessage="Collapse Node" /></button>
            <button onClick={() => {
              closeContextMenu();
              handleDeleteNode(contextMenu.target.nodeId);
            }}><FormattedMessage id="nodeInfo.delete" defaultMessage="Delete Node" /></button>
            <button onClick={() => {
              closeContextMenu();
              const parent = nodes.find(n => n.id === contextMenu.target.nodeId);
              if (!parent) return;
              const targetLevel = Math.min(maxLevel, (parent.level ?? 0) + 1);
              const pos = findNonOverlappingPosition(parent, nodes, targetLevel);
              const newNode = createNewNode(parent, pos, { level: targetLevel });
              pushUndo([...nodes, newNode]);
              setEdges(prev => addUndirectedEdge(Array.isArray(prev) ? prev : [], parent.id, newNode.id));
            }}><FormattedMessage id="node.addConnected" defaultMessage="Add Connected Node" /></button>
            <button onClick={() => {
              closeContextMenu();
              canvasRef.current?.focusOnNode?.(contextMenu.target.nodeId);
            }}><FormattedMessage id="view.center" defaultMessage="Center" /></button>
            {/* Plugin Commands (node context) */}
            {(() => {
              const cmdApi = {
                nodes,
                edges,
                selectedNodeIds,
                selectedNodes: selectedNodeIds.map(id => nodes.find(n => n.id === id)).filter(Boolean),
                setHighlightedNodes: (ids) => handleHighlightNodes(ids),
                selectNodes,
                selectNode: (id, options = {}) => selectNodes(id == null ? [] : [id], options),
                toggleConnection: (a, b, options = {}) => {
                  if (a == null || b == null) return;
                  handleToggleConnections([a, b], options);
                },
                updateNodes: updateNodesFromPlugin,
              };
              return filterCommandsForContext(pluginCommands, cmdApi, contextMenu.target).map(cmd => (
                <button key={cmd.id} onClick={() => { closeContextMenu(); try { cmd.run(cmdApi, contextMenu.target); } catch (e) { console.error('Plugin command error:', e); } }}>
                  {cmd.title}
                </button>
              ));
            })()}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={() => {
              closeContextMenu();
              const pos = { x: contextMenu.target?.worldX ?? 0, y: contextMenu.target?.worldY ?? 0 };
              const newNode = createNewNode(null, pos);
              pushUndo([...nodes, newNode]);
            }}><FormattedMessage id="node.addHere" defaultMessage="Add Node Here" /></button>
            <button onClick={() => { closeContextMenu(); handleAutoLayout(); }}><FormattedMessage id="edit.autoLayout" defaultMessage="Auto Layout" /></button>
            <button onClick={() => { closeContextMenu(); canvasRef.current?.center?.(); }}><FormattedMessage id="view.center" defaultMessage="Center" /></button>
            <button onClick={() => { closeContextMenu(); canvasRef.current?.resetZoom?.(); }}><FormattedMessage id="view.resetZoom" defaultMessage="Reset Zoom" /></button>
            {/* Plugin Commands (canvas context) */}
            {(() => {
              const cmdApi = {
                nodes,
                edges,
                selectedNodeIds,
                selectedNodes: selectedNodeIds.map(id => nodes.find(n => n.id === id)).filter(Boolean),
                setHighlightedNodes: (ids) => handleHighlightNodes(ids),
                selectNodes,
                selectNode: (id, options = {}) => selectNodes(id == null ? [] : [id], options),
                toggleConnection: (a, b, options = {}) => {
                  if (a == null || b == null) return;
                  handleToggleConnections([a, b], options);
                },
                updateNodes: updateNodesFromPlugin,
              };
              return filterCommandsForContext(pluginCommands, cmdApi, contextMenu.target).map(cmd => (
                <button key={cmd.id} onClick={() => { closeContextMenu(); try { cmd.run(cmdApi, contextMenu.target); } catch (e) { console.error('Plugin command error:', e); } }}>
                  {cmd.title}
                </button>
              ));
            })()}
          </div>
        )}
      </ContextMenu>
    </React.Fragment>
  );
}

export default App;
