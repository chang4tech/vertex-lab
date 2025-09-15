import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import TagManager from '../../components/TagManager.jsx';
import { ThemeProvider } from '../../contexts/ThemeContext.jsx';
import { LocaleProvider } from '../../i18n/LocaleProvider.jsx';

const renderWithProviders = (ui) => {
  return render(
    <ThemeProvider>
      <LocaleProvider>{ui}</LocaleProvider>
    </ThemeProvider>
  );
};

describe('Tag Manager import/export and persistence', () => {
  beforeEach(() => {
    // Reset localStorage mocks
    localStorage.getItem.mockReset();
    localStorage.setItem.mockReset();
    localStorage.removeItem.mockReset?.();
  });

  it('exports tags as JSON (serialize)', async () => {
    // Provide preset tags via storage
    const preset = [
      { id: 'alpha', name: 'Alpha', color: '#111111' },
      { id: 'beta', name: 'Beta', color: '#222222' }
    ];
    localStorage.getItem.mockImplementation((k) => (k === 'vertex_tags' ? JSON.stringify(preset) : null));

    // Capture Blob passed to createObjectURL
    const orig = URL.createObjectURL;
    let seenBlob = null;
    URL.createObjectURL = vi.fn((blob) => {
      seenBlob = blob;
      return 'blob://tags';
    });

    renderWithProviders(<TagManager onClose={() => {}} />);

    // Click Export Tags
    fireEvent.click(screen.getByRole('button', { name: /Export Tags/i }));

    // Assert Blob captured and contains JSON
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(seenBlob).toBeTruthy();
    // Read blob text via Response helper
    // Helper to read blob text using FileReader for compatibility
    const text = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(String(e.target.result));
      reader.onerror = reject;
      reader.readAsText(seenBlob);
    });
    const parsed = JSON.parse(text);
    expect(parsed).toEqual(preset);

    URL.createObjectURL = orig; // restore
  });

  it('imports valid tag presets and validates shape', async () => {
    localStorage.getItem.mockReturnValue(null);
    renderWithProviders(<TagManager onClose={() => {}} />);

    // Open import (click to focus the hidden input via button)
    const importBtn = screen.getByRole('button', { name: /Import Tags/i });
    fireEvent.click(importBtn);

    // Find the hidden file input inside settings content
    const fileInput = document.querySelector('input[type="file"][accept="application/json"]');
    expect(fileInput).toBeTruthy();

    const valid = [
      { id: 't1', name: 'Tag 1', color: '#123456' },
      { id: 't2', name: 'Tag 2', color: '#abcdef' }
    ];
    const file = new File([JSON.stringify(valid)], 'tags.json', { type: 'application/json' });
    // Trigger change
    await act(async () => {
      await fireEvent.change(fileInput, { target: { files: [file] } });
      await new Promise(r => setTimeout(r, 0));
      await new Promise(r => setTimeout(r, 0));
    });

    // UI should reflect imported tags
    expect(screen.getByDisplayValue('Tag 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tag 2')).toBeInTheDocument();
  });

  it('rejects invalid import shapes and preserves existing tags', async () => {
    // Start with one preset
    const preset = [{ id: 'a', name: 'A', color: '#111111' }];
    localStorage.getItem.mockImplementation((k) => (k === 'vertex_tags' ? JSON.stringify(preset) : null));

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderWithProviders(<TagManager onClose={() => {}} />);

    const fileInput = document.querySelector('input[type="file"][accept="application/json"]');
    // Invalid: not an array
    const bad1 = new File([JSON.stringify({ foo: 'bar' })], 'bad.json', { type: 'application/json' });
    // Snapshot count of tag name textboxes
    const before = document.querySelectorAll('.tags-manager input[type="text"]').length;
    await act(async () => {
      await fireEvent.change(fileInput, { target: { files: [bad1] } });
      await new Promise(r => setTimeout(r, 0));
      await new Promise(r => setTimeout(r, 0));
    });

    // Invalid: array with wrong shapes
    const bad2 = new File([JSON.stringify([{ id: 'x', name: 123, color: true }])], 'bad2.json', { type: 'application/json' });
    await act(async () => {
      await fireEvent.change(fileInput, { target: { files: [bad2] } });
      await new Promise(r => setTimeout(r, 0));
      await new Promise(r => setTimeout(r, 0));
    });
    const after = document.querySelectorAll('.tags-manager input[type="text"]').length;
    expect(after).toBe(before);
  });
});
