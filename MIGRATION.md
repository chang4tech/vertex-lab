# Migration: Legacy Plugins to New Plugin System

This document captures the migration progress, results, and guidance for moving from legacy plugin UI patterns to the new plugin system.

## Summary

- Consolidated plugin enable/disable into a dedicated Plugins dialog (`PluginsManager`).
- Introduced runtime custom plugin import (local `.js/.mjs` files), with validation and persistence.
- Unified plugin execution through `PluginHost` using a merged list: `corePlugins + customPlugins`.
- Documented the plugin API and development flow in `doc/PLUGIN_SPEC.md`.

## Results

- Users can manage core and custom plugins in a single place.
- Custom plugins persist across sessions and load automatically.
- The app’s plugin rendering surface is stable and minimal; system plugins use the same API.

## Migration Steps (App Code)

1) Replace any direct usage of `corePlugins` at render time with `allPlugins` (merged core + custom), filtered by `pluginPrefs`.
2) Remove plugin toggles from Settings and use the dedicated Plugins dialog.
3) Persist plugin preferences via `utils/pluginUtils` and ensure new plugins are enabled by default.
4) For side-panel contributions, ensure they are expressed as `slots.sidePanels` entries with `id`, optional `visible(api)`, and `render(api)` functions.

## Migration Steps (Plugin Authors)

- Export a plugin object `{ id, name?, slots: { sidePanels: [...] } }`.
- Use the App API passed to `render(api)` to interact with selection and nodes.
- For local/runtime development, import your plugin via Settings → Plugins → Import Plugin (.js).
- For shared distribution, publish a package and statically import into `src/plugins/index.js`.

## Considerations

- Security: runtime import only accepts local files you select; remote URLs are not supported.
- Backward compatibility: system plugins continue to work; the host adapts to enabled/disabled states.
- Persistence: custom plugin sources are stored in `localStorage` under `vertex_custom_plugins`.
- Validation: `slots` must be an object and not an array; invalid shapes are rejected during import to prevent ambiguous schemas.

## Open Items

- Formalize additional slots (context menus, overlays, commands) in future iterations.
- Optional sandbox for custom plugins if needed in constrained environments.
