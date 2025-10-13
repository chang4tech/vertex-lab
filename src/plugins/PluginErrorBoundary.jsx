import React from 'react';
import { appendPluginError } from './errorLog.js';
import PluginError from './components/PluginError.jsx';

class PluginErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    const { pluginId } = this.props;
    // Log plugin errors without breaking the app
    console.error(`[PluginErrorBoundary] Plugin '${pluginId}' crashed:`, error, info);
    appendPluginError({ pluginId, message: String(error?.message || error), stack: String(error?.stack || ''), componentStack: info?.componentStack || '' });
  }

  handleRetry() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    const { hasError, error } = this.state;
    const { pluginId, pluginName, children } = this.props;
    if (hasError) {
      return (
        <PluginError
          error={error}
          pluginName={pluginName || pluginId}
          onRetry={this.handleRetry}
        />
      );
    }
    return children;
  }
}

export default PluginErrorBoundary;
