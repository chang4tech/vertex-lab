/**
 * Example plugins demonstrating the conflicts feature.
 * These two plugins are marked as mutually exclusive.
 */

export const layoutAlgorithmA = {
  id: 'example.layoutAlgorithmA',
  name: 'Layout Algorithm A',
  version: '1.0.0',
  description: 'Example layout algorithm that conflicts with Algorithm B',
  conflicts: ['example.layoutAlgorithmB'], // Declares conflict with the other plugin
  slots: {
    sidePanels: [{
      id: 'panelA',
      render: (api) => (
        <div style={{ padding: 12, border: '1px solid #ccc', borderRadius: 8 }}>
          <h3>Layout Algorithm A</h3>
          <p>This plugin provides an alternative layout algorithm.</p>
          <p style={{ fontSize: 12, color: '#666' }}>
            Note: This plugin conflicts with Layout Algorithm B.
            Enabling this will disable Algorithm B.
          </p>
        </div>
      )
    }]
  }
};

export const layoutAlgorithmB = {
  id: 'example.layoutAlgorithmB',
  name: 'Layout Algorithm B',
  version: '1.0.0',
  description: 'Example layout algorithm that conflicts with Algorithm A',
  conflicts: ['example.layoutAlgorithmA'], // Declares conflict with the other plugin
  slots: {
    sidePanels: [{
      id: 'panelB',
      render: (api) => (
        <div style={{ padding: 12, border: '1px solid #ccc', borderRadius: 8 }}>
          <h3>Layout Algorithm B</h3>
          <p>This plugin provides a different layout algorithm.</p>
          <p style={{ fontSize: 12, color: '#666' }}>
            Note: This plugin conflicts with Layout Algorithm A.
            Enabling this will disable Algorithm A.
          </p>
        </div>
      )
    }]
  }
};
