const subscribers = new Set();
let logs = [];

export function appendPluginError(entry) {
  const enriched = { time: Date.now(), ...entry };
  logs.push(enriched);
  // cap to recent 100
  if (logs.length > 100) logs = logs.slice(-100);
  subscribers.forEach((cb) => {
    try { cb(enriched, logs); } catch {}
  });
}

export function getPluginErrors() { return logs.slice(); }
export function getPluginErrorsById(pluginId) { return logs.filter(l => l.pluginId === pluginId); }

export function subscribePluginErrors(cb) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

