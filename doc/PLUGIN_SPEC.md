# Vertex Lab Plugin Specification

This document describes how to create, import, and test plugins for Vertex Lab. The current plugin host focuses on simple, UI‑focused extensions that render panels and interact with the app via a small, stable API.

The goal is to make it easy to add functionality without forking the app. Plugins are plain ES modules that export a plugin object.

## Concepts

- Plugin: a plain object with a unique `id`, optional `name`, and a set of slot contributions under `slots`.
- Slot: a well‑defined extension point. Today, the primary slot is `sidePanels`.
- App API: a small set of state and callbacks passed by the host to your plugin at render time.

## Minimal Plugin Object

```
export const myPlugin = {
  id: 'example.myPlugin',
  name: 'My Plugin',
  slots: {
    sidePanels: [
      {
        id: 'helloPanel',
        visible: (api) => true, // optional predicate
        render: (api) => <div style={{ padding: 12 }}>Hello from My Plugin</div>,
      },
    ],
  },
};

export default myPlugin;
```

Notes:
- `id` must be unique across all plugins. Use a reverse‑DNS or vendor prefix (e.g. `acme.myPlugin`).
- `name` is shown in the Plugins Manager if included in `corePlugins`.
- `visible` can be omitted; default is visible.
- `render(api)` is called by the host; return a React element.
- `slots` must be an object (not an array). Unknown properties are ignored; known slots include `sidePanels`.

Optional metadata fields:
- `description?: string` - Brief description of the plugin (display only)
- `version?: string` - Version identifier (display only)
- `author?: string` - Author name (display only)
- `conflicts?: string[]` - Array of plugin IDs that conflict with this plugin (mutually exclusive)

## Slots

### sidePanels

Renders right‑side panels stacked with other plugin panels. Each panel object supports:

- `id` (string): Unique within the plugin.
- `visible?: (api) => boolean`: Optional predicate to control whether to render.
- `render: (api) => React.ReactNode`: Required render function. Use the `api` to read app state and call actions.

Example using app selection state:

```
{
  id: 'selectionSummary',
  visible: (api) => api.selectedNodeIds?.length > 0,
  render: (api) => (
    <div style={{ padding: 12 }}>
      <h3>Selected</h3>
      <div>{api.selectedNodeIds.length} node(s)</div>
    </div>
  ),
}
```

### canvasOverlays

Render elements above the canvas (e.g., HUD widgets, guides). Each overlay object supports:

- `id` (string): Unique within the plugin.
- `visible?: (api) => boolean`: Optional predicate to control whether to render.
- `render: (api) => React.ReactNode`: Required render function.

Example:

```
{
  id: 'overlay.scale',
  render: (api) => (
    <div style={{ position: 'fixed', left: 16, bottom: 16, padding: 8, background: '#111827', color: '#fff', borderRadius: 6 }}>
      HUD
    </div>
  ),
}
```

### commands

Register commands that the app can surface in menus. Each command supports:

- `id` (string)
- `title` (string)
- `run: (api, ctx) => void`
- `when?: 'node' | 'canvas' | (api, ctx) => boolean`

The app collects commands from all enabled plugins and surfaces them in the context menu based on `ctx`:

- Node context: when right-clicking a node
- Canvas context: when right-clicking empty canvas

### searchProviders

Provide custom search logic that the core Search UI aggregates with its fallback search. Each provider is an object with:

- `id` (string): Unique within the plugin.
- `search: (query: string, nodes: Array<Node>, api?) => Result[]`

Result shape:

```
type Result = {
  node: Node,
  score?: number,        // 0..1, higher is better
  exact?: boolean,       // true for exact hit; prioritized
  matchedIndices?: number[] // character indices in node.label to highlight
}
```

Aggregation and ranking rules used by the core UI:

- Exact matches rank above prefix matches; prefix matches rank above others.
- Within the same group, results sort by `score` (desc), then by `label` alphabetically.
- If multiple providers return the same node, the best‑ranked record wins.
- The core still runs its fallback label search to guarantee baseline behavior.

Example provider (label prefix boost with custom scoring):

```
export const mySearchProvider = {
  id: 'acme.search.labelPrefix',
  search(query, nodes) {
    const ql = query.toLowerCase();
    return nodes
      .filter(n => String(n.label || '').toLowerCase().startsWith(ql))
      .map(n => ({ node: n, score: 0.9, exact: String(n.label).toLowerCase() === ql }));
  },
};

export const myPlugin = {
  id: 'acme.search',
  slots: {
    searchProviders: [mySearchProvider],
  },
};
```

## Core Search Plugin

The built‑in Search UI is contributed by the `core.search` plugin:

- UI: Renders the Search modal via a `canvasOverlays` contribution when `api.isSearchOpen` is true.
- Command: `core.search.open` opens the Search UI and is bound to Cmd/Ctrl + F.
- Config: The Control Hub exposes settings like “Include tags in search” and “Debounce (ms)”.
- Extensibility: Plugins can disable the core Search UI by declaring `conflicts: ['core.search']` and providing an alternate overlay.

Providers registered by plugins are passed to the Search UI automatically; the core aggregator merges all provider results with a built‑in fallback matcher for robust behavior.

### controlHub (single page)

Each plugin has a single page called the Control Hub at `#/plugin/<id>`. It combines settings, console, and overview in one place. From the Plugins Manager, click “Control Hub”.

- `aboutPage: { render: (api) => React.ReactNode, markdown?: string }` — optional “How to Use” section at the top of the Hub. If `markdown` is provided as a string, the Hub renders it with a lightweight Markdown view (headings, lists, paragraphs). If both are provided, `markdown` takes precedence.
- `configPage: { render: (api) => React.ReactNode }` — optional settings section inside the Hub.
- Logging: Panels/overlays receive `api.plugin.log(message, level?)` to append logs shown in the Hub’s console section. Levels: `info` (default), `warn`, `error`.

Notes:
- The Control Hub UI labels (“Control Hub”, “How to Use”, “Settings”, “Console”, “Copy”, “Clear”) are localized via `react-intl`.
- When a plugin is enabled for the first time, the app shows a one‑time tip banner linking to the plugin’s Control Hub; this banner is also localized.

## App API (passed to render/visible)

The host provides an `api` object with commonly needed state and actions. Current fields:

- `nodes: Array<Node>`: All nodes in the graph.
- `selectedNodeIds: string[]`: Selected node IDs.
- `selectedNodes: Array<Node>`: Selected node objects.
- `showNodeInfoPanel: boolean`: Whether the core Node Info panel is visible.
- `hideNodeInfoPanel: () => void`: Closes the Node Info panel.
- `onEditNode: (id: string) => void`: Open editor for a node.
- `onDeleteNodes: (ids: string[]) => void`: Delete nodes by IDs.
- `onToggleCollapse: (id: string) => void`: Collapse/expand a node.
- `setPluginEnabled: (pluginId: string, enabled: boolean) => void`: Toggle a plugin.
- `pluginPrefs: Record<string, boolean>`: Current plugin enabled/disabled state.
- `overlayLayout: { items: Record<string, { slot?: string, order?: number, style?: object }>, slots: Record<string, { className?: string, style?: object }>, overrides: { items: Record<string, any>, slots: Record<string, any> } }`: Snapshot of overlay placement (help button, minimap, mobile controls, and plugin entries).
- `setOverlayLayout: (patch: { items?: Record<string, Partial<{ slot: string | null, order: number, style: object }>>, slots?: Record<string, Partial<{ className?: string, style?: object, gap?: number }>> }) => void`: Merge overlay layout overrides; pass `null` to remove.
- `resetOverlayLayout: () => void`: Clear overlay layout overrides back to defaults.
- `isHelpVisible: boolean`: Current help panel visibility.
- `toggleHelp: () => void`: Toggle the help panel.
- `isMobile: boolean`: Whether the host is currently rendering in mobile mode.
- `overlayLayout: { items: Record<string, { slot: string, order?: number, style?: object }>, slots: Record<string, { className?: string, style?: object }>, overrides: { items: Record<string, any>, slots: Record<string, any> } }`: Snapshot of built-in overlay placement (help button, minimap, mobile controls).
- `setOverlayLayout: (patch: { items?: Record<string, Partial<{ slot: string | null, order: number, style: object }>>, slots?: Record<string, Partial<{ className?: string, style?: object, gap?: number }>> }) => void`: Merge overlay layout overrides; pass `slot: null` or `null` entries to remove overrides.
- `resetOverlayLayout: () => void`: Clear overlay layout overrides back to defaults.
 - `plugin: { id: string, log(message: string, level?: 'info'|'warn'|'error'), openHub(): void }`: Helpers scoped to the plugin being rendered.

Command runners receive a minimal `api` subset (selection and nodes) and `ctx`:
- `api.nodes`, `api.selectedNodeIds`, `api.selectedNodes`
- `api.edges` (optional): current edges if present
- `api.setHighlightedNodes(ids: string[])`: set highlight state (non‑destructive)
- `ctx.nodeId` (if present), `ctx.worldX`, `ctx.worldY`

This surface is intentionally small and may grow. Plugins should feature‑detect fields they use and avoid assuming more than listed.

## Importing and Registering Plugins

Plugins are standard ES modules and can be imported at runtime from local files or statically from npm packages.

1) Local plugin (runtime import, easiest)

- Open the app → Settings → Plugins.
- Click “Import Plugin (.js)” and select a local `.js/.mjs` file exporting a plugin object.
- The plugin is validated and stored in localStorage; it will auto‑load on next start.

2) Local plugin (static import)

- Create a file under `src/plugins/custom/yourPlugin.jsx` exporting the plugin object.
- Add it to the plugin list in `src/plugins/index.js`:

```
// src/plugins/index.js
import { nodeInfoPlugin } from './core/nodeInfoPlugin.jsx';
import { myPlugin } from './custom/myPlugin.jsx';

export const corePlugins = [nodeInfoPlugin, myPlugin];
```

The Plugins Manager reads from `corePlugins`, so custom plugins added here will appear and can be toggled.

3) Third‑party package (static import)

- Install the package: `npm i vendor-vertex-plugin`
- Import it in `src/plugins/index.js` and push into `corePlugins`:

```
import vendorPlugin from 'vendor-vertex-plugin';
export const corePlugins = [nodeInfoPlugin, vendorPlugin];
```

Remote URLs are not supported. Runtime import only accepts local files that you select. Statically importing from packages remains recommended for shared/distributed plugins.

### Duplicate IDs and Merge Order

When building the active plugin list, the app merges core + custom plugins and dedupes by `id`. First occurrence wins and duplicates are ignored. A console warning is emitted for duplicates. This prevents accidental overrides of core plugins by custom ones.

## Example: Hello Panel

See `src/plugins/examples/helloPlugin.jsx` for a copy‑pasteable example. It renders a simple panel and demonstrates reading selection state.

## System (Core) Plugin Example

The app ships with `core.nodeInfo` which renders the Node Info panel:

- File: `src/plugins/core/nodeInfoPlugin.jsx`
- Contributes one `sidePanels` entry.
- Uses fields like `selectedNodes`, `showNodeInfoPanel`, and handlers from the App API.

This is a good reference for accessing built‑in actions.

## Authoring Guidelines

- React 19 + JSX, ES Modules.
- Keep components functional; put side effects into `useEffect`.
- Use `react-intl` if you have user‑visible strings; otherwise, keep strings simple.
- Keep panel width reasonable (~320px) and avoid overlapping global UI.
- Persist your own settings using `localStorage` keys under a unique prefix.

## Testing Plugins

Use Vitest + Testing Library. Example pattern:

```
import { render, screen } from '@testing-library/react';
import PluginHost from '../../plugins/PluginHost.jsx';

it('shows hello panel', () => {
  const plugin = {
    id: 'test.hello',
    slots: { sidePanels: [{ id: 'p', render: () => <div>Hello</div> }] },
  };
  render(<PluginHost plugins={[plugin]} appApi={{}} />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

See `src/__tests__/plugins/PluginHost.test.jsx` for more examples.

## Importing Other Plugins (Composition)

Plugins are regular modules, so you can import helpers/components from other plugin packages or local files:

```
import { SomeWidget } from 'acme-vertex-tools';

export const composed = {
  id: 'acme.composed',
  slots: {
    sidePanels: [{ id: 'w', render: () => <SomeWidget /> }],
  },
};
```

There is no registry‑based dependency system yet. Prefer direct ES imports for composition rather than expecting runtime lookup of other plugin instances.

## Plugin Conflicts

Plugins can declare incompatibility with other plugins using the `conflicts` field. When a user attempts to enable a plugin that conflicts with currently enabled plugins, they will be prompted to disable the conflicting plugins first.

Example:
```javascript
export const myPlugin = {
  id: 'acme.myPlugin',
  name: 'My Plugin',
  conflicts: ['acme.otherPlugin', 'vendor.incompatiblePlugin'],
  slots: { /* ... */ }
};
```

Conflict behavior:
- When enabling a plugin, the system checks if any of its declared conflicts are currently enabled
- The system also checks if any enabled plugin declares this plugin as a conflict (bidirectional check)
- If conflicts exist, the user is prompted with a confirmation dialog listing the conflicting plugins
- Upon confirmation, all conflicting plugins are automatically disabled before enabling the requested plugin
- Visual indicators in the Plugins Manager show which plugins have potential conflicts

Use cases for conflicts:
- Plugins that provide mutually exclusive functionality (e.g., two different layout algorithms)
- Plugins that use incompatible APIs or modify the same UI elements
- Plugins that depend on different versions of shared resources

## Versioning and Compatibility

- The plugin API is intentionally minimal and stable; changes follow the app's semver.
- New slots may be added over time; existing slots won't break without a major version.
- Feature‑detect optional `api` fields and guard access.

## Security

- Do not execute untrusted code, fetch remote scripts, or eval dynamic sources.
- Validate user input rendered by your plugin.
- Avoid leaking secrets; use `import.meta.env` for config if needed.

## Roadmap (non‑breaking additions)

- Additional slots (e.g., context menus, canvas overlays, commands, keyboard shortcuts).
- Optional `dependencies` metadata for load‑order hints (complementing the existing `conflicts` field).
- Runtime plugin discovery (e.g., via global registration) behind a feature flag.

## Error Isolation

All plugin panels render inside an error boundary. If a panel throws during render, the host logs the error and shows a small fallback panel labeled "Plugin Error" instead of crashing the app. Use your own internal error handling where appropriate and prefer defensive coding in `render(api)`.
