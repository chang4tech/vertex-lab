import React from 'react';

function parseLines(text = '') {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (/^###\s+/.test(line)) {
      blocks.push({ type: 'h3', text: line.replace(/^###\s+/, '') }); i++; continue;
    }
    if (/^##\s+/.test(line)) {
      blocks.push({ type: 'h2', text: line.replace(/^##\s+/, '') }); i++; continue;
    }
    if (/^#\s+/.test(line)) {
      blocks.push({ type: 'h1', text: line.replace(/^#\s+/, '') }); i++; continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }
    // paragraph
    const paras = [];
    while (i < lines.length) {
      const current = lines[i];
      if (!current.trim()) break;
      if (/^[-*#]/.test(current)) break;
      paras.push(current);
      i++;
    }
    if (paras.length === 0 && i < lines.length) {
      paras.push(lines[i]);
      i++;
    }
    blocks.push({ type: 'p', text: paras.join(' ') });
  }
  return blocks;
}

export default function Markdown({ text = '' }) {
  const blocks = React.useMemo(() => parseLines(text), [text]);
  return (
    <div>
      {blocks.map((b, idx) => {
        if (b.type === 'h1') return <h1 key={idx}>{b.text}</h1>;
        if (b.type === 'h2') return <h2 key={idx}>{b.text}</h2>;
        if (b.type === 'h3') return <h3 key={idx}>{b.text}</h3>;
        if (b.type === 'ul') return (
          <ul key={idx} style={{ margin: 0, paddingLeft: 18 }}>
            {b.items.map((it, i2) => <li key={i2}>{it}</li>)}
          </ul>
        );
        return <p key={idx} style={{ margin: '8px 0' }}>{b.text}</p>;
      })}
    </div>
  );
}
