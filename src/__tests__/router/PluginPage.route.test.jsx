import React from 'react';
import { describe, it, expect } from 'vitest';
import { SimpleRouter } from '../../router/SimpleRouter.jsx';
import { render, screen } from '@testing-library/react';

describe('Plugin route', () => {
  it('renders Plugin Not Found for unknown plugin id', () => {
    const originalHash = window.location.hash;
    window.location.hash = '#/plugin/does.not.exist/config';
    render(<SimpleRouter />);
    expect(screen.getByText(/Plugin Not Found/)).toBeInTheDocument();
    window.location.hash = originalHash;
  });
});

