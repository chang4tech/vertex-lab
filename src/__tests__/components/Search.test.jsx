import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import Search from '../../../src/components/Search.jsx';
import * as searchUtils from '../../../src/utils/searchUtils';

vi.mock('../../../src/utils/searchUtils', async () => {
  const actual = await vi.importActual('../../../src/utils/searchUtils');
  return {
    ...actual,
    getSearchHistory: vi.fn(() => ['apple', 'banana']),
    addToSearchHistory: vi.fn(),
    clearSearchHistory: vi.fn(),
  };
});

const mockNodes = [
  { id: '1', label: 'Apple' },
  { id: '2', label: 'Banana' },
  { id: '3', label: 'Orange' },
];

const renderSearch = (props) => {
  const defaultProps = {
    nodes: mockNodes,
    onSelectNode: vi.fn(),
    onHighlightNodes: vi.fn(),
    visible: true,
    onClose: vi.fn(),
    selectedNodeId: null,
  };
  return render(
    <IntlProvider locale="en">
      <Search {...defaultProps} {...props} />
    </IntlProvider>
  );
};

describe('Search component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial state correctly', () => {
    searchUtils.getSearchHistory.mockReturnValueOnce([]);
    renderSearch();
    expect(screen.getByPlaceholderText('Search nodes...')).toBeInTheDocument();
    expect(screen.getByText('Start typing to search nodes')).toBeInTheDocument();
  });

  it('shows search history on focus', () => {
    renderSearch();
    fireEvent.focus(screen.getByPlaceholderText('Search nodes...'));
    expect(screen.getByText('Recent Searches')).toBeInTheDocument();
    expect(screen.getByText('apple')).toBeInTheDocument();
    expect(screen.getByText('banana')).toBeInTheDocument();
  });

  it('clears search history', () => {
    renderSearch();
    fireEvent.focus(screen.getByPlaceholderText('Search nodes...'));
    fireEvent.click(screen.getByText('Clear'));
    expect(searchUtils.clearSearchHistory).toHaveBeenCalled();
  });

  it('performs a search and displays results', () => {
    renderSearch();
    const input = screen.getByPlaceholderText('Search nodes...');
    fireEvent.change(input, { target: { value: 'apple' } });
    expect(screen.getByText('1 result')).toBeInTheDocument();
    expect(screen.getByText(/Apple/)).toBeInTheDocument();
  });

  it('shows no results message', () => {
    renderSearch();
    const input = screen.getByPlaceholderText('Search nodes...');
    fireEvent.change(input, { target: { value: 'xyz' } });
    expect(screen.getByText(/No nodes found for/)).toBeInTheDocument();
  });

  it('handles keyboard navigation down and up', async () => {
    renderSearch();
    const input = screen.getByPlaceholderText('Search nodes...');
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'a' } });
    });

    const appleResult = screen.getByTestId('search-result-1');
    const bananaResult = screen.getByTestId('search-result-2');

    await act(async () => {
      fireEvent.keyDown(input, { key: 'ArrowDown' });
    });
    expect(appleResult).toHaveAttribute('aria-selected', 'true');

    await act(async () => {
      fireEvent.keyDown(input, { key: 'ArrowDown' });
    });
    expect(bananaResult).toHaveAttribute('aria-selected', 'true');

    await act(async () => {
      fireEvent.keyDown(input, { key: 'ArrowUp' });
    });
    expect(appleResult).toHaveAttribute('aria-selected', 'true');
  });


  it('selects a result with Enter key', () => {
    const onSelectNode = vi.fn();
    const onClose = vi.fn();
    renderSearch({ onSelectNode, onClose });
    const input = screen.getByPlaceholderText('Search nodes...');
    fireEvent.change(input, { target: { value: 'apple' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelectNode).toHaveBeenCalledWith('1');
    expect(onClose).toHaveBeenCalled();
  });

  it('closes with Escape key', () => {
    const onClose = vi.fn();
    renderSearch({ onClose });
    const input = screen.getByPlaceholderText('Search nodes...');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onHighlightNodes when query changes', () => {
    const onHighlightNodes = vi.fn();
    renderSearch({ onHighlightNodes });
    const input = screen.getByPlaceholderText('Search nodes...');
    fireEvent.change(input, { target: { value: 'apple' } });
    expect(onHighlightNodes).toHaveBeenCalledWith(['1']);
  });
});
