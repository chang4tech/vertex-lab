import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from '../../contexts/ThemeContext.jsx';
import PluginHost from '../../plugins/PluginHost.jsx';
import { graphStatsPlugin } from '../../plugins/core/graphStatsPlugin.jsx';

describe('graphStatsPlugin', () => {
  it('shows counts for nodes, edges, selection', () => {
    render(
      <IntlProvider locale="en">
        <ThemeProvider>
          <PluginHost
            plugins={[graphStatsPlugin]}
            appApi={{ nodes: [{ id: 'a' }, { id: 'b' }], edges: [{ source: 'a', target: 'b' }], selectedNodeIds: ['a'] }}
          />
        </ThemeProvider>
      </IntlProvider>
    );
    const headings = screen.getAllByText(/Graph Stats/);
    const panelHeading = headings[headings.length - 1];
    const panelContent = panelHeading.closest('.plugin-side-panels__content');
    expect(panelContent).toBeTruthy();
    const scoped = within(panelContent);
    const byText = (expected) => (_content, node) => node?.textContent?.trim() === expected;
    expect(scoped.getByText(byText('Nodes: 2'))).toBeInTheDocument();
    expect(scoped.getByText(byText('Edges: 1'))).toBeInTheDocument();
    expect(scoped.getByText(byText('Selected: 1'))).toBeInTheDocument();
  });
});
