# Plugin Designs (Core and Custom)

This document outlines proposed plugins to expand Vertex Lab’s extension ecosystem. Designs note slots used, intended UX, and any API needs. These are safe, incremental additions aligned with the current host surface.

## Core Plugins (shipped by default)

1) Selection Tools
- Slots: `sidePanels`
- UX: A compact panel visible when there is a selection, offering quick actions:
  - Edit first selected node
  - Collapse/Expand first selected
  - Delete selected
- API: Uses existing App API handlers: `onEditNode`, `onToggleCollapse`, `onDeleteNodes`.

2) Clipboard Tools
- Slots: `commands`
- UX: Context menu items to copy information:
  - Copy Selected Node IDs (enabled if selection > 0)
  - Copy Node ID (node context)
- API: Uses `navigator.clipboard` when available; falls back silently if unavailable.

3) Showcase (existing)
- Slots: `canvasOverlays`, `commands`
- UX: Demonstrates overlays and commands with a selection HUD and two Hello actions.
- Purpose: Provide an obvious example to users and plugin authors.

## Candidate Core Plugins (future)

4) Quick Export
- Slots: `commands`, optional `sidePanels`
- UX: Context commands to export current diagram JSON or PNG; a panel with one‑click export.
- API Needed: Expose `exportJson()` and `exportPng()` via App API to plugins.

5) Search Helpers
- Slots: `commands`, `searchProviders`
- UX: Commands like “Highlight neighbors of selection” or “Select by tag”. Providers can participate in the Search ranking/matching.
- API Needed: Read edges or provide helper lookups via App API; expose `setHighlightedNodeIds` safely. Providers receive `(query, nodes)` and return `{ node, score?, exact?, matchedIndices? }`.

6) Theme Preview Overlay
- Slots: `canvasOverlays`
- UX: Small overlay to cycle theme preview with arrows.
- API Needed: Read current theme and a safe setter (already in ThemeContext; consider a thin plugin API bridge).

## Custom Plugin Ideas

7) JSON Import Tools
- Slots: `sidePanels`, `commands`
- UX: Import nodes from pasted JSON with mapping rules (e.g., fields to label/tags).
- API Needed: Controlled write APIs to add nodes/edges (future); for now, output a JSON file for Import.

8) GitHub Issues Importer
- Slots: `sidePanels`
- UX: Paste GitHub CSV export to create nodes with labels and tags.
- API Needed: Same as above; for now, export JSON to file and prompt user to import.

9) Heatmap Overlay
- Slots: `canvasOverlays`
- UX: Color overlay based on node attributes (e.g., tag frequency).
- API Needed: Read nodes (already provided); no write access required.

10) AI Summarizer (external)
- Slots: `sidePanels`
- UX: Summarize selected nodes into a description.
- API Needed: None beyond read selection; network disabled by default — recommend users run locally and paste results.

## Notes
- Keep the App API minimal; prefer read‑only where possible.
- Introduce new setters as explicit, well‑scoped actions (e.g., export) with user intent.
- All plugins should feature‑detect API fields and fail gracefully.
- When shipping “bundled custom” plugins (examples that are authored in-repo but meant to appear in the Custom tab), register them in `bundledCustomPlugins` and ensure every discovery surface (plugin manager preload, control hub router, etc.) merges `corePlugins`, `bundledCustomPlugins`, and stored user imports. Missing any surface leads to “Plugin not found” errors in the Control Hub and inconsistent toggle state.
