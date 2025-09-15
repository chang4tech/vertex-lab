# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning as feasible.

## Unreleased

### Added
- Routing: Simple hash router with landing page and graph page routed by UUID (`#/g/:uuid`).
- Graph metadata: Title input in navbar and UUID display; persisted per graph.
- Persistence: Nodes/edges/title stored under `vertex_graph_<uuid>_*` keys; legacy `vertex_*` keys remain for default.
- Help UX: SVG icon, moved to top-right, better tooltip; Help panel close button.
- Menus: Unified spacing and bolder nav hover background.
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
