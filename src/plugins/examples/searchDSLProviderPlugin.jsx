// Example: Semantic Search DSL provider
// Supports queries like:
//   type:Paper year>=2020 author:"doe" tag:ml
// Operators: = != > >= < <= for numbers; ':' means contains for strings/arrays

function tokenize(input) {
  const tokens = [];
  let i = 0;
  while (i < input.length) {
    while (i < input.length && /\s/.test(input[i])) i++;
    if (i >= input.length) break;
    const start = i;
    let inQuotes = false;
    let buf = '';
    while (i < input.length) {
      const ch = input[i];
      if (ch === '"') { inQuotes = !inQuotes; buf += ch; i++; continue; }
      if (!inQuotes && /\s/.test(ch)) break;
      buf += ch; i++;
    }
    if (buf) tokens.push(buf);
  }
  return tokens;
}

function parseClause(tok) {
  // Recognize key OP value or bare terms (ignored here; fallback handles label)
  // Operators precedence: >= <= != > < = :
  const ops = ['>=', '<=', '!=', '>', '<', '=', ':'];
  for (const op of ops) {
    const idx = tok.indexOf(op);
    if (idx > 0) {
      const key = tok.slice(0, idx).trim();
      let val = tok.slice(idx + op.length).trim();
      if (val.startsWith('"') && val.endsWith('"') && val.length >= 2) {
        val = val.slice(1, -1);
      }
      return { key: key.toLowerCase(), op, value: val };
    }
  }
  return null;
}

function toNumberMaybe(v) {
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function matchClause(node, clause) {
  const { key, op, value } = clause;
  const lowerVal = String(value).toLowerCase();

  // Special keys
  if (key === 'type') {
    const t = String(node.type || '').toLowerCase();
    if (op === ':' || op === '=') return t === lowerVal || t.includes(lowerVal);
    if (op === '!=') return t !== lowerVal;
    return false;
  }
  if (key === 'tag' || key === 'tags') {
    const tags = Array.isArray(node.tags) ? node.tags : [];
    const has = tags.some((t) => String(t).toLowerCase() === lowerVal || String(t).toLowerCase().includes(lowerVal));
    return op === '!=' ? !has : has;
  }
  if (key === 'label') {
    const label = String(node.label || '');
    const ll = label.toLowerCase();
    if (op === ':') return ll.includes(lowerVal);
    if (op === '=') return ll === lowerVal;
    if (op === '!=') return ll !== lowerVal;
    return false;
  }

  // Generic property
  const v = node[key];
  if (v == null) return false;

  // Arrays: string[]/number[] => membership
  if (Array.isArray(v)) {
    const any = v.some((el) => {
      if (typeof el === 'number') {
        const num = toNumberMaybe(value);
        if (num == null) return false;
        return op === '!=' ? el !== num : el === num;
      }
      const sv = String(el).toLowerCase();
      if (op === ':') return sv.includes(lowerVal);
      if (op === '=') return sv === lowerVal;
      if (op === '!=') return sv !== lowerVal;
      return false;
    });
    return any;
  }

  // Numbers
  if (typeof v === 'number') {
    const num = toNumberMaybe(value);
    if (num == null) return false;
    if (op === '=') return v === num;
    if (op === '!=') return v !== num;
    if (op === '>') return v > num;
    if (op === '>=') return v >= num;
    if (op === '<') return v < num;
    if (op === '<=') return v <= num;
    return false;
  }

  // Strings
  const sv = String(v);
  const sl = sv.toLowerCase();
  if (op === ':') return sl.includes(lowerVal);
  if (op === '=') return sl === lowerVal;
  if (op === '!=') return sl !== lowerVal;
  return false;
}

function scoreForMatch(node, clauses) {
  const total = clauses.length;
  if (total === 0) return 0.5;
  let hits = 0;
  for (const c of clauses) {
    if (matchClause(node, c)) hits += 1;
  }
  // Scale between 0.6 and 0.95 depending on coverage
  const ratio = hits / total;
  return 0.6 + ratio * 0.35;
}

export const searchDSLProviderPlugin = {
  id: 'examples.searchDSLProvider',
  name: 'Search DSL Provider (Example)',
  version: '1.0.0',
  author: 'Vertex Lab Examples',
  slots: {
    aboutPage: {
      markdown: `
# Search DSL Provider (Example)

Adds a semantic search provider that understands a simple DSL for types and properties.

Syntax
- Clauses separated by spaces; each clause is \`keyOPvalue\`.
- Strings may be quoted with double quotes.
- Operators: \`:\` (contains for strings/arrays), \`=\`, \`!=\`, \`>\`, \`>=\`, \`<\`, \`<=\` (numeric).
- Special keys: \`type\`, \`tag\`/\`tags\`, \`label\`.

Examples
- \`type:Paper year>=2020\`
- \`tag:ml author:"doe"\`
- \`label:"Neural Networks" type:Paper\`

Notes
- This provider is merged with the core fallback search and other providers via the aggregator.
      `.trim(),
    },
    searchProviders: [
      {
        id: 'examples.search.dsl',
        search: (query, nodes) => {
          if (!query || !query.includes(':')) return [];
          const rawTokens = tokenize(query);
          const clauses = rawTokens
            .map(parseClause)
            .filter(Boolean);
          if (clauses.length === 0) return [];

          const out = [];
          for (const n of nodes || []) {
            const ok = clauses.every((c) => matchClause(n, c));
            if (!ok) continue;
            const score = scoreForMatch(n, clauses);
            const exact = clauses.length > 0; // treat structured matches as strong
            out.push({ node: n, score, exact, matchedIndices: [] });
          }
          return out;
        },
      },
    ],
  },
};

export default searchDSLProviderPlugin;

