import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PluginHost from '../../plugins/PluginHost.jsx';
import { centralityLensPlugin } from '../../plugins/examples/centralityLensPlugin.jsx';

function renderHost(nodes, edges) {
  return render(
    <PluginHost plugins={[centralityLensPlugin]} appApi={{ nodes, edges }} />
  );
}

describe('Centrality Lens Plugin', () => {
  it('lists top nodes by degree (fallback sync in tests)', async () => {
    const nodes = [
      { id: 1, label: 'A' },
      { id: 2, label: 'B' },
      { id: 3, label: 'C' },
    ];
    const edges = [
      { source: 1, target: 2, directed: false },
      { source: 1, target: 3, directed: false },
    ];
    renderHost(nodes, edges);
    // Should show node #1 as top entry (degree 2)
    expect(await screen.findByText('#1')).toBeInTheDocument();
  });
});

