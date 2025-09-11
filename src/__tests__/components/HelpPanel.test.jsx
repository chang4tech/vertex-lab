import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HelpPanel } from '../../components/panels/HelpPanel';

describe('HelpPanel', () => {
  it('renders when visible', () => {
    render(<HelpPanel isVisible={true} />);
    
    // Check all shortcuts are displayed
    expect(screen.getByText('Tab')).toBeInTheDocument();
    expect(screen.getByText('Enter')).toBeInTheDocument();
    expect(screen.getByText('Shift')).toBeInTheDocument();
    expect(screen.getByText('Ctrl')).toBeInTheDocument();
    
    // Check shortcut descriptions
    expect(screen.getByText('插入子节点')).toBeInTheDocument();
    expect(screen.getByText('插入后置节点')).toBeInTheDocument();
    expect(screen.getByText('插入前置节点')).toBeInTheDocument();
    expect(screen.getByText('插入父节点')).toBeInTheDocument();
  });

  it('applies show class when visible', () => {
    const { container } = render(<HelpPanel isVisible={true} />);
    const rulesElement = container.querySelector('.rules');
    expect(rulesElement).toHaveClass('show');
  });

  it('does not apply show class when not visible', () => {
    const { container } = render(<HelpPanel isVisible={false} />);
    const rulesElement = container.querySelector('.rules');
    expect(rulesElement).not.toHaveClass('show');
  });

  it('renders all keyboard shortcuts', () => {
    render(<HelpPanel isVisible={true} />);
    
    const shortcuts = [
      { key: 'Tab', desc: '插入子节点' },
      { key: 'Enter', desc: '插入后置节点' },
      { key: 'Shift + Enter', desc: '插入前置节点' },
      { key: 'Ctrl + Enter', desc: '插入父节点' },
      { key: 'Ctrl + ←↑↓→', desc: '多节点选择' },
      { key: 'Shift + ←↑↓→', desc: '移动节点' },
      { key: 'Ctrl + e', desc: '展开/收起节点' },
      { key: 'Space + 左键', desc: '拖动画布' },
      { key: 'Ctrl + o', desc: '导入文件' },
      { key: 'Ctrl + s', desc: '导出为文件' },
      { key: 'Ctrl + Shift + s', desc: '导出为图片' }
    ];

    shortcuts.forEach(({ desc }) => {
      expect(screen.getByText(desc)).toBeInTheDocument();
    });
  });

  it('maintains correct structure', () => {
    const { container } = render(<HelpPanel isVisible={true} />);
    
    // Check structure
    expect(container.querySelector('.help')).toBeInTheDocument();
    expect(container.querySelector('.rules')).toBeInTheDocument();
    expect(container.querySelectorAll('.rule')).toHaveLength(11);
    
    // Check each rule has key and description
    container.querySelectorAll('.rule').forEach(rule => {
      expect(rule.querySelector('.key')).toBeInTheDocument();
      expect(rule.querySelector('.desc')).toBeInTheDocument();
    });
  });
});
