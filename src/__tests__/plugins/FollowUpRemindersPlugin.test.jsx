import React from 'react';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
let PluginHost;
let ThemeProvider;

describe('followUpRemindersPlugin', () => {
  let followUpRemindersPlugin;

  const STORAGE_KEY = 'plugin_followUpReminders_v1';

  const baseAppApi = {
    nodes: [{ id: 'a', title: 'Alpha' }],
    selectedNodeIds: ['a'],
    selectNode: vi.fn(),
    selectNodes: vi.fn(),
    onHighlightNodes: vi.fn(),
    menuBarBottom: 80,
  };

  const renderPlugin = (appApiOverrides = {}) => {
    const appApi = { ...baseAppApi, ...appApiOverrides };
    return render(
      <IntlProvider locale="en">
        <ThemeProvider>
          <PluginHost plugins={[followUpRemindersPlugin]} appApi={appApi} />
        </ThemeProvider>
      </IntlProvider>
    );
  };

  beforeEach(async () => {
    vi.resetModules();
    localStorage.getItem.mockReset();
    localStorage.setItem.mockReset();
    localStorage.removeItem?.mockReset?.();
    localStorage.getItem.mockImplementation(() => null);
    ({ ThemeProvider } = await import('../../contexts/ThemeContext.jsx'));
    ({ default: PluginHost } = await import('../../plugins/PluginHost.jsx'));
    ({ followUpRemindersPlugin } = await import('../../plugins/examples/followUpRemindersPlugin.jsx'));
  });

  it('renders follow-up panel for the selected node', () => {
    renderPlugin();
    expect(screen.getByText('Follow-up Reminders')).toBeInTheDocument();
    expect(screen.getByText('Reminder for: Alpha')).toBeInTheDocument();
    expect(screen.getByLabelText('Follow-up date')).toBeInTheDocument();
  });

  it('saves a reminder and persists it to storage', async () => {
    renderPlugin();
    const dueInput = screen.getByLabelText('Follow-up date');
    const noteInput = screen.getByLabelText('Notes (optional)');

    fireEvent.change(dueInput, { target: { value: '2025-03-01T12:30' } });
    fireEvent.change(noteInput, { target: { value: 'Call back client' } });
    fireEvent.click(screen.getByText('Save reminder'));

    const reminderCalls = localStorage.setItem.mock.calls.filter(([key]) => key === STORAGE_KEY);
    expect(reminderCalls.length).toBeGreaterThan(0);
    expect(reminderCalls.at(-1)?.[1]).toContain('"a"');
    const noteInstances = await screen.findAllByText('Call back client');
    expect(noteInstances.some((node) => node.tagName === 'DIV')).toBe(true);
    expect(screen.getByText('Reminder saved.')).toBeInTheDocument();
    expect(screen.getAllByText('Saved reminder').length).toBeGreaterThan(0);
    expect(screen.getByText('Mark done')).toBeInTheDocument();
  });

  it('hydrates existing reminders from storage', async () => {
    const now = new Date();
    const reminderState = {
      a: {
        nodeId: 'a',
        dueAt: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
        note: 'Check status',
        createdAt: now.toISOString(),
      },
    };
    localStorage.getItem.mockImplementation((key) => (key === STORAGE_KEY ? JSON.stringify(reminderState) : null));

    renderPlugin();

    const hydratedNotes = await screen.findAllByText('Check status');
    expect(hydratedNotes.some((node) => node.tagName === 'DIV')).toBe(true);
    expect(screen.getAllByText('Saved reminder').length).toBeGreaterThan(0);
    expect(screen.getByText('Mark done')).toBeInTheDocument();
  });
});
