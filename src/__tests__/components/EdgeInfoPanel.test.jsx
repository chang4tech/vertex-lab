import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from '../../contexts/ThemeContext.jsx';
import EdgeInfoPanel from '../../components/EdgeInfoPanel.jsx';

vi.mock('../../hooks/useIsMobile', () => ({ useIsMobile: () => false }));

const TestWrapper = ({ children }) => (
  <IntlProvider locale="en" messages={{}}>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </IntlProvider>
);

describe('EdgeInfoPanel', () => {
  it('supports inline layout for mobile drawer rendering', () => {
    const nodes = [
      { id: 1, label: 'Alpha' },
      { id: 2, label: 'Beta' },
    ];
    const edges = [
      { id: '1-2', source: 1, target: 2, directed: false },
    ];

    const { container } = render(
      <TestWrapper>
        <EdgeInfoPanel
          nodes={nodes}
          edges={edges}
          selectedNodeIds={[1]}
          visible
          layout="inline"
        />
      </TestWrapper>
    );

    const root = container.firstChild;
    expect(root).toBeTruthy();
    expect(root.style.position).toBe('relative');
    expect(root.style.width).toBe('100%');
  });
});
