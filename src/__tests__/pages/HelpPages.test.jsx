import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import HelpFeedbackPage from '../../pages/HelpFeedbackPage.jsx';
import HelpReportPage from '../../pages/HelpReportPage.jsx';

describe('Help feedback/report pages', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.location.hash = '#/help';
  });

  const wrap = (node) => render(<IntlProvider locale="en">{node}</IntlProvider>);

  it('renders feedback contacts and navigates back', () => {
    sessionStorage.setItem('vertex_help_return', '#/canvas');
    wrap(<HelpFeedbackPage />);
    expect(screen.getByRole('heading', { name: /Send Feedback/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ideas@vertexlab.app' })).toHaveAttribute('href', 'mailto:ideas@vertexlab.app');
    expect(screen.getByRole('link', { name: 'bugs@vertexlab.app' })).toHaveAttribute('href', 'mailto:bugs@vertexlab.app');

    fireEvent.click(screen.getByRole('button', { name: /Back to graph/ }));
    expect(sessionStorage.getItem('vertex_help_return')).toBeNull();
    expect(window.location.hash).toBe('#/canvas');
  });

  it('renders report contacts and navigates back', () => {
    sessionStorage.setItem('vertex_help_return', '#/canvas');
    wrap(<HelpReportPage />);
    expect(screen.getByRole('heading', { name: /Report a Problem/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'incidents@vertexlab.app' })).toHaveAttribute('href', 'mailto:incidents@vertexlab.app');
    expect(screen.getByRole('link', { name: 'support@vertexlab.app' })).toHaveAttribute('href', 'mailto:support@vertexlab.app');

    fireEvent.click(screen.getAllByRole('button', { name: /Back to graph/ })[0]);
    expect(sessionStorage.getItem('vertex_help_return')).toBeNull();
    expect(window.location.hash).toBe('#/canvas');
  });
});
