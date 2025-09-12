export function fuzzySearch(query, text, threshold = 0.3) {
  if (!query || !text) return { matches: false, score: 0, matchedIndices: [] };
  
  query = query.toLowerCase();
  text = text.toLowerCase();
  
  // Exact match gets highest score
  if (text.includes(query)) {
    const startIndex = text.indexOf(query);
    const matchedIndices = [];
    for (let i = startIndex; i < startIndex + query.length; i++) {
      matchedIndices.push(i);
    }
    return { matches: true, score: 1.0, matchedIndices, exact: true };
  }
  
  // Fuzzy matching using Levenshtein-like algorithm
  let queryIndex = 0;
  let textIndex = 0;
  let matches = 0;
  const matchedIndices = [];
  
  while (queryIndex < query.length && textIndex < text.length) {
    if (query[queryIndex] === text[textIndex]) {
      matchedIndices.push(textIndex);
      matches++;
      queryIndex++;
    }
    textIndex++;
  }
  
  const score = matches / query.length;
  const matches_threshold = score >= threshold;
  
  return {
    matches: matches_threshold,
    score,
    matchedIndices,
    exact: false
  };
}

export function searchNodes(nodes, query) {
  if (!query || query.trim() === '') {
    return [];
  }
  
  const results = [];
  
  nodes.forEach(node => {
    const searchResult = fuzzySearch(query, node.label);
    if (searchResult.matches) {
      results.push({
        node,
        ...searchResult
      });
    }
  });
  
  // Sort by score (highest first), then by exact matches
  results.sort((a, b) => {
    if (a.exact && !b.exact) return -1;
    if (!a.exact && b.exact) return 1;
    return b.score - a.score;
  });
  
  return results;
}

export function highlightMatches(text, matchedIndices) {
  if (!matchedIndices || matchedIndices.length === 0) {
    return text;
  }
  
  let result = '';
  let lastIndex = 0;
  
  // Group consecutive indices
  const groups = [];
  let currentGroup = [matchedIndices[0]];
  
  for (let i = 1; i < matchedIndices.length; i++) {
    if (matchedIndices[i] === matchedIndices[i-1] + 1) {
      currentGroup.push(matchedIndices[i]);
    } else {
      groups.push(currentGroup);
      currentGroup = [matchedIndices[i]];
    }
  }
  groups.push(currentGroup);
  
  // Build highlighted text
  groups.forEach(group => {
    const start = group[0];
    const end = group[group.length - 1];
    
    // Add text before highlight
    result += text.slice(lastIndex, start);
    // Add highlighted text
    result += `<mark>${text.slice(start, end + 1)}</mark>`;
    lastIndex = end + 1;
  });
  
  // Add remaining text
  result += text.slice(lastIndex);
  
  return result;
}

// Search history management
const SEARCH_HISTORY_KEY = 'mindmap_search_history';
const MAX_HISTORY_ITEMS = 10;

export function getSearchHistory() {
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (e) {
    console.error('Error loading search history:', e);
    return [];
  }
}

export function addToSearchHistory(query) {
  if (!query || query.trim() === '') return;
  
  try {
    let history = getSearchHistory();
    
    // Remove if already exists
    history = history.filter(item => item !== query);
    
    // Add to beginning
    history.unshift(query);
    
    // Limit size
    history = history.slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Error saving search history:', e);
  }
}

export function clearSearchHistory() {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (e) {
    console.error('Error clearing search history:', e);
  }
}