import React from 'react';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PluginHost from '../../plugins/PluginHost.jsx';

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
    return render(<PluginHost plugins={[followUpRemindersPlugin]} appApi={appApi} />);
  };

  beforeEach(async () => {
    vi.resetModules();
    localStorage.getItem.mockReset();
    localStorage.setItem.mockReset();
    localStorage.removeItem?.mockReset?.();
    localStorage.getItem.mockImplementation(() => null);
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

    expect(localStorage.setItem).toHaveBeenCalled();
    const lastCall = localStorage.setItem.mock.calls.at(-1);
    expect(lastCall?.[0]).toBe(STORAGE_KEY);
    expect(lastCall?.[1]).toContain('"a"');
    expect(await screen.findByText('Call back client')).toBeInTheDocument();
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

    expect(await screen.findByText('Check status')).toBeInTheDocument();
    expect(screen.getByText('Mark done')).toBeInTheDocument();
  });
});
