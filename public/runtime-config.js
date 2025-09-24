(function () {
  var existing = typeof window !== 'undefined' ? window.__VERTEX_CONFIG__ : undefined;
  if (typeof window === 'undefined') {
    return;
  }

  var defaultPort = window.location.port === '5173' ? '4000' : window.location.port;
  var inferredBase = window.location.origin;

  if (defaultPort && defaultPort !== window.location.port) {
    inferredBase = window.location.protocol + '//' + window.location.hostname + ':' + defaultPort;
  }

  var defaults = {
    apiBaseUrl: inferredBase
  };

  window.__VERTEX_CONFIG__ = Object.assign({}, defaults, existing || {});
})();
