import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import PluginHost from '../../plugins/PluginHost.jsx';

describe('PluginHost overlays', () => {
  it('emits canvasOverlays contributions via onOverlaysChange', async () => {
    const overlayPlugin = {
      id: 'test.overlay',
      slots: {
        canvasOverlays: [
          { id: 'o1', render: () => <div data-testid="overlay">Overlay</div> },
        ],
      },
    };
    const handleOverlays = vi.fn();

    render(<PluginHost plugins={[overlayPlugin]} appApi={{}} onOverlaysChange={handleOverlays} />);

    await waitFor(() => expect(handleOverlays).toHaveBeenCalled());

    const overlays = handleOverlays.mock.calls.at(-1)?.[0] || [];
    expect(overlays).toHaveLength(1);
    expect(overlays[0]).toMatchObject({
      pluginId: 'test.overlay',
      overlayId: 'o1',
    });
    expect(overlays[0].element).toBeTruthy();
  });
});
