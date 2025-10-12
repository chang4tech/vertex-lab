import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { LanguageMenu } from '../../App.jsx';

const TEST_LOCALES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'es-ES', label: 'Español' },
];

const renderLanguageMenu = (props = {}) => {
  const onSelect = vi.fn();
  const view = render(
    <IntlProvider locale="en" messages={{}}>
      <LanguageMenu locales={TEST_LOCALES} activeLocale="en-US" onSelect={onSelect} {...props} />
    </IntlProvider>,
  );
  const languageLabel = screen.getByText('Language');
  const menuItem = languageLabel.closest('.menu-item--submenu');
  if (!menuItem) {
    throw new Error('Language menu trigger not found');
  }
  const submenu = screen.getByRole('menu');
  return { ...view, onSelect, menuItem, submenu };
};

describe('LanguageMenu', () => {
  it('keeps the submenu open when the pointer leaves without interaction', () => {
    const { menuItem, submenu } = renderLanguageMenu();

    fireEvent.mouseEnter(menuItem);
    expect(submenu.classList.contains('open')).toBe(true);

    expect(submenu.classList.contains('open')).toBe(true);

    fireEvent.mouseLeave(menuItem, { relatedTarget: document.body });
    expect(submenu.classList.contains('open')).toBe(true);
  });

  it('closes the submenu when clicking outside the menu', async () => {
    const { menuItem, submenu } = renderLanguageMenu();

    fireEvent.mouseEnter(menuItem);
    expect(submenu.classList.contains('open')).toBe(true);

    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(submenu.classList.contains('open')).toBe(false);
    });
  });
});
