# Vertex Lab Documentation

This folder contains project documentation and helper guides.

## Contents
- `AUDIENCE.md` — Primary and secondary audiences, use cases, and value propositions.
- `TODO.md` — Roadmap items, feature checklist, and technical improvements.
- `CODEBUDDY.md` — Developer‑oriented overview, architecture, and development patterns.
- `GEMINI.md` — Feature highlights and quick usage instructions.
- `NODE_INFO_PANEL_FEATURE.md` — Detailed write‑up of the Node Info Panel.
- `PLUGIN_SPEC.md` — How to author, import, and test plugins.
- `PLUGINS_DESIGN.md` — High‑level plugin surfaces and future directions (now includes `searchProviders`).
 - `DESIGN_TEMPLATES_WORKSPACES_SCHEMAS.md` — Exploration and decisions for Template Packs, Workspace profiles, and Schemas
 - `TEMPLATES.md` — Template Pack format and seed packs (Paper Research Kit)

### Search Providers and Core Search
- A new slot `slots.searchProviders` allows plugins to contribute search logic.
- The core `core.search` plugin renders the Search UI as an overlay; configure it in the plugin Control Hub (include tags, debounce).
- The search open command is `core.search.open` and is bound to Cmd/Ctrl + F.

## Location Changes
The following files were moved from the repository root to `doc/` to keep the root clean and make documentation easier to find.
