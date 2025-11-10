// Example: Simple prefix-based search provider
// Demonstrates the slots.searchProviders API.

export const searchPrefixProviderPlugin = {
  id: 'examples.searchPrefixProvider',
  name: 'Prefix Search Provider (Example)',
  version: '1.0.0',
  author: 'Vertex Lab Examples',
  slots: {
    aboutPage: {
      markdown: `
# Prefix Search Provider (Example)

This bundled example shows how to contribute a search provider via \`slots.searchProviders\`.

Behavior:
- Matches nodes whose label starts with the query (case-insensitive)
- Marks exact label matches as \`exact\` for higher priority
- Highlights the matched prefix in results via \`matchedIndices\`

You can see it in action by typing a prefix in Search. The core aggregator merges this provider with the built-in fallback.
      `.trim(),
    },
    searchProviders: [
      {
        id: 'examples.search.prefix',
        search: (query, nodes) => {
          const q = (query || '').trim();
          if (!q) return [];
          const ql = q.toLowerCase();
          const out = [];
          for (const n of nodes || []) {
            const label = String(n?.label ?? '');
            const ll = label.toLowerCase();
            if (ll.startsWith(ql)) {
              const matchedIndices = Array.from({ length: ql.length }, (_, i) => i);
              out.push({ node: n, score: 0.9, exact: ll === ql, matchedIndices });
            }
          }
          return out;
        },
      },
    ],
  },
};

export default searchPrefixProviderPlugin;

