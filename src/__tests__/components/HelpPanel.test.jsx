import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HelpPanel } from '../../components/panels/HelpPanel';

describe('HelpPanel', () => {
  it('renders when visible', () => {
    const { container } = render(<HelpPanel isVisible={true} />);

    const keySpans = container.querySelectorAll('.key');
    expect(keySpans.length).toBeGreaterThan(10);
    // Basic sanity on first few entries
    expect(keySpans[0].textContent).toBe('⌘ + ⇧ + N / Ctrl + ⇧ + N');
    expect(keySpans[1].textContent).toBe('⌘ + S / Ctrl + S');
    expect(keySpans[2].textContent).toBe('⌘ + ⇧ + S / Ctrl + ⇧ + S');

    // Check some descriptions
    const descSpans = container.querySelectorAll('.desc');
    const descTexts = Array.from(descSpans).map(d => d.textContent);
    expect(descTexts).toContain('New Diagram');
    expect(descTexts).toContain('Export JSON');
    expect(descTexts).toContain('Export PNG');
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

    const expected = [
      'New Diagram', 'Export JSON', 'Export PNG', 'Import JSON',
      'Undo', 'Redo', 'Auto Layout', 'Search',
      'Zoom In', 'Zoom Out', 'Reset Zoom', 'Center Diagram',
      'Toggle Node Info Panel', 'Toggle Minimap', 'Delete Selected', 'Edit Node'
    ];

    const descTexts = Array.from(container.querySelectorAll('.desc')).map(el => el.textContent);
    expected.forEach(text => {
      expect(descTexts).toContain(text);
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
    expect(ruleElements.length).toBeGreaterThanOrEqual(12);
    
    // Check each rule has key and description
    ruleElements.forEach(rule => {
      expect(rule.querySelector('.key')).toBeTruthy();
      expect(rule.querySelector('.desc')).toBeTruthy();
    });
  });
});
