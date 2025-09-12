import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import MindMapCanvas from './MindMapCanvas.jsx';
import { Minimap } from './components/panels/Minimap';
import Settings from './components/Settings';
import { LocaleSelector } from './i18n/LocaleProvider';
import { organizeLayout } from './utils/layoutUtils';

// --- Menu Bar Component ---
function MenuBar({
  onExport, onImport, onNew, onUndo, onRedo, onDelete, onAutoLayout, onCenter, onZoomIn, onZoomOut, onResetZoom, onToggleDark,
  nodes, setNodes, setUndoStack, setRedoStack, setSelectedNodeId, canvasRef,
  showMinimap, setShowMinimap
}) {
  const fileInputRef = useRef();
  const [openMenu, setOpenMenu] = useState(null); // 'file' | 'edit' | 'view' | 'settings' | null
  const [showSettings, setShowSettings] = useState(false);
  const intl = useIntl();

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
      background: '#fff',
      border: '1px solid #eee',
      borderRadius: 4,
      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      minWidth: 140,
      zIndex: 1000,
      padding: '4px 0'
    }}>{items}</div>
  );
  return (
    <>
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      <nav style={{
        width: '100%', background: '#fff', borderBottom: '1px solid #eee',
        display: 'flex', alignItems: 'center', padding: '0 24px', height: 48, zIndex: 200, position: 'fixed', top: 0, left: 0, right: 0
      }}>
      <div style={{ fontWeight: 700, fontSize: 18, marginRight: 32 }}>🧠 MindMap</div>
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
          </>)}
        </div>
        <div style={{ cursor: 'pointer', position: 'relative' }}>
          <span className="menu-trigger" onClick={(e) => {
            e.preventDefault();
            console.log('View menu clicked');
            setOpenMenu(openMenu === 'view' ? null : 'view');
          }}><FormattedMessage id="menu.view" defaultMessage="View" /></span>
          {menuDropdown('view', <>
            <div
              style={{ padding: '8px 20px', cursor: 'pointer' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Center clicked');
                onCenter();
                setOpenMenu(null);
              }}
            ><FormattedMessage id="view.center" defaultMessage="Center" /></div>
            <div
              style={{ padding: '8px 20px', cursor: 'pointer' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Zoom In clicked');
                onZoomIn();
                setOpenMenu(null);
              }}
            ><FormattedMessage id="view.zoomIn" defaultMessage="Zoom In" /></div>
            <div
              style={{ padding: '8px 20px', cursor: 'pointer' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Zoom Out clicked');
                onZoomOut();
                setOpenMenu(null);
              }}
            ><FormattedMessage id="view.zoomOut" defaultMessage="Zoom Out" /></div>
            <div
              style={{ padding: '8px 20px', cursor: 'pointer' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Reset Zoom clicked');
                onResetZoom();
                setOpenMenu(null);
              }}
            ><FormattedMessage id="view.resetZoom" defaultMessage="Reset Zoom" /></div>
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
              {showMinimap && <span style={{ marginLeft: 8 }}>✓</span>}
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
                  const library = JSON.parse(localStorage.getItem('mindmap_library') || '{}');
                  library[name] = nodes;
                  localStorage.setItem('mindmap_library', JSON.stringify(library));
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
                const library = JSON.parse(localStorage.getItem('mindmap_library') || '{}');
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
                const library = JSON.parse(localStorage.getItem('mindmap_library') || '{}');
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
                  localStorage.setItem('mindmap_library', JSON.stringify(library));
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
                onToggleDark();
                setOpenMenu(null);
              }}
            ><FormattedMessage id="view.toggleDarkMode" defaultMessage="Toggle Dark Mode" /></div>
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
const HelpPanel = ({ isVisible }) => {
    const rulesClass = `rules ${isVisible ? 'show' : ''}`;
    return (
        <div className="help">
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
    const saved = localStorage.getItem('mindmap_show_minimap');
    return saved !== null ? saved === 'true' : false;
  });
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 600 });

  // Save minimap visibility preference
  useEffect(() => {
    localStorage.setItem('mindmap_show_minimap', showMinimap);
  }, [showMinimap]);

  // Mind map state with localStorage persistence
  const [nodes, setNodes] = useState(() => {
    const savedNodes = localStorage.getItem('mindmap_nodes');
    if (savedNodes) {
      try {
        return JSON.parse(savedNodes);
      } catch (e) {
        console.error('Failed to parse saved nodes:', e);
      }
    }
    // Default initial state if no saved state exists
    return [
      { id: 1, label: 'Central Topic', x: 400, y: 300, parentId: null },
      { id: 2, label: 'Branch 1', x: 250, y: 200, parentId: 1 },
      { id: 3, label: 'Branch 2', x: 550, y: 200, parentId: 1 },
      { id: 4, label: 'Branch 3', x: 250, y: 400, parentId: 1 },
      { id: 5, label: 'Branch 4', x: 550, y: 400, parentId: 1 },
    ];
  });
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  useEffect(() => {
    setNodes(nodes => {
      if (nodes && nodes.length > 0 && nodes[0].label === 'Central Topic') {
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
      console.log('Importing valid mind map data:', data.length, 'nodes');
      // Clone the data to ensure we don't modify the original
      const importedNodes = data.map(node => ({ ...node }));
      setNodes(importedNodes);
      setUndoStack([]);
      setRedoStack([]);
      setSelectedNodeId(null);
      // Center the view on the imported mind map
      setTimeout(() => {
        if (canvasRef.current?.center) {
          console.log('Centering view on imported mind map');
          canvasRef.current.center();
        }
      }, 0);
    } else {
      console.error('Invalid mind map data:', data);
      alert('Invalid mind map data: Must contain nodes with id, label, x, y properties');
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

  // Save nodes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('mindmap_nodes', JSON.stringify(nodes));
  }, [nodes]);

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
            console.log('New mind map');
            const initialNodes = [{ id: 1, label: intl.formatMessage({ id: 'node.centralTopic' }), x: 400, y: 300, parentId: null }];
            setNodes([...initialNodes]);
            setUndoStack([]);
            setRedoStack([]);
            setSelectedNodeId(null);
            localStorage.removeItem('mindmap_nodes');
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
        }
      } else if (selectedNodeId) {
        // Node-specific shortcuts that require a selected node
        if (e.key === 'Tab') {
          e.preventDefault();
          pushUndo((nodes => {
            const parent = nodes.find(n => n.id === selectedNodeId);
            if (!parent) return nodes;
            const maxId = Math.max(...nodes.map(n => n.id));
            const angle = Math.random() * 2 * Math.PI;
            const dist = 120;
            const x = parent.x + Math.cos(angle) * dist;
            const y = parent.y + Math.sin(angle) * dist;
            return [
              ...nodes,
              { id: maxId + 1, label: intl.formatMessage({ id: 'node.newNode' }), x, y, parentId: parent.id }
            ];
          })(nodes));
        } else if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
          e.preventDefault();
          const newLabel = window.prompt(intl.formatMessage({ id: 'node.enterName' }), nodes.find(n => n.id === selectedNodeId)?.label || '');
          if (newLabel) {
            pushUndo(nodes.map(n => n.id === selectedNodeId ? { ...n, label: newLabel } : n));
          }
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
  }, [canvasRef, fileInputRef, handleUndo, handleRedo, handleExport, handleAutoLayout, selectedNodeId, nodes, pushUndo, intl]);

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

  // Node click handler
  const handleNodeClick = (nodeId) => {
    console.log('Node clicked:', { nodeId, currentSelected: selectedNodeId });
    setSelectedNodeId(nodeId);
  };

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
          console.log('New mind map');
          const initialNodes = [{ id: 1, label: intl.formatMessage({ id: 'node.centralTopic' }), x: 400, y: 300, parentId: null }];
          setNodes([...initialNodes]);
          setUndoStack(() => []);
          setRedoStack(() => []);
          setSelectedNodeId(null);
          // Clear the saved state when creating a new mind map
          localStorage.removeItem('mindmap_nodes');
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
        onCenter={() => {
          console.log('Center canvas:', { canvasRef: !!canvasRef.current, center: !!canvasRef.current?.center });
          if (canvasRef.current?.center) canvasRef.current.center();
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
        onToggleDark={() => alert('Dark mode not implemented yet.')}
        showMinimap={showMinimap}
        setShowMinimap={setShowMinimap}
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

      <HelpPanel isVisible={isHelpVisible} />

      {/* Mind map canvas */}
      <MindMapCanvas
        ref={canvasRef}
        nodes={nodes}
        onNodeClick={handleNodeClick}
        selectedNodeId={selectedNodeId}
        onNodePositionChange={(id, x, y) => {
          pushUndo(nodes.map(n => n.id === id ? { ...n, x, y } : n));
        }}
        onViewBoxChange={setViewBox}
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
    </React.Fragment>
  );
}

export default App;

