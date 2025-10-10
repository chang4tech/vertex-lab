import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import VertexCanvas from '../../VertexCanvas.jsx';
import { ThemeProvider } from '../../contexts/ThemeContext.jsx';

const nodes = [
  { id: 1, x: 0, y: 0, label: 'Root' },
  { id: 2, x: 100, y: 0, parentId: 1, label: 'Child A' },
  { id: 3, x: -100, y: 0, parentId: 1, label: 'Child B' },
];

const renderCanvas = (props) => render(
  <ThemeProvider>
    <VertexCanvas
      nodes={nodes}
      edges={[]}
      selectedNodeIds={[]}
      highlightedNodeIds={[]}
      onSelectionChange={() => {}}
      onViewBoxChange={props.onViewBoxChange}
      onContextMenuRequest={() => {}}
      width={props.width}
      height={props.height}
    />
  </ThemeProvider>
);

describe('VertexCanvas viewport centering', () => {
  afterEach(() => {
    cleanup();
  });

  it('keeps view centered when width changes', async () => {
    const calls = [];
    const onViewBoxChange = (box) => calls.push(box);
    const { rerender } = renderCanvas({ width: 800, height: 600, onViewBoxChange });

    // initial call
    expect(calls.length).toBeGreaterThan(0);
    const initialBox = calls.at(-1);

    rerender(
      <ThemeProvider>
        <VertexCanvas
          nodes={nodes}
          edges={[]}
          selectedNodeIds={[]}
          highlightedNodeIds={[]}
          onSelectionChange={() => {}}
          onViewBoxChange={onViewBoxChange}
          onContextMenuRequest={() => {}}
          width={1000}
          height={600}
        />
      </ThemeProvider>
    );

    const updatedBox = calls.at(-1);
    expect(updatedBox.x).toBeCloseTo(initialBox.x, 5);
    expect(updatedBox.y).toBeCloseTo(initialBox.y, 5);
  });
});
