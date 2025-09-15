import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PluginHost from '../../plugins/PluginHost.jsx';

describe('PluginHost ErrorBoundary', () => {
  it('isolates errors from crashing the app and shows fallback', () => {
    const badPlugin = {
      id: 'test.bad',
      slots: {
        sidePanels: [
          {
            id: 'boom',
            render: () => {
              throw new Error('Kaboom');
            },
          },
        ],
      },
    };
    const { container } = render(<PluginHost plugins={[badPlugin]} appApi={{}} />);
    // The fallback should appear instead of unmounting/crashing
    expect(screen.getByText('Plugin Error')).toBeInTheDocument();
    expect(container).toBeTruthy();
  });
});

