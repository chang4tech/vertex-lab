import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Markdown from '../../../components/common/Markdown.jsx';

describe('Markdown', () => {
  it('renders paragraphs starting with formatting characters without looping', () => {
    render(<Markdown text="**Highlights**\n- First item\n- Second item" />);
    expect(screen.getByText((content) => content.includes('**Highlights**'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('First item'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Second item'))).toBeInTheDocument();
  });
});
