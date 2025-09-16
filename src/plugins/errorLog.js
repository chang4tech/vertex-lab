const subscribers = new Set();
let logs = [];

export function appendPluginLog(entry) {
  const enriched = { time: Date.now(), level: entry.level || 'info', ...entry };
  logs.push(enriched);
  // cap to recent 100
  if (logs.length > 100) logs = logs.slice(-100);
  subscribers.forEach((cb) => {
    try { cb(enriched, logs); } catch {}
  });
}

export function getPluginErrors() { return logs.slice(); }
export function getPluginErrorsById(pluginId) { return logs.filter(l => l.pluginId === pluginId); }
export function getPluginLogsById(pluginId) { return logs.filter(l => l.pluginId === pluginId); }
export function clearPluginLogsById(pluginId) { logs = logs.filter(l => l.pluginId !== pluginId); }

export function appendPluginError(entry) {
  appendPluginLog({ ...entry, level: 'error' });
}

export function subscribePluginErrors(cb) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}
