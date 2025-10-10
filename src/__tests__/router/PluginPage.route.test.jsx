import React from 'react';
import { describe, it, expect } from 'vitest';
import { SimpleRouter } from '../../router/SimpleRouter.jsx';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from '../../contexts/ThemeContext.jsx';

describe('Plugin route', () => {
  it('renders Plugin Not Found for unknown plugin id', async () => {
    const originalHash = window.location.hash;
    window.location.hash = '#/plugin/does.not.exist';
    render(
      <IntlProvider locale="en">
        <ThemeProvider>
          <SimpleRouter />
        </ThemeProvider>
      </IntlProvider>
    );
    expect(await screen.findByText(/Plugin Not Found/)).toBeInTheDocument();
    window.location.hash = originalHash;
  });
});
