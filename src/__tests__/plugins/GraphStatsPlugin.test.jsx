import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PluginHost from '../../plugins/PluginHost.jsx';
import { graphStatsPlugin } from '../../plugins/core/graphStatsPlugin.jsx';

describe('graphStatsPlugin', () => {
  it('shows counts for nodes, edges, selection', () => {
    render(
      <PluginHost
        plugins={[graphStatsPlugin]}
        appApi={{ nodes: [{ id: 'a' }, { id: 'b' }], edges: [{ source: 'a', target: 'b' }], selectedNodeIds: ['a'] }}
      />
    );
    expect(screen.getByText(/Graph Stats/)).toBeInTheDocument();
    expect(screen.getByText(/Nodes: 2/)).toBeInTheDocument();
    expect(screen.getByText(/Edges: 1/)).toBeInTheDocument();
    expect(screen.getByText(/Selected: 1/)).toBeInTheDocument();
  });
});

