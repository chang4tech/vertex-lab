import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import NodeInfoPanel from '../../components/NodeInfoPanel.jsx';
import { ThemeProvider } from '../../contexts/ThemeContext.jsx';

vi.mock('../../hooks/useIsMobile', () => ({ useIsMobile: () => true }));

describe('NodeInfoPanel mobile layout', () => {
  it('uses a narrower width on mobile', () => {
    const { container } = render(
      <IntlProvider locale="en" messages={{}}>
        <ThemeProvider>
          <NodeInfoPanel selectedNodes={[]} visible={true} onClose={() => {}} />
        </ThemeProvider>
      </IntlProvider>
    );
    const panel = container.querySelector('div');
    // Find the fixed positioned container (top: 48px; right: 0)
    const fixed = Array.from(container.querySelectorAll('div')).find(el => {
      const style = el.getAttribute('style') || '';
      return style.includes('position: fixed') && style.includes('right: 0');
    });
    expect(fixed).toBeTruthy();
    expect(fixed.getAttribute('style')).toMatch(/width: 280px/);
  });
});
