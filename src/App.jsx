import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import VertexCanvas from './VertexCanvas.jsx';
import { Minimap } from './components/panels/Minimap';
import { ContextMenu } from './components/menu/ContextMenu';
import Settings from './components/Settings';
import Search from './components/Search';
import ThemeSelector from './components/ThemeSelector';
import NodeEditor from './components/NodeEditor';
import HelpModal from './components/HelpModal';
// Plugin system
import { PluginHost } from './plugins/PluginHost';
import { corePlugins } from './plugins';
import { LocaleSelector } from './i18n/LocaleProvider';
import { useTheme } from './contexts/ThemeContext';
import { organizeLayout, detectCollisions } from './utils/layoutUtils';
import { formatShortcut } from './utils/shortcutUtils';
import { updateNode } from './utils/nodeUtils';
import { createEnhancedNode } from './utils/nodeUtils';

// --- Menu Bar Component ---
function MenuBar({
  onExport, onImport, onNew, onUndo, onRedo, onDelete, onAutoLayout, onSearch, onCenter, onZoomIn, onZoomOut, onResetZoom, onShowThemes,
  nodes, setNodes, setUndoStack, setRedoStack, setSelectedNodeId, canvasRef,
  showMinimap, setShowMinimap, showNodeInfoPanel, onToggleNodeInfoPanel,
  onToggleHelp, isHelpVisible
}) {
  const fileInputRef = useRef();
  const [openMenu, setOpenMenu] = useState(null); // 'file' | 'edit' | 'view' | 'settings' | null
  const [showSettings, setShowSettings] = useState(false);
  const intl = useIntl();
  const { currentTheme, toggleTheme } = useTheme();
  const [helpModal, setHelpModal] = useState({ open: false, titleId: null, messageId: null });

  // Close menu when clicking outside
  useEffect(() => {
    if (!openMenu) return;

    const handleClickOutside = (event) => {
      // Don't close if clicking inside a menu
      if (event.target.closest('.menu-dropdown')) return;
      // Don't close if clicking on a menu trigger
      if (event.target.closest('.menu-trigger')) return;
      setOpenMenu(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenu]);

  const menuDropdown = (type, items) => openMenu === type && (
    <div className="menu-dropdown" style={{
      position: 'absolute',
      top: 32,
      left: 0,
      background: currentTheme.colors.menuBackground,
      border: `1px solid ${currentTheme.colors.menuBorder}`,
      borderRadius: 4,
      boxShadow: `0 2px 8px ${currentTheme.colors.panelShadow}`,
      minWidth: 140,
      zIndex: 1000,
      padding: '4px 0'
    }}>{items}</div>
  );
  return (
    <>
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      <HelpModal
        open={helpModal.open}
        titleId={helpModal.titleId}
        messageId={helpModal.messageId}
        onClose={() => setHelpModal({ open: false, titleId: null, messageId: null })}
      />
      <nav style={{
        width: '100%', 
        background: currentTheme.colors.menuBackground, 
        borderBottom: `1px solid ${currentTheme.colors.menuBorder}`,
        display: 'flex', alignItems: 'center', padding: '0 24px', height: 48, zIndex: 200, position: 'fixed', top: 0, left: 0, right: 0
      }}>
      <div style={{ fontWeight: 700, fontSize: 18, marginRight: 32, color: currentTheme.colors.menuText }}>🧠 Vertex Lab</div>
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ cursor: 'pointer', position: 'relative' }}>
          <span className="menu-trigger" onClick={(e) => {
            e.preventDefault();
            console.log('File menu clicked');
            setOpenMenu(openMenu === 'file' ? null : 'file');
          }}><FormattedMessage id="menu.file" defaultMessage="File" /></span>
          {menuDropdown('file', <>
            <div
              style={{ padding: '8px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('New clicked');
                onNew();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="file.new" defaultMessage="New" />
              <span style={{ opacity: 0.5, marginLeft: 20 }}>⌘N</span>
            </div>
            <div
              style={{ padding: '8px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Export JSON clicked');
                onExport();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="file.export" defaultMessage="Export JSON" />
              <span style={{ opacity: 0.5, marginLeft: 20 }}>⌘S</span>
            </div>
            <div
              style={{ padding: '8px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
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
              <span style={{ opacity: 0.5, marginLeft: 20 }}>⇧⌘S</span>
            </div>
            <div
              style={{ padding: '8px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Import JSON clicked');
                fileInputRef.current.click();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="file.import" defaultMessage="Import JSON" />
              <span style={{ opacity: 0.5, marginLeft: 20 }}>⌘O</span>
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
        
        <div style={{ cursor: 'pointer', position: 'relative' }}>
          <span className="menu-trigger" onClick={(e) => {
            e.preventDefault();
            console.log('Edit menu clicked');
            setOpenMenu(openMenu === 'edit' ? null : 'edit');
          }}><FormattedMessage id="menu.edit" defaultMessage="Edit" /></span>
          {menuDropdown('edit', <>
            <div
              style={{ padding: '8px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Undo clicked');
                onUndo();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="edit.undo" defaultMessage="Undo" />
              <span style={{ opacity: 0.5, marginLeft: 20 }}>⌘Z</span>
            </div>
            <div
              style={{ padding: '8px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Redo clicked');
                onRedo();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="edit.redo" defaultMessage="Redo" />
              <span style={{ opacity: 0.5, marginLeft: 20 }}>⇧⌘Z</span>
            </div>
            <div
              style={{ padding: '8px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Delete clicked');
                onDelete();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="edit.delete" defaultMessage="Delete" />
              <span style={{ opacity: 0.5, marginLeft: 20 }}>⌫</span>
            </div>
            <div className="menu-separator" style={{ margin: '4px 0', borderTop: '1px solid #eee' }} />
            <div
              style={{ padding: '8px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Auto Layout clicked');
                onAutoLayout();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="edit.autoLayout" defaultMessage="Auto Layout" />
              <span style={{ opacity: 0.5, marginLeft: 20 }}>⌘L</span>
            </div>
            <div
              style={{ padding: '8px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Search clicked');
                onSearch();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="edit.search" defaultMessage="Search" />
              <span style={{ opacity: 0.5, marginLeft: 20 }}>⌘F</span>
            </div>
          </>)}
        </div>
        <div style={{ cursor: 'pointer', position: 'relative' }}>
          <span className="menu-trigger" onClick={(e) => {
            e.preventDefault();
            console.log('View menu clicked');
            setOpenMenu(openMenu === 'view' ? null : 'view');
          }}><FormattedMessage id="menu.view" defaultMessage="View" /></span>
          {menuDropdown('view', <>
            {/** helper for shortcut display */}
            {(() => { return null; })()}
            <div
              style={{ padding: '8px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Center clicked (fit to view)');
                onCenter();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="view.center" defaultMessage="Center" />
              <span style={{ opacity: 0.5, marginLeft: 20 }}>{formatShortcut({ key: 'c', modifiers: ['alt'] })}</span>
            </div>
            <div
              style={{ padding: '8px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Zoom In clicked');
                onZoomIn();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="view.zoomIn" defaultMessage="Zoom In" />
              <span style={{ opacity: 0.5, marginLeft: 20 }}>{formatShortcut({ key: '+', modifiers: ['alt'] })}</span>
            </div>
            <div
              style={{ padding: '8px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Zoom Out clicked');
                onZoomOut();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="view.zoomOut" defaultMessage="Zoom Out" />
              <span style={{ opacity: 0.5, marginLeft: 20 }}>{formatShortcut({ key: '-', modifiers: ['alt'] })}</span>
            </div>
            <div
              style={{ padding: '8px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Reset Zoom clicked');
                onResetZoom();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="view.resetZoom" defaultMessage="Reset Zoom" />
              <span style={{ opacity: 0.5, marginLeft: 20 }}>{formatShortcut({ key: '0', modifiers: ['alt'] })}</span>
            </div>
            <div className="menu-separator" style={{ margin: '4px 0', borderTop: '1px solid #eee' }} />
            <div
              style={{ padding: '8px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMinimap(!showMinimap);
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="view.showMinimap" defaultMessage="Show Minimap" />
              <span style={{ opacity: 0.5, marginLeft: 20 }}>{formatShortcut({ key: 'm', modifiers: [] })}</span>
              {showMinimap && <span style={{ marginLeft: 8 }}>✓</span>}
            </div>
            <div
              style={{ padding: '8px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleNodeInfoPanel();
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="view.showNodeInfoPanel" defaultMessage="Show Node Info" />
              <span style={{ opacity: 0.5, marginLeft: 20 }}>{formatShortcut({ key: 'i', modifiers: ['cmd'] })}</span>
              {showNodeInfoPanel && <span style={{ marginLeft: 8 }}>✓</span>}
            </div>
          </>)}
        </div>
        <div style={{ cursor: 'pointer', position: 'relative' }}>
          <span className="menu-trigger" onClick={(e) => {
            e.preventDefault();
            console.log('Library menu clicked');
            setOpenMenu(openMenu === 'library' ? null : 'library');
          }}><FormattedMessage id="menu.library" defaultMessage="Library" /></span>
          {menuDropdown('library', <>
            <div
              style={{ padding: '8px 20px', cursor: 'pointer' }}
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
            <div
              style={{ padding: '8px 20px', cursor: 'pointer' }}
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
              style={{ padding: '8px 20px', cursor: 'pointer' }}
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
        <div style={{ cursor: 'pointer', position: 'relative' }}>
          <span className="menu-trigger" onClick={(e) => {
            e.preventDefault();
            console.log('Settings menu clicked');
            setOpenMenu(openMenu === 'settings' ? null : 'settings');
          }}><FormattedMessage id="menu.settings" defaultMessage="Settings" /></span>
          {menuDropdown('settings', <>
            <div
              style={{ padding: '8px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Keyboard Shortcuts clicked');
                setShowSettings(true);
                setOpenMenu(null);
              }}
            >
              <span><FormattedMessage id="settings.shortcuts" defaultMessage="Keyboard Shortcuts" /></span>
              <span style={{ opacity: 0.5, marginLeft: 20 }}>?</span>
            </div>
            <div style={{ padding: '8px 20px' }}>
              <FormattedMessage id="settings.language" defaultMessage="Language" />
              <LocaleSelector />
            </div>
            <div
              style={{ padding: '8px 20px', cursor: 'pointer' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Toggle Dark Mode clicked');
                toggleTheme();
                setOpenMenu(null);
              }}
            ><FormattedMessage id="view.toggleTheme" defaultMessage="Toggle Theme" /></div>
            <div
              style={{ padding: '8px 20px', cursor: 'pointer' }}
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
        <div style={{ cursor: 'pointer', position: 'relative' }}>
          <span className="menu-trigger" onClick={(e) => {
            e.preventDefault();
            console.log('Help menu clicked');
            setOpenMenu(openMenu === 'help' ? null : 'help');
          }}><FormattedMessage id="menu.help" defaultMessage="Help" /></span>
          {menuDropdown('help', <>
            <div
              style={{ padding: '8px 20px', cursor: 'pointer' }}
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation();
                setHelpModal({ open: true, titleId: 'help.documentation', messageId: 'help.documentation.desc' });
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="help.documentation" defaultMessage="Documentation" />
            </div>
            <div
              style={{ padding: '8px 20px', cursor: 'pointer' }}
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation();
                setHelpModal({ open: true, titleId: 'help.community', messageId: 'help.community.desc' });
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="help.community" defaultMessage="Help Community" />
            </div>
            <div
              style={{ padding: '8px 20px', cursor: 'pointer' }}
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation();
                setHelpModal({ open: true, titleId: 'help.feedback', messageId: 'help.feedback.desc' });
                setOpenMenu(null);
              }}
            >
              <FormattedMessage id="help.feedback" defaultMessage="Send Feedback" />
            </div>
            <div
              style={{ padding: '8px 20px', cursor: 'pointer' }}
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
}

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
 * Component: HelpPanel
 * Displays the keyboard shortcuts.
 */
const HelpPanel = ({ isVisible, withPanel = false }) => {
    const rulesClass = `rules ${isVisible ? 'show' : ''}`;
    return (
        <div className={`help ${isVisible ? 'show' : ''} ${withPanel ? 'with-panel' : ''}`}>
            <div className={rulesClass}>
                <div className="rule"><span className="key">Tab</span><span className="desc">插入子节点</span></div>
                <div className="rule"><span className="key">Enter</span><span className="desc">插入后置节点</span></div>
                <div className="rule"><span className="key">Shift</span>+<span className="key">Enter</span><span className="desc">插入前置节点</span></div>
                <div className="rule"><span className="key">Ctrl</span>+<span className="key">Enter</span><span className="desc">插入父节点</span></div>
                <div className="rule"><span className="key">Ctrl</span>+<span className="key">←↑↓→</span><span className="desc">多节点选择</span></div>
                <div className="rule"><span className="key">Shift</span>+<span className="key">←↑↓→</span><span className="desc">移动节点</span></div>
                <div className="rule"><span className="key">Ctrl</span>+<span className="key">e</span><span className="desc">展开/收起节点</span></div>
                <div className="rule"><span className="key">Space</span>+<span className="key">左键</span><span className="desc">拖动画布</span></div>
                <div className="rule"><span className="key">Ctrl</span>+<span className="key">o</span><span className="desc">导入文件</span></div>
                <div className="rule"><span className="key">Ctrl</span>+<span className="key">s</span><span className="desc">导出为文件</span></div>
                <div className="rule"><span className="key">Ctrl</span>+<span className="key">Shift</span>+<span className="key">s</span><span className="desc">导出为图片</span></div>
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
function App() {
  const intl = useIntl();

  // Undo/redo stacks
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Canvas ref for view actions
  const canvasRef = useRef();

  // Create file input ref
  const fileInputRef = useRef();

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

  // Diagram state with localStorage persistence
  const [nodes, setNodes] = useState(() => {
    const savedNodes = localStorage.getItem('vertex_nodes');
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
      createEnhancedNode({ id: 1, label: 'Start Node', x: 400, y: 300, parentId: null }),
      createEnhancedNode({ id: 2, label: 'Branch 1', x: 250, y: 200, parentId: 1 }),
      createEnhancedNode({ id: 3, label: 'Branch 2', x: 550, y: 200, parentId: 1 }),
      createEnhancedNode({ id: 4, label: 'Branch 3', x: 250, y: 400, parentId: 1 }),
      createEnhancedNode({ id: 5, label: 'Branch 4', x: 550, y: 400, parentId: 1 }),
    ];
  });
  const [selectedNodeIds, setSelectedNodeIds] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null); // Keep for backward compatibility

  useEffect(() => {
    setNodes(nodes => {
      if (nodes && nodes.length > 0 && (nodes[0].label === 'Central Topic' || nodes[0].label === 'Start Node')) {
        return [
          { ...nodes[0], label: intl.formatMessage({ id: 'node.centralTopic' }) },
          { ...nodes[1], label: `${intl.formatMessage({ id: 'node.branch' })} 1` },
          { ...nodes[2], label: `${intl.formatMessage({ id: 'node.branch' })} 2` },
          { ...nodes[3], label: `${intl.formatMessage({ id: 'node.branch' })} 3` },
          { ...nodes[4], label: `${intl.formatMessage({ id: 'node.branch' })} 4` },
          ...nodes.slice(5)
        ];
      }
      return nodes;
    });
  }, [intl]);

  // Help panel visibility state
  const [isHelpVisible, setIsHelpVisible] = useState(true);

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState([]);

  // Theme state
  const [showThemes, setShowThemes] = useState(false);

  // Node editor state
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState(null);

  // Node info panel state
  const [showNodeInfoPanel, setShowNodeInfoPanel] = useState(() => {
    const saved = localStorage.getItem('vertex_show_node_info_panel');
    return saved !== null ? saved === 'true' : true;
  });

  // Responsive canvas size
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  useEffect(() => {
    const compute = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const sidePadding = 0;
      const rightPanel = showNodeInfoPanel ? 320 : 0;
      const topNav = 0; // we use a spacer below nav already
      const verticalMargin = 0;
      const width = Math.max(600, W - sidePadding - rightPanel);
      const height = Math.max(400, H - topNav - verticalMargin);
      setCanvasSize({ width, height });
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [showNodeInfoPanel]);

  // Context menu state
  const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0, target: null });

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
    if (Array.isArray(data) &&
        data.every(n => n.id && typeof n.x === 'number' && typeof n.y === 'number' && typeof n.label === 'string')) {
      console.log('Importing valid diagram data:', data.length, 'nodes');
      // Clone and upgrade the data to ensure compatibility with enhanced nodes
      const importedNodes = data.map(node => createEnhancedNode({ ...node }));
      setNodes(importedNodes);
      setUndoStack([]);
      setRedoStack([]);
      setSelectedNodeId(null);
      // Center the view on the imported diagram
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
    const layoutedNodes = organizeLayout(nodes);
    pushUndo(layoutedNodes);
  }, [nodes, pushUndo]);

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
    setContextMenu({ open: true, x: payload.screenX, y: payload.screenY, target: payload });
  }, []);

  // Enhanced node creation helper
  const createNewNode = useCallback((parentId, position) => {
    const maxId = Math.max(...nodes.map(n => n.id), 0);
    return createEnhancedNode({
      id: maxId + 1,
      label: intl.formatMessage({ id: 'node.newNode' }),
      x: position.x,
      y: position.y,
      parentId
    });
  }, [nodes, intl]);

  // Compute a non-overlapping position for a new child around its parent
  const findNonOverlappingChildPosition = useCallback((parent, allNodes) => {
    const tempId = -1;
    const radii = [140, 180, 220, 260];
    const tries = 16;
    let best = { pos: { x: parent.x + 140, y: parent.y }, score: Infinity };

    for (const r of radii) {
      for (let i = 0; i < tries; i++) {
        const angle = (2 * Math.PI / tries) * i;
        const pos = { x: parent.x + Math.cos(angle) * r, y: parent.y + Math.sin(angle) * r };
        const candidate = { id: tempId, label: intl.formatMessage({ id: 'node.newNode' }), x: pos.x, y: pos.y, parentId: parent.id };
        const collisions = detectCollisions([...allNodes, candidate]);
        // Count overlap involving candidate
        const involving = collisions.filter(c => c.nodeA === tempId || c.nodeB === tempId);
        if (involving.length === 0) {
          return pos; // perfect spot
        }
        const overlapSum = involving.reduce((s, c) => s + (c.overlap || 0), 0);
        if (overlapSum < best.score) {
          best = { pos, score: overlapSum };
        }
      }
    }
    return best.pos;
  }, [intl]);

  // Save nodes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('vertex_nodes', JSON.stringify(nodes));
  }, [nodes]);

  // Node info panel handlers
  const handleToggleNodeInfoPanel = useCallback(() => {
    setShowNodeInfoPanel(prev => !prev);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCommandKey = e.metaKey || e.ctrlKey;
      
      if (e.code === 'Space') {
        // Prevent spacebar from scrolling
        e.preventDefault();
      }

      if (e.code === 'Escape') {
        // Handle help panel
        setIsHelpVisible(false);
        window.localStorage.setItem('xmindHelpTriggerState', '0');
      } else if (isCommandKey) {
        switch (e.key.toLowerCase()) {
          case 'n': {
            e.preventDefault();
            console.log('New diagram');
            const initialNodes = [createEnhancedNode({ id: 1, label: intl.formatMessage({ id: 'node.centralTopic' }), x: 400, y: 300, parentId: null })];
            setNodes([...initialNodes]);
            setUndoStack([]);
            setRedoStack([]);
            setSelectedNodeId(null);
            localStorage.removeItem('vertex_nodes');
            setTimeout(() => {
              if (canvasRef.current?.center) canvasRef.current.center();
            }, 0);
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
            e.preventDefault();
            console.log('Import JSON');
            fileInputRef.current?.click();
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
      } else if (selectedNodeId) {
        // Node-specific shortcuts that require a selected node
        if (e.key === 'Tab') {
          e.preventDefault();
          pushUndo((nodes => {
            const parent = nodes.find(n => n.id === selectedNodeId);
            if (!parent) return nodes;

            const { x, y } = findNonOverlappingChildPosition(parent, nodes);
            return [
              ...nodes,
              createNewNode(parent.id, { x, y })
            ];
          })(nodes));
        } else if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
          e.preventDefault();
          const newLabel = window.prompt(intl.formatMessage({ id: 'node.enterName' }), nodes.find(n => n.id === selectedNodeId)?.label || '');
          if (newLabel) {
            pushUndo(nodes.map(n => n.id === selectedNodeId ? { ...n, label: newLabel } : n));
          }
        } else if (e.key === 'F2') {
          e.preventDefault();
          handleNodeDoubleClick(selectedNodeId);
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          pushUndo((nodes => {
            const collectIds = (id, acc) => {
              acc.push(id);
              nodes.filter(n => n.parentId === id).forEach(n => collectIds(n.id, acc));
              return acc;
            };
            const idsToDelete = collectIds(selectedNodeId, []);
            return nodes.filter(n => !idsToDelete.includes(n.id));
          })(nodes));
          setSelectedNodeId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvasRef, fileInputRef, handleUndo, handleRedo, handleExport, handleAutoLayout, handleShowSearch, handleToggleNodeInfoPanel, selectedNodeId, nodes, pushUndo, intl, createNewNode]);

  // Load help panel state from localStorage on initial render
  useEffect(() => {
    const savedState = window.localStorage.getItem('xmindHelpTriggerState');
    setIsHelpVisible(savedState !== '0');
  }, []);

  // Toggles the help panel and saves the state
  const toggleHelp = () => {
    const newVisibility = !isHelpVisible;
    setIsHelpVisible(newVisibility);
    window.localStorage.setItem('xmindHelpTriggerState', newVisibility ? '1' : '0');
  };

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
    setSelectedNodeId(nodeId);
    setSelectedNodeIds([nodeId]);
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

  const handleDeleteNode = useCallback((nodeId) => {
    const collectIds = (id, acc) => {
      acc.push(id);
      nodes.filter(n => n.parentId === id).forEach(n => collectIds(n.id, acc));
      return acc;
    };
    const idsToDelete = collectIds(nodeId, []);
    pushUndo(nodes.filter(n => !idsToDelete.includes(n.id)));
    setSelectedNodeIds([]);
    setSelectedNodeId(null);
    setShowNodeEditor(false);
    setEditingNodeId(null);
  }, [nodes, pushUndo]);

  const handleEditNodeFromPanel = useCallback((nodeId) => {
    setEditingNodeId(nodeId);
    setShowNodeEditor(true);
  }, []);

  const handleDeleteNodesFromPanel = useCallback((nodeIds) => {
    const collectIds = (id, acc) => {
      acc.push(id);
      nodes.filter(n => n.parentId === id).forEach(n => collectIds(n.id, acc));
      return acc;
    };
    
    let allIdsToDelete = [];
    nodeIds.forEach(id => {
      allIdsToDelete = [...allIdsToDelete, ...collectIds(id, [])];
    });
    
    pushUndo(nodes.filter(n => !allIdsToDelete.includes(n.id)));
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

  return (
    <React.Fragment>
      <MenuBar
        onExport={handleExport}
        onImport={handleImport}
        nodes={nodes}
        setNodes={setNodes}
        setUndoStack={setUndoStack}
        setRedoStack={setRedoStack}
        setSelectedNodeId={setSelectedNodeId}
        canvasRef={canvasRef}
        onNew={() => {
          console.log('New diagram');
          const initialNodes = [createEnhancedNode({ id: 1, label: intl.formatMessage({ id: 'node.centralTopic' }), x: 400, y: 300, parentId: null })];
          setNodes([...initialNodes]);
          setUndoStack(() => []);
          setRedoStack(() => []);
          setSelectedNodeId(null);
          // Clear the saved state when creating a new diagram
          localStorage.removeItem('vertex_nodes');
          // Give a small delay for the canvas to initialize
          setTimeout(() => {
            console.log('Centering canvas', { canvasRef: !!canvasRef.current, center: !!canvasRef.current?.center });
            if (canvasRef.current?.center) canvasRef.current.center();
          }, 0);
        }}
        onExportPNG={() => alert('Export as PNG not implemented yet.')}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDelete={() => {
          console.log('Delete:', { selectedNodeId });
          if (!selectedNodeId) {
            console.log('No node selected for deletion');
            return;
          }
          const collectIds = (id, acc) => {
            acc.push(id);
            nodes.filter(n => n.parentId === id).forEach(n => collectIds(n.id, acc));
            return acc;
          };
          const idsToDelete = collectIds(selectedNodeId, []);
          console.log('Deleting nodes:', { idsToDelete, totalNodes: nodes.length });
          pushUndo(nodes.filter(n => !idsToDelete.includes(n.id)));
          setSelectedNodeId(null);
        }}
        onAutoLayout={handleAutoLayout}
        onSearch={handleShowSearch}
        onCenter={() => {
            console.log('Center canvas:', { canvasRef: !!canvasRef.current, center: !!canvasRef.current?.center, fitToView: !!canvasRef.current?.fitToView });
          if (canvasRef.current?.fitToView) canvasRef.current.fitToView();
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
      />
      <div style={{ height: 48 }} />
      <MainHeader />

      {/* Help trigger button, now floating bottom right */}
  <div style={{ position: 'fixed', right: 32, bottom: 32, zIndex: 10010 }}>
        <div className={triggerClass} onClick={toggleHelp}>
          <i className="trigger-icon" />
          <div className="trigger-tooltip">
            {isHelpVisible ? '收起' : '帮助'}
          </div>
        </div>
      </div>

      <HelpPanel isVisible={isHelpVisible} withPanel={showNodeInfoPanel} />

      {/* Diagram canvas */}
      <VertexCanvas
        ref={canvasRef}
        nodes={nodes}
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

      {/* Minimap */}
      <Minimap
        nodes={nodes}
        viewBox={viewBox}
        visible={showMinimap}
        onViewportChange={(newViewport) => {
          if (canvasRef.current?.setViewport) {
            canvasRef.current.setViewport(newViewport);
          }
        }}
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
        plugins={corePlugins}
        appApi={{
          // selection and nodes
          nodes,
          selectedNodeIds,
          selectedNodes: selectedNodeIds.map(id => nodes.find(n => n.id === id)).filter(Boolean),
          // node info panel state/handlers
          showNodeInfoPanel,
          hideNodeInfoPanel: () => setShowNodeInfoPanel(false),
          onEditNode: handleEditNodeFromPanel,
          onDeleteNodes: handleDeleteNodesFromPanel,
          onToggleCollapse: handleToggleCollapseFromPanel,
        }}
      />

      {/* Context Menu */}
      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        isOpen={contextMenu.open}
        onClose={closeContextMenu}
      >
        {contextMenu.target?.nodeId ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={() => {
              closeContextMenu();
              handleNodeDoubleClick(contextMenu.target.nodeId);
            }}>Edit Node</button>
            <button onClick={() => {
              closeContextMenu();
              handleToggleCollapseFromPanel(contextMenu.target.nodeId);
            }}>Toggle Collapse</button>
            <button onClick={() => {
              closeContextMenu();
              handleDeleteNode(contextMenu.target.nodeId);
            }}>Delete Node</button>
            <button onClick={() => {
              closeContextMenu();
              const parent = nodes.find(n => n.id === contextMenu.target.nodeId);
              if (!parent) return;
              const pos = findNonOverlappingChildPosition(parent, nodes);
              const newNode = createNewNode(parent.id, pos);
              pushUndo([...nodes, newNode]);
            }}>Add Child</button>
            <button onClick={() => {
              closeContextMenu();
              canvasRef.current?.focusOnNode?.(contextMenu.target.nodeId);
            }}>Center on Node</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={() => {
              closeContextMenu();
              const pos = { x: contextMenu.target?.worldX ?? 0, y: contextMenu.target?.worldY ?? 0 };
              const newNode = createNewNode(null, pos);
              pushUndo([...nodes, newNode]);
            }}>Add Node Here</button>
            <button onClick={() => { closeContextMenu(); handleAutoLayout(); }}>Auto Layout</button>
            <button onClick={() => { closeContextMenu(); canvasRef.current?.center?.(); }}>Center View</button>
            <button onClick={() => { closeContextMenu(); canvasRef.current?.resetZoom?.(); }}>Reset Zoom</button>
          </div>
        )}
      </ContextMenu>
    </React.Fragment>
  );
}

export default App;
