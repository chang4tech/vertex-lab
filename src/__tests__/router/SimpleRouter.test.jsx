import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SimpleRouter } from '../../router/SimpleRouter.jsx';
import { LocaleProvider } from '../../i18n/LocaleProvider.jsx';
import { ThemeProvider } from '../../contexts/ThemeContext.jsx';

function renderWithProviders(ui) {
  return render(
    <ThemeProvider>
      <LocaleProvider>
        {ui}
      </LocaleProvider>
    </ThemeProvider>
  );
}

// Mock App to avoid mounting canvas-heavy content
vi.mock('../../App.jsx', () => ({
  default: ({ graphId }) => (
    <div>
      <div>Mock App</div>
      {graphId && <div>GraphID:{graphId}</div>}
    </div>
  )
}));

describe('SimpleRouter', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('renders landing page by default', () => {
    renderWithProviders(<SimpleRouter />);
    expect(screen.getByText(/Vertex Lab/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New Graph/i })).toBeInTheDocument();
  });

  it('renders graph page when hash has graph id', () => {
    const id = 'test-graph-1234';
    window.location.hash = `#/g/${id}`;
    renderWithProviders(<SimpleRouter />);
    // ID is passed to App
    expect(screen.getByText(new RegExp(`GraphID:${id}`))).toBeInTheDocument();
  });
});
