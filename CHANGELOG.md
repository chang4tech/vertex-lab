# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning as feasible.

## Unreleased

### Added
- Keyboard: `E` toggles Connect/Disconnect when multiple nodes are selected. Uses the first selected node as the anchor; prevents cycles when connecting. The Help panel and shortcut registry have been updated accordingly.
- Docs: Updated README Keyboard Shortcuts to reflect current shortcuts and describe the new `E` behavior.
 - Tag Manager: Manage available tags in Settings → Tags (add, rename, change color, delete). Import/Export tag presets as JSON. Node Editor reads tags from local storage.

### Tests
- Added unit tests to cover the `E` shortcut in `useKeyboardShortcuts`.

## 0.0.0 - Initial
- Initial project scaffold, canvas rendering, selection, import/export, themes, and core shortcuts.
