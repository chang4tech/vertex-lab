# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning as feasible.

## Unreleased

### Added
- Migration: Consolidate plugin toggles into Plugins dialog and render via merged `allPlugins` (core + custom) filtered by preferences.
- Plugins: Import custom plugins (.js) from the Plugins dialog; validate and persist source in localStorage. Loaded at startup and merged with core plugins.
- Plugins: New example plugin at `src/plugins/examples/helloPlugin.jsx`.
- Docs: Added `doc/PLUGIN_SPEC.md` describing plugin API, slots, App API, import process, and testing.
- i18n: Added Plugins Manager strings (EN/zh-CN).
- Tests: Added `customPluginLoader.validatePlugin` tests and extended PluginsManager test to cover the Import control.
 - Tests: Added unit tests for `pluginUtils` default/merge behavior and additional shape checks for `customPluginLoader.validatePlugin`.
 - Docs: Appended migration/progress notes (`doc/progress.md`) and clarified `slots` contract in `doc/PLUGIN_SPEC.md` and `MIGRATION.md`.
 - Docs: Migration guidance consolidated into this changelog and `doc/progress.md`; removed standalone `MIGRATION.md`.

### Changed
- PluginsManager now shows Core and Custom sections, supports toggling and removing custom plugins. Enabled/Disabled labels are localized.
- Removed duplicate `customPlugins` state in `MenuBar`; the App component owns plugin state and passes props down.
 - Plugins: Tightened plugin validation to reject array `slots` (must be an object), aligning implementation with the spec. No new features added.
 - Docs: Removed `MIGRATION.md`; migration details now live in Unreleased notes here and in `doc/progress.md`.

### Notes
- Security: Custom plugin import executes local JS you select; only import code you trust. Code is stored in localStorage and reloaded on app start.
- Routing: Simple hash router with landing page and graph page routed by UUID (`#/g/:uuid`).
- Graph metadata: Title input in navbar and UUID display; persisted per graph.
- Persistence: Nodes/edges/title stored under `vertex_graph_<uuid>_*` keys; legacy `vertex_*` keys remain for default.
- Help UX: SVG icon, moved to top-right, better tooltip; Help panel close button.
 - Help UX: Remove redundant close icon from Help panel (trigger acts as toggle).
- Menus: Unified spacing and bolder nav hover background.
- Header: Move site logo/title and graph title + UUID above menus.
 - Help icon: align to header (top-right) and reduce size for compact chrome.
- Nodes: Reduce default node radius across themes (32 → 24) for better scale on high‑resolution displays.
- View: Fit-to-view now adds proportionate padding and caps max zoom at 1.0 so “New Graph” and “Center” aren’t too close on large screens.
- Settings: Removed Tag management from Keyboard Shortcuts settings; added dedicated Tag Manager dialog under Settings menu.
 - Settings: Plugins moved to a dedicated Plugins dialog (separate from Shortcuts) with enable/disable toggles and persistence.
 - Settings menu: Rename "Keyboard Shortcuts" action to "Settings" to avoid confusion now that plugins (and other sections) live inside the Settings modal.
- i18n: Added landing page strings (EN/zh-CN).
- Tests: New router tests for landing and graph routes.

### Added
- Keyboard: `E` toggles Connect/Disconnect when multiple nodes are selected. Uses the first selected node as the anchor; prevents cycles when connecting. The Help panel and shortcut registry have been updated accordingly.
- Docs: Updated README Keyboard Shortcuts to reflect current shortcuts and describe the new `E` behavior.
- Tag Manager: Manage available tags in Settings → Tags (add, rename, change color, delete). Import/Export tag presets as JSON. Node Editor reads tags from local storage.
- Plugins: Added dedicated tests for PluginHost and the core node info panel. Ensures plugins can be disabled without affecting the app.

### Changed
- Shortcuts: Adopted Cmd/Ctrl + Alt as primary combos for New (N), Import (O), and Export PNG (P) to avoid browser-reserved shortcuts. Kept Cmd/Ctrl + S for Export JSON.
- Shortcuts: Implemented layout‑agnostic matching (uses `event.key` and `event.code`) for letters and digits to make Alt‑based and letter keys reliable across keyboard layouts (e.g., Alt+C, Alt+=, Alt+-, Alt+0, Numpad variants).
- Shortcuts: Added fallback support for Cmd/Ctrl + Shift + O/S/N where the browser allows them. Redo remains Cmd/Ctrl + Shift + Z; Undo remains Cmd/Ctrl + Z.
- Import: Reworked Import JSON trigger to use `showOpenFilePicker` when available, with legacy `<input type="file">` and a temporary input fallback to satisfy user‑activation rules triggered via keyboard.
- Node Editor: Refined layout with consistent card/grid frames across tabs (Basic, Style, Tags, Advanced) for better alignment and spacing.

### Fixed
- Alt/C (Center) and other Alt‑based view operations now work across OS/keyboard layouts.
- Deleted tags referenced by nodes now appear greyed out with a “(Deleted)” marker in the Node Editor.

### Tests
- Added unit tests for the `E` shortcut in `useKeyboardShortcuts`.
- Added plugin tests for visibility and rendering.
- Added Tag Manager tests for export serialization, import shape validation, and persistence.

### Tests
- Added unit tests to cover the `E` shortcut in `useKeyboardShortcuts`.

## 0.0.0 - Initial
- Initial project scaffold, canvas rendering, selection, import/export, themes, and core shortcuts.
