import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { searchNodes, highlightMatches, getSearchHistory, addToSearchHistory, clearSearchHistory } from '../utils/searchUtils';

const Search = ({ 
  nodes, 
  onSelectNode, 
  onHighlightNodes, 
  visible, 
  onClose,
  selectedNodeId 
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const intl = useIntl();

  // Load search history
  useEffect(() => {
    setSearchHistory(getSearchHistory());
  }, []);

  // Focus input when visible
  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible]);

  // Perform search when query changes
  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      setShowHistory(true);
      onHighlightNodes([]);
    } else {
      const searchResults = searchNodes(nodes, query);
      setResults(searchResults);
      setShowHistory(false);
      setSelectedIndex(0);
      
      // Highlight matching nodes on canvas
      const highlightedNodeIds = searchResults.map(result => result.node.id);
      onHighlightNodes(highlightedNodeIds);
    }
  }, [query, nodes, onHighlightNodes]);

  const handleSearch = useCallback((searchQuery) => {
    setQuery(searchQuery);
    if (searchQuery.trim() !== '') {
      addToSearchHistory(searchQuery);
      setSearchHistory(getSearchHistory());
    }
  }, []);

  const handleSelectResult = useCallback((result) => {
    onSelectNode(result.node.id);
    onClose();
  }, [onSelectNode, onClose]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const maxIndex = showHistory ? searchHistory.length - 1 : results.length - 1;
      setSelectedIndex(prev => Math.min(prev + 1, maxIndex));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showHistory && searchHistory[selectedIndex]) {
        handleSearch(searchHistory[selectedIndex]);
      } else if (results[selectedIndex]) {
        handleSelectResult(results[selectedIndex]);
      }
    }
  }, [onClose, showHistory, searchHistory, results, selectedIndex, handleSearch, handleSelectResult]);

  const handleInputFocus = () => {
    if (query.trim() === '') {
      setShowHistory(true);
    }
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setSearchHistory([]);
  };

  if (!visible) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="search-overlay" onClick={handleOverlayClick} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 10200,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '100px'
    }}>
      <div className="search-container" style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        width: '500px',
        maxWidth: '90vw',
        maxHeight: '70vh',
        overflow: 'hidden'
      }}>
        {/* Search Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ fontSize: '20px' }}>🔍</div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            placeholder={intl.formatMessage({ id: 'search.placeholder', defaultMessage: 'Search nodes...' })}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '16px',
              padding: '8px 0'
            }}
          />
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#666',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Results/History */}
        <div 
          ref={resultsRef}
          style={{
            maxHeight: '400px',
            overflowY: 'auto'
          }}
        >
          {showHistory && searchHistory.length > 0 && (
            <div>
              <div style={{
                padding: '12px 20px',
                fontSize: '12px',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <FormattedMessage id="search.recentSearches" defaultMessage="Recent Searches" />
                <button
                  onClick={handleClearHistory}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: '#666',
                    fontSize: '11px',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  <FormattedMessage id="search.clearHistory" defaultMessage="Clear" />
                </button>
              </div>
              {searchHistory.map((historyItem, index) => (
                <div
                  key={index}
                  data-testid={`search-history-${index}`}
                  onClick={() => handleSearch(historyItem)}
                  style={{
                    padding: '12px 20px',
                    cursor: 'pointer',
                    backgroundColor: selectedIndex === index ? '#f5f5f5' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  aria-selected={selectedIndex === index}
                >
                  <div style={{ opacity: 0.5 }}>🕒</div>
                  <div>{historyItem}</div>
                </div>
              ))}
            </div>
          )}

          {!showHistory && query.trim() !== '' && (
            <div>
              {results.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#666'
                }}>
                  <div style={{ fontSize: '48px', opacity: 0.3, marginBottom: '12px' }}>🔍</div>
                  <FormattedMessage 
                    id="search.noResults" 
                    defaultMessage="No nodes found for '{query}'"
                    values={{ query }}
                  />
                </div>
              ) : (
                <div>
                  <div style={{
                    padding: '12px 20px',
                    fontSize: '12px',
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    <FormattedMessage 
                      id="search.resultsCount" 
                      defaultMessage="{count} {count, plural, one {result} other {results}}"
                      values={{ count: results.length }}
                    />
                  </div>
                  {results.map((result, index) => (
                    <div
                      key={result.node.id}
                      data-testid={`search-result-${result.node.id}`}
                      onClick={() => handleSelectResult(result)}
                      style={{
                        padding: '12px 20px',
                        cursor: 'pointer',
                        backgroundColor: selectedIndex === index ? '#f5f5f5' : 
                                        result.node.id === selectedNodeId ? '#e3f2fd' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        borderLeft: result.node.id === selectedNodeId ? '3px solid #1976d2' : '3px solid transparent'
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      aria-selected={selectedIndex === index}
                    >
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#e3f2fd',
                        border: '2px solid #1976d2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: '#1976d2'
                      }}>
                        {result.node.id}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div 
                          dangerouslySetInnerHTML={{
                            __html: highlightMatches(result.node.label, result.matchedIndices)
                          }}
                          style={{ fontWeight: result.exact ? 'bold' : 'normal' }}
                        />
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#666', 
                          marginTop: '2px' 
                        }}>
                          {result.exact ? 
                            <FormattedMessage id="search.exactMatch" defaultMessage="Exact match" /> :
                            <FormattedMessage 
                              id="search.matchScore" 
                              defaultMessage="{score}% match"
                              values={{ score: Math.round(result.score * 100) }}
                            />
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showHistory && searchHistory.length === 0 && query.trim() === '' && (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#666'
            }}>
              <div style={{ fontSize: '48px', opacity: 0.3, marginBottom: '12px' }}>🔍</div>
              <FormattedMessage id="search.startTyping" defaultMessage="Start typing to search nodes" />
            </div>
          )}
        </div>

        {/* Search Tips */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #eee',
          fontSize: '12px',
          color: '#666',
          backgroundColor: '#f9f9f9'
        }}>
          <FormattedMessage 
            id="search.tips" 
            defaultMessage="Tips: Use ↑↓ to navigate, Enter to select, Esc to close"
          />
        </div>
      </div>
    </div>
  );
};

export default Search;
