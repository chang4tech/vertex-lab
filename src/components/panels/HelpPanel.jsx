import React from  return (
    <div role="dialog" className={`help ${isVisible ? 'show' : ''}`}>
      <div className="rules">
        <h2>Keyboard Shortcuts</h2>
        {shortcuts.map(({ key, desc }) => (
          <div className="rule" key={key}>
            <span className="key">{key}</span>
            <span className="desc">{desc}</span>
          </div>
        ))}
      </div>
      <button onClick={onClose}>Close</button>
    </div>
```ort function HelpPanel({ isVisible, onClose }) {
  const shortcuts = [
    { key: 'Tab', desc: '插入后置节点' },
    { key: 'Enter', desc: '插入子节点' },
    { key: 'Shift+Enter', desc: '插入前置节点' },
    { key: 'Alt+Up', desc: '向上移动节点' },
    { key: 'Alt+Down', desc: '向下移动节点' },
    { key: 'Alt+Left', desc: '向左移动节点' },
    { key: 'Alt+Right', desc: '向右移动节点' },
    { key: 'Delete', desc: '删除节点' },
    { key: 'F2', desc: '编辑节点' },
    { key: 'Space', desc: '编辑节点' },
    { key: 'Escape', desc: '取消编辑' }
  ];

  return (
    <div role="dialog" className={`help ${isVisible ? 'show' : ''}`}>
      <div className={`rules ${isVisible ? 'show' : ''}`}>
        <h2>Keyboard Shortcuts</h2>
        {shortcuts.map(({ key, desc }) => (
          <div className="rule" key={key}>
            <span className="key">{key}</span>
            <span className="desc">{desc}</span>
          </div>
        ))}
      </div>
      <button onClick={onClose}>Close</button>
    </div>
  );
}
