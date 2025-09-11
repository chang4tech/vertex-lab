import React, { useState, useEffect, useRef } from 'react';
import MindMapCanvas from './MindMapCanvas.jsx';
// --- Menu Bar Component ---
function MenuBar({
  onExport, onImport, onNew, onExportPNG, onUndo, onRedo, onDelete, onCenter, onZoomIn, onZoomOut, onResetZoom, onToggleDark
}) {
  const fileInputRef = useRef();
  const [openMenu, setOpenMenu] = React.useState(null); // 'file' | 'edit' | 'view' | 'settings' | null
  // Close menu on click outside
  React.useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [openMenu]);
  const menuDropdown = (type, items) => openMenu === type && (
    <div style={{
      position: 'absolute', top: 32, left: 0, background: '#fff', border: '1px solid #eee', borderRadius: 4,
      boxShadow: '0 2px 8px rgba(0,0,0,0.12)', minWidth: 140, zIndex: 1000, padding: '4px 0'
    }} onClick={e => e.stopPropagation()}>{items}</div>
  );
  return (
    <nav style={{
      width: '100%', background: '#fff', borderBottom: '1px solid #eee',
      display: 'flex', alignItems: 'center', padding: '0 24px', height: 48, zIndex: 200, position: 'fixed', top: 0, left: 0, right: 0
    }}>
      <div style={{ fontWeight: 700, fontSize: 18, marginRight: 32 }}>🧠 MindMap</div>
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ cursor: 'pointer', position: 'relative' }}>
          <span onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === 'file' ? null : 'file'); }}>File</span>
          {menuDropdown('file', <>
            <div style={{ padding: '8px 20px', cursor: 'pointer' }} onClick={() => { onNew(); setOpenMenu(null); }}>New</div>
            <div style={{ padding: '8px 20px', cursor: 'pointer' }} onClick={() => { onExport(); setOpenMenu(null); }}>Export JSON</div>
            <div style={{ padding: '8px 20px', cursor: 'pointer' }} onClick={() => { onExportPNG(); setOpenMenu(null); }}>Export PNG</div>
            <div style={{ padding: '8px 20px', cursor: 'pointer' }} onClick={() => { fileInputRef.current.click(); setOpenMenu(null); }}>Import JSON</div>
            <input ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = evt => {
                  try {
                    const data = JSON.parse(evt.target.result);
                    onImport(data);
                  } catch {
                    alert('Invalid JSON file');
                  }
                };
                reader.readAsText(file);
                e.target.value = '';
              }}
            />
          </>)}
        </div>
        <div style={{ cursor: 'pointer', position: 'relative' }}>
          <span onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === 'edit' ? null : 'edit'); }}>Edit</span>
          {menuDropdown('edit', <>
            <div style={{ padding: '8px 20px', cursor: 'pointer' }} onClick={() => { onUndo(); setOpenMenu(null); }}>Undo</div>
            <div style={{ padding: '8px 20px', cursor: 'pointer' }} onClick={() => { onRedo(); setOpenMenu(null); }}>Redo</div>
            <div style={{ padding: '8px 20px', cursor: 'pointer' }} onClick={() => { onDelete(); setOpenMenu(null); }}>Delete</div>
          </>)}
        </div>
        <div style={{ cursor: 'pointer', position: 'relative' }}>
          <span onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === 'view' ? null : 'view'); }}>View</span>
          {menuDropdown('view', <>
            <div style={{ padding: '8px 20px', cursor: 'pointer' }} onClick={() => { onCenter(); setOpenMenu(null); }}>Center</div>
            <div style={{ padding: '8px 20px', cursor: 'pointer' }} onClick={() => { onZoomIn(); setOpenMenu(null); }}>Zoom In</div>
            <div style={{ padding: '8px 20px', cursor: 'pointer' }} onClick={() => { onZoomOut(); setOpenMenu(null); }}>Zoom Out</div>
            <div style={{ padding: '8px 20px', cursor: 'pointer' }} onClick={() => { onResetZoom(); setOpenMenu(null); }}>Reset Zoom</div>
          </>)}
        </div>
        <div style={{ cursor: 'pointer', position: 'relative' }}>
          <span onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === 'settings' ? null : 'settings'); }}>Settings</span>
          {menuDropdown('settings', <>
            <div style={{ padding: '8px 20px', cursor: 'pointer' }} onClick={() => { onToggleDark(); setOpenMenu(null); }}>Toggle Dark Mode</div>
          </>)}
        </div>
      </div>
    </nav>
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
  // Undo/redo stacks
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Canvas ref for view actions
  const canvasRef = useRef();

  // Mind map state: simple demo tree
  const [nodes, setNodes] = useState([
    { id: 1, label: '中心主题', x: 400, y: 300, parentId: null },
    { id: 2, label: '分支1', x: 250, y: 200, parentId: 1 },
    { id: 3, label: '分支2', x: 550, y: 200, parentId: 1 },
    { id: 4, label: '分支3', x: 250, y: 400, parentId: 1 },
    { id: 5, label: '分支4', x: 550, y: 400, parentId: 1 },
  ]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  // Helper to push to undo stack
  const pushUndo = (newNodes) => {
    setUndoStack(stack => [...stack, nodes]);
    setRedoStack([]);
    setNodes(newNodes);
  };

  // Undo/Redo handlers
  const handleUndo = () => {
    setUndoStack(stack => {
      if (stack.length === 0) return stack;
      setRedoStack(rstack => [nodes, ...rstack]);
      setNodes(stack[stack.length - 1]);
      return stack.slice(0, -1);
    });
  };
  const handleRedo = () => {
    setRedoStack(stack => {
      if (stack.length === 0) return stack;
      setUndoStack(ustack => [...ustack, nodes]);
      setNodes(stack[0]);
      return stack.slice(1);
    });
  };

  // Export mind map as JSON
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(nodes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Format: graph-YYYYMMDD-HHmmss.json
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
  };

  // Import mind map from JSON
  const handleImport = (data) => {
    if (Array.isArray(data) && data.every(n => n.id && typeof n.x === 'number' && typeof n.y === 'number')) {
      pushUndo(data);
      setSelectedNodeId(null);
    } else {
      alert('Invalid mind map data');
    }
  };

  // State to manage the visibility of the help panel
  const [isHelpVisible, setIsHelpVisible] = useState(true);

  // Load the saved state from localStorage on initial render
  useEffect(() => {
    const savedState = window.localStorage.getItem('xmindHelpTriggerState');
    setIsHelpVisible(savedState !== '0');
    const handleKeyDown = (event) => {
      if (event.code.toLowerCase() === 'escape') {
        setIsHelpVisible(false);
        window.localStorage.setItem('xmindHelpTriggerState', '0');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
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
    setSelectedNodeId(nodeId);
  };

  // Keyboard shortcuts for editing and deleting
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedNodeId) return;
      // Add child node on Tab
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
            { id: maxId + 1, label: '新节点', x, y, parentId: parent.id }
          ];
        })(nodes));
      }
      // Rename node on Enter
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        const newLabel = window.prompt('输入新名称:', nodes.find(n => n.id === selectedNodeId)?.label || '');
        if (newLabel) {
          pushUndo(nodes.map(n => n.id === selectedNodeId ? { ...n, label: newLabel } : n));
        }
      }
      // Delete node and its children on Delete/Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, nodes]);

  return (
    <React.Fragment>
      <MenuBar
        onExport={handleExport}
        onImport={handleImport}
        onNew={() => {
          const initialNodes = [{ id: 1, label: '中心主题', x: 400, y: 300, parentId: null }];
          setNodes(initialNodes);
          setUndoStack([]);
          setRedoStack([]);
          setSelectedNodeId(null);
          if (canvasRef.current && canvasRef.current.center) {
            canvasRef.current.center();
          }
        }}
        onExportPNG={() => alert('Export as PNG not implemented yet.')}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDelete={() => {
          if (!selectedNodeId) return;
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
        }}
        onCenter={() => canvasRef.current && canvasRef.current.center && canvasRef.current.center()}
        onZoomIn={() => canvasRef.current && canvasRef.current.zoom && canvasRef.current.zoom(1.1)}
        onZoomOut={() => canvasRef.current && canvasRef.current.zoom && canvasRef.current.zoom(0.9)}
        onResetZoom={() => canvasRef.current && canvasRef.current.resetZoom && canvasRef.current.resetZoom()}
        onToggleDark={() => alert('Dark mode not implemented yet.')}
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
      />
    </React.Fragment>
  );
}

export default App;
