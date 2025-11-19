/**
 * Collect Node Editor sections from plugins.
 * Section shape:
 *   { id, title?: string, order?: number, when?: (api, node) => boolean, render: (api, node) => React.ReactNode }
 */
export function collectNodeEditorSections(plugins = []) {
  const sections = [];
  for (const p of plugins || []) {
    const list = p?.slots?.nodeEditor;
    if (!Array.isArray(list)) continue;
    for (const sec of list) {
      if (!sec || typeof sec !== 'object') continue;
      if (typeof sec.id !== 'string' || !sec.id) continue;
      if (typeof sec.render !== 'function') continue;
      sections.push({ ...sec, pluginId: p.id });
    }
  }
  return sections;
}

