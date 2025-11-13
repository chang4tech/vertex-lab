# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning as feasible.

## Unreleased


## [0.4.0] - 2025-11-10

### Added
- Plugin System: Added `conflicts` field to plugin schema allowing plugins to declare mutual exclusivity with other plugins
- Plugin Conflicts: Bidirectional conflict detection - checks both direct conflicts and reverse conflicts
- Plugin Conflicts: Automatic conflict resolution with user confirmation when enabling conflicting plugins
- Plugin Conflicts: Visual indicators in Plugins Manager showing which plugins have potential conflicts with tooltips
- Plugin Conflicts: Comprehensive test suite (16 tests) for conflict detection logic
- Plugin Examples: Added `conflictExample.jsx` demonstrating two mutually exclusive layout algorithm plugins
- Documentation: Added "Plugin Conflicts" section to `doc/PLUGIN_SPEC.md` with examples and use cases
- Release tooling: Add `tools/release.mjs` and npm scripts to bump version, update changelog, commit, and push (no tags)
- Roadmap: Added `ROADMAP.md` outlining milestones (v0.4.0, v0.5.0, v0.6.0) and created `tools/milestones.mjs` to open GitHub milestones
- Search: Accessibility and UX improvements — combobox/listbox semantics, option roles, Home/End/PageUp/PageDown keys, and auto-scroll to the active option
- Search: Plugin-extensible search via new `slots.searchProviders`; aggregation merges provider results with fallback search and stable ranking
- Search: Added `core.search.open` plugin command and routed Cmd/Ctrl+F to go through plugin command path (plugins can override)
- Search UI: Moved Search modal into a core plugin overlay (`core.search`) with a Control Hub config (Include tags, Debounce ms). Core plugin declares conflicts so custom search UIs can disable it.
- Examples: Added `examples.searchPrefixProvider` to illustrate `slots.searchProviders` with a simple prefix matcher
- Docs: Updated README and docs (`PLUGIN_SPEC.md`, `PLUGINS_DESIGN.md`, `doc/README.md`) with Search architecture, provider slot, core search overlay, and command routing
- Docs: Expanded Plugin Spec with `slots.notifications`, updated App API (highlight, search state, export decorators), and corrected command runner API
- Plugin: Added `examples.graphLinter` bundled custom plugin (Graph Linter) with side panel + commands, severity config, suppression per node, and one‑click fixes for duplicates/orphans/long labels; tags nodes in directed cycles
- API: Added `updateEdges` to plugin API with undo support; undo/redo now tracks edges alongside nodes
- Linter: Workerized cycle detection and large-graph scans with caching by graphId + counts; falls back to sync in test environments

### Changed
- PluginsManager: Refactored `handleTogglePlugin` function - reduced cyclomatic complexity from ~5 to ~2
- PluginsManager: Extracted conflict handling logic into 5 separate helper functions for better maintainability
- PluginsManager: Created reusable `PluginRow` component reducing code duplication by 150+ lines
- PluginsManager: Reduced component from ~400 lines to ~330 lines (-17.5%)
- Plugin Validation: Enhanced to validate `conflicts` field structure (array of plugin ID strings)
- Code Quality: Improved separation of concerns with focused, single-responsibility functions
- Search: Ranking now boosts prefix matches while preserving exact-match priority; adds stable tie-breakers (score → label)
- Search: Highlight rendering escapes HTML to prevent XSS with untrusted labels
- Tooling: ESLint updated to ignore coverage, add Node env overrides for server/Playwright, and relax App.jsx unused-vars to reduce false positives

### Fixed
- Follow-up Reminders: Mobile drawer no longer auto-opens; reminders surface via notifications while controls stay accessible.
- Plugin mobile drawer lacked styling; added full CSS to keep panels hidden until opened and tuned safe-area positioning.
- Plugins Manager modal now declares dialog semantics, autofocuses controls, and listens for Escape to improve accessibility.
- Plugin Control Hub now tracks bundled and user-imported custom plugins (including fresh imports) so it no longer emits “Plugin Not Found”.
- Help overlay: Ensure the help trigger stays clickable by raising overlay z-index above the panel.
- Library menu: Allow Library Graphs list to scroll inside the dropdown so long catalogs stay accessible.
- Canvas: Recompute viewport using live menu height and plugin panel width so the canvas no longer overlaps navigation or plugin panels.
- Help overlay: Ensure the quick-help box sits above plugin side panels and offsets from active panels so it remains accessible.
- Settings dialog: Remove greyed background and raise overlay z-index so the modal sits above the nav without dimming the app.
- Canvas & minimap: Skip nodes/edges with invalid coordinates when computing bounds or drawing so neither surface distorts after load; added regression tests covering hidden-node and invalid-node scenarios.
- Canvas: Ensure wheel zoom stays anchored under the cursor on high-DPI displays.
- Canvas: Keep view centered when canvas size changes (e.g., opening Node Info panel).
- Menus: Contain wheel/touch scrolling inside open dropdowns so the canvas and page no longer scroll/zoom while menus are hovered.
- Plugin panels: Apply consistent glass styling, width, and overflow handling so collapsible details expand reliably while the canvas remains visible; updated PluginHost test to assert rendered content.
- Plugin panels: Tuned opacity using pseudo-element overlays so the canvas shows through without fading text; summary/content backgrounds now inherit theme colors with adjustable alpha variables.
- Node Editor: Add accessible labels to color swatches to stabilize tests and improve screen-reader support

### Added
- Plugin Host: Notification rail for plugin panels plus notifications slot; desktop/mobile panels show cards with badges and follow-up actions.
- Follow-up Reminders: Notifications feed highlights overdue/upcoming tasks with focus/mark-done controls while the panel stays focused on scheduling.
- Custom Plugins: Bundled “Gamification Boost” (XP tracking, quick actions, streak overlay) and “Paper Reference Prospector” (configurable depth scouting) ship disabled-by-default in the Custom tab.
- Plugins Manager: Bundled custom plugins show a “Bundled” badge and we prevent removing first-party bundles.
- Docs: Recorded bundled-plugin registration requirements in `doc/PLUGINS_DESIGN.md` to avoid future Control Hub lookup regressions.
- i18n: Added Spanish locale option with core UI translations.
- Export pipeline: Expose plugin hook to decorate PNG exports (graph/user metadata provided to decorators).
- Plugins: Export Watermark plugin adds optional text or QR code watermark to PNG exports.
- Plugins: Version History plugin records snapshots with optional auto-capture and restore controls.
- Plugins: Added Follow-up Reminders custom plugin to schedule node follow-ups, highlight upcoming work, and focus due items.
- Help menu: Added About entry linking to the About page.
- Docs: `doc/DEV_SERVER.md` guiding LAN access (Vite `--host`, preview, IP lookup, firewall/VPN tips).
- README: “Access from other devices” quick steps.
- Mobile: Suppress iOS long‑press callout/selection on the canvas (CSS no‑callout + touch `pointerdown` preventDefault).
- Tests: `VertexCanvas.mobile.test.jsx` validates no‑callout/no‑select styles; ContextMenu touch/contextmenu default suppression.
- Mobile: High‑DPI (devicePixelRatio) scaling for crisper canvas rendering on retina/mobile.
- Tests: VertexCanvas DPR scaling test.
- Tests: Mobile Node Info panel width test.
- Control Hub i18n: Localized labels for “Control Hub”, “How to Use”, “Settings”, “Console”, “Copy”, “Clear”.
- Control Hub docs: `aboutPage.markdown` support (rendered as lightweight Markdown when provided).
- UI: “Incomplete” badge in Plugins dialog for plugins without contributions (no panels/commands/overlays/about/config).
- i18n: Added `plugins.incomplete` (EN/zh-CN).
- Router: `#/plugin/:id` route enabling a single Control Hub page per plugin (legacy `#/plugin/:id/(config|console)` tolerated).
- Plugins Manager: Control Hub button under Details for each plugin.
- Host API: `api.plugin` helpers (log, openHub) accessible in panels and overlays.
- Logs: General plugin log store with levels (info/warn/error); Hub console displays and allows copy/clear.
- Core Plugins: Selection Tools panel (quick actions for selection).
- Core Plugins: Clipboard Tools commands (Copy Selected IDs, Copy Node ID).
- Core Plugins: Graph Stats panel (nodes, edges, selection).
- Core Plugins: Neighbors Highlighter commands (Highlight Neighbors, Clear Highlights).
- Custom Example: Neighbors Tools commands plugin demonstrating highlight workflow.
- Docs: `doc/PLUGINS_DESIGN.md` outlining core and custom plugin designs for future implementation.
- Plugins: New slots — `canvasOverlays` (render HUD/UI above canvas) and `commands` (actions surfaced in context menu with context-aware filtering).
- Plugins: Error isolation via an ErrorBoundary in `PluginHost`; faulty panels render a fallback and no longer crash the app.
- Plugins: `mergePlugins` utility to merge core + custom plugins and dedupe by id (first occurrence wins) with console warnings for duplicates.
- Migration: Consolidate plugin toggles into Plugins dialog and render via merged `allPlugins` (core + custom) filtered by preferences.
- Plugins: Import custom plugins (.js) from the Plugins dialog; validate and persist source in localStorage. Loaded at startup and merged with core plugins.
- Plugins: New example plugin at `src/plugins/examples/helloPlugin.jsx`.
- Docs: Added `doc/PLUGIN_SPEC.md` describing plugin API, slots, App API, import process, and testing.
  - Docs: Updated plugin spec for `canvasOverlays` and `commands`; documented command context API.
- i18n: Added Plugins Manager strings (EN/zh-CN).
- Tests: Added `customPluginLoader.validatePlugin` tests and extended PluginsManager test to cover the Import control.
 - Tests: Added unit tests for `pluginUtils` default/merge behavior and additional shape checks for `customPluginLoader.validatePlugin`.
 - Docs: Appended migration/progress notes (`doc/progress.md`) and clarified `slots` contract in `doc/PLUGIN_SPEC.md` and `MIGRATION.md`.
 - Docs: Migration guidance consolidated into this changelog and `doc/progress.md`; removed standalone `MIGRATION.md`.

### Changed
- Settings menu: Language selector now appears as a hoverable submenu instead of a dropdown.
- Plugins: Control Hub tip cards now appear as dismissible overlay toasts instead of pushing content below the canvas.
- Plugins: Core side panels (Graph Stats, Levels, etc.) render as fixed overlays beside the canvas instead of inline below it.
- Node Info Panel: Clarify color chips by showing fill vs text samples and adding a colors legend for multi-selection stats.
- Dialogs: Raised search/theme/help overlays above the menu bar to avoid dimming artifacts.
- Help menu: The Documentation entry now opens a dedicated docs page instead of an inline modal.
- Help menu: The Help Community and Send Feedback entries now navigate to configurable long-form pages (links/emails set in config/templates).
- Plugins: Hide floating side panels while modals are open to keep dialogs unobstructed.
- Mobile: Dropdown/context menus render above FABs/help (raised inline z-index in nav dropdown + higher z-index for nav and `.menu`/`.menu-dropdown`).
- Mobile: Minimap uses safe‑area insets (`env(safe-area-inset-*)`) for bottom/right.
- HTML: Set viewport to `viewport-fit=cover` to enable safe-area on iOS.
- Menus UX: Add max-height + scrolling with momentum; contain overscroll to avoid page bounce under menus on mobile.
- Context menu clamp: Use `calc(10px + env(safe-area-inset-*)))` when sticking to screen edges.
- iOS callout suppression: Broadened guard on mobile (disable selection/callout by default with re‑enable on inputs/dialogs) and added no‑callout to Help trigger + FABs to prevent the system Copy/Look Up sheet when long‑pressing near overlays.
- Mobile: Long‑press movement cancel threshold increased (12 → 20) to avoid accidental menus during slow panning.
- Mobile: Quick controls respect safe‑area insets (env()) and maintain 44px targets.
- Mobile: Node Info panel uses a narrower width on small screens.
- Mobile: Menu items use touch-friendly spacing (min-height 44px) on coarse pointers/small screens.
- Mobile: Help trigger re-positioned below header on mobile and given safe-area offsets to prevent overlap; example overlay respects safe-area.
- Mobile: Hide Graph ID label on mobile to reduce header crowding.
- Mobile: Help tooltip now only shows on hover/focus (kept hidden on touch) to avoid covering content.
- Mobile: Prevent iOS text-selection callout over custom context menus; suppress native context menu inside our menu container.
- Mobile: Strengthened menu handling by disabling selection/callout on all menu descendants and preventing default on touchstart/move/end within the menu to block the iOS selection toolbar.
 - Mobile: When the custom context menu opens, the app temporarily disables selection/callout globally to further prevent iOS toolbars.
- Tip banner: Converted first‑time plugin enabled banner to `react-intl` (message + buttons) and fixed effect ordering to avoid referencing `activePlugins` before init.
- Core plugin metadata: Added description/version/author to Node Info so Plugins dialog shows details instead of “No metadata”.
- Core plugin metadata: Added version/author for Clipboard Tools, Graph Stats, Selection Tools, Neighbors Highlighter for consistent details in Plugins dialog.
- App: Command filtering now receives minimal api so predicate `when(api, ctx)` can leverage selection state.
- App: Command runners now receive `edges` and `setHighlightedNodes` to enable non-destructive highlight interactions.
- App: Context menu now surfaces plugin commands (node/canvas contexts) collected from enabled plugins.
- App: Uses `mergePlugins` when loading stored custom plugins and importing at runtime.
- Docs: `README.md` plugin section calls out error isolation and duplicate handling; `doc/PLUGIN_SPEC.md` updated with Error Isolation and Duplicate IDs sections.
 - Spec: Documented `configPage` slot, logging helpers, and per-plugin pages.
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
- i18n: Added Spanish locale option with core UI translations.
- Keyboard: `E` toggles Connect/Disconnect when multiple nodes are selected. Uses the first selected node as the anchor; prevents cycles when connecting. The Help panel and shortcut registry have been updated accordingly.
- Docs: Updated README Keyboard Shortcuts to reflect current shortcuts and describe the new `E` behavior.
- Tag Manager: Manage available tags in Settings → Tags (add, rename, change color, delete). Import/Export tag presets as JSON. Node Editor reads tags from local storage.
- Plugins: Added dedicated tests for PluginHost and the core node info panel. Ensures plugins can be disabled without affecting the app.

### Changed
- Settings menu: Language selector now appears as a hoverable submenu instead of a dropdown.
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

- Control Hub: Added optional `aboutPage` (How to Use) and implemented guidance for core and example plugins.
