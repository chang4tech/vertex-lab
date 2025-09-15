import React from 'react';

class PluginErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    const { pluginId } = this.props;
    // Log plugin errors without breaking the app
    console.error(`[PluginErrorBoundary] Plugin '${pluginId}' crashed:`, error, info);
  }

  render() {
    const { hasError, error } = this.state;
    const { pluginId, children } = this.props;
    if (hasError) {
      return (
        <div style={{ width: 320, padding: 12, borderLeft: '1px solid #e5e7eb', background: '#fff' }}>
          <h3 style={{ margin: '8px 0' }}>Plugin Error</h3>
          <div style={{ color: '#6b7280', fontSize: 12 }}>
            {`A panel in plugin '${pluginId}' failed to render.`}
          </div>
          <pre style={{ color: '#991b1b', whiteSpace: 'pre-wrap' }}>
            {String(error?.message || error)}
          </pre>
        </div>
      );
    }
    return children;
  }
}

export default PluginErrorBoundary;

