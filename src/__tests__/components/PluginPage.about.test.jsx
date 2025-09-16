import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PluginPage from '../../components/PluginPage.jsx';

describe('PluginPage about section', () => {
  it('shows How to Use for selection tools', () => {
    window.location.hash = '#/plugin/core.selectionTools';
    render(<PluginPage pluginId="core.selectionTools" />);
    expect(screen.getByText(/How to Use/i)).toBeInTheDocument();
    expect(screen.getByText(/Appears when you select/)).toBeInTheDocument();
  });
});
