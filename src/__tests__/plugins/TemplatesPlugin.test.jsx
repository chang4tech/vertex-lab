import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import PluginHost from '../../plugins/PluginHost.jsx';
import { templatesPlugin } from '../../plugins/core/templatesPlugin.jsx';
import { ThemeProvider } from '../../contexts/ThemeContext.jsx';
import { LocaleProvider } from '../../i18n/LocaleProvider.jsx';

function renderWithProviders(ui) {
  return render(
    <LocaleProvider>
      <ThemeProvider>{ui}</ThemeProvider>
    </LocaleProvider>
  );
}

describe('Templates Plugin - Mapping & Schema Import', () => {
  it('applies type/property mapping and optionally imports schema', async () => {
    // Ensure panel is visible
    localStorage.setItem('plugin_core.templates.showPanel', '1');

    const updateNodes = vi.fn();
    const updateEdges = vi.fn();

    const appApi = {
      nodes: [],
      edges: [],
      pluginPrefs: {},
      overlayLayout: { overrides: { items: {}, slots: {} } },
      setOverlayLayout: vi.fn(),
      resetOverlayLayout: vi.fn(),
      graphId: 'test',
      updateNodes,
      updateEdges,
    };

    renderWithProviders(<PluginHost plugins={[templatesPlugin]} appApi={appApi} />);

    // Build a minimal pack with schema and one node
    const pack = {
      meta: { name: 'Test Pack', version: '1.0.0' },
      schema: {
        types: [
          {
            name: 'Paper',
            color: '#1e3a8a',
            properties: [
              { name: 'year', type: 'number' },
              { name: 'author', type: 'string' },
            ],
          },
        ],
        edgeTypes: [],
      },
      tags: [],
      properties: [],
      nodes: [
        { id: 1001, type: 'Paper', label: 'Seed', year: 2020, author: 'Bob' },
      ],
      edges: [],
    };

    // Trigger Import… input
    const importLabel = await screen.findByText('Import Pack…');
    const input = importLabel.closest('label')?.querySelector('input[type="file"]');
    expect(input).toBeTruthy();
    const file = new File([JSON.stringify(pack)], 'pack.json', { type: 'application/json' });
    await fireEvent.change(input, { target: { files: [file] } });

    // Wait for mapping UI to appear
    await screen.findByText('Schema (optional)');

    // Map type: Paper -> Document
    const typeInput = screen.getByPlaceholderText('Paper');
    fireEvent.change(typeInput, { target: { value: 'Document' } });

    // Map property: author -> writer
    const propAuthorInput = screen.getByPlaceholderText('author');
    fireEvent.change(propAuthorInput, { target: { value: 'writer' } });

    // Enable schema import (merge into Schema Manager)
    const importSchemaToggle = screen.getByLabelText('Import schema into Schema Manager');
    fireEvent.click(importSchemaToggle);

    // Apply
    const applyBtn = screen.getByText('Apply');
    fireEvent.click(applyBtn);

    // Assert nodes updated with mapped type/property
    expect(updateNodes).toHaveBeenCalled();
    const nextNodesArg = updateNodes.mock.calls[0][0];
    expect(Array.isArray(nextNodesArg)).toBe(true);
    const added = nextNodesArg[nextNodesArg.length - 1];
    expect(added).toMatchObject({ label: 'Seed', type: 'Document', year: 2020 });
    expect(added.author).toBeUndefined();
    expect(added.writer).toBe('Bob');

    // Assert schema imported with mapped type/property names
    const raw = localStorage.getItem('vertex_graph_schema_test');
    expect(raw).toBeTruthy();
    const schema = JSON.parse(raw);
    const t = (schema.types || []).find((x) => x.name === 'Document');
    expect(t).toBeTruthy();
    const propNames = new Set((t.properties || []).map((p) => p.name));
    expect(propNames.has('year')).toBe(true);
    expect(propNames.has('writer')).toBe(true);
    expect(propNames.has('author')).toBe(false);
  });
});
