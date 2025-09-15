import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PluginHost from '../../plugins/PluginHost.jsx';

describe('PluginHost overlays', () => {
  it('renders canvasOverlays contributions', () => {
    const overlayPlugin = {
      id: 'test.overlay',
      slots: {
        canvasOverlays: [
          { id: 'o1', render: () => <div data-testid="overlay">Overlay</div> },
        ],
      },
    };
    render(<PluginHost plugins={[overlayPlugin]} appApi={{}} />);
    expect(screen.getByTestId('overlay')).toBeInTheDocument();
  });
});

