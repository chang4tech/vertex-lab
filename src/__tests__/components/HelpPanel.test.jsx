import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HelpPanel } from '../../components/panels/HelpPanel';

describe('HelpPanel', () => {
  it('renders when visible', () => {
    const { container } = render(<HelpPanel isVisible={true} />);

    // Check key names
    const keySpans = container.querySelectorAll('.key');
    expect(keySpans[0].textContent).toBe('Tab');
    expect(keySpans[1].textContent).toBe('Enter');
    expect(keySpans[2].textContent).toBe('Shift+Enter');
    expect(keySpans[3].textContent).toBe('Alt+Up');
    expect(keySpans[4].textContent).toBe('Alt+Down');

    // Check descriptions
    const descSpans = container.querySelectorAll('.desc');
    expect(descSpans[0].textContent).toBe('插入后置节点');
    expect(descSpans[1].textContent).toBe('插入子节点');
    expect(descSpans[2].textContent).toBe('插入前置节点');
    expect(descSpans[3].textContent).toBe('向上移动节点');
    expect(descSpans[4].textContent).toBe('向下移动节点');
  });

  it('applies show class when visible', () => {
    const { container } = render(<HelpPanel isVisible={true} />);
    const helpElement = container.querySelector('.help');
    const rulesElement = container.querySelector('.rules');
    expect(helpElement).toHaveClass('show');
    expect(rulesElement).toHaveClass('show');
  });

  it('does not apply show class when not visible', () => {
    const { container } = render(<HelpPanel isVisible={false} />);
    const helpElement = container.querySelector('.help');
    const rulesElement = container.querySelector('.rules');
    expect(helpElement).not.toHaveClass('show');
    expect(rulesElement).not.toHaveClass('show');
  });

  it('renders all keyboard shortcuts', () => {
    const { container } = render(<HelpPanel isVisible={true} />);

    const shortcuts = [
      { key: 'Tab', desc: '插入后置节点' },
      { key: 'Enter', desc: '插入子节点' },
      { key: 'Shift+Enter', desc: '插入前置节点' },
      { key: 'Alt+Up', desc: '向上移动节点' },
      { key: 'Alt+Down', desc: '向下移动节点' },
      { key: 'Alt+Left', desc: '向左移动节点' },
      { key: 'Alt+Right', desc: '向右移动节点' },
      { key: 'Delete', desc: '删除节点' },
      { key: 'Space', desc: '编辑节点' },
      { key: 'Escape', desc: '取消编辑' }
    ];

    shortcuts.forEach(({ desc }) => {
      const descElement = Array.from(container.querySelectorAll('.desc')).find(el => el.textContent === desc);
      expect(descElement).toBeTruthy();
    });
  });

  it('maintains correct structure', () => {
    const { container } = render(<HelpPanel isVisible={true} />);
    
    // Check structure
    const helpElement = container.querySelector('.help');
    const rulesElement = container.querySelector('.rules');
    const ruleElements = container.querySelectorAll('.rule');

    expect(helpElement).toBeTruthy();
    expect(rulesElement).toBeTruthy();
    expect(ruleElements.length).toBe(11);
    
    // Check each rule has key and description
    ruleElements.forEach(rule => {
      expect(rule.querySelector('.key')).toBeTruthy();
      expect(rule.querySelector('.desc')).toBeTruthy();
    });
  });
});
