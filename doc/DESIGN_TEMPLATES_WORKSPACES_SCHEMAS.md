# Templates, Workspaces, and Schemas — Exploration & Decisions

This document captures the exploration and decisions around improving knowledge representation features: templates, workspaces (environment), and schemas (types/properties/relations).

## Definitions (agreed)
- Plugins: feature capabilities and tag capabilities for graphs (behavioral/UX extensions delivered as code via slots).
- Templates: tag sets, sample graphs, and presets for graphs (data‑only packs applied via pre‑flight merge/mapping).
- Workspaces: storage, library, and organization of graphs (environment/profile settings, plugin prefs, theme/layout, etc.).

## Current State (relevant context)
- Plugins: extensibility via sidePanels, canvasOverlays, commands, searchProviders, notifications, configPage.
- Search: plugin‑extensible providers aggregated with a fallback; UI is a core plugin overlay; command routing via `core.search.open`.
- Linter: Graph Linter plugin with workerized scans (duplicates, orphans, directed cycles, long labels) + cluster detection; auto‑fixes; cache by graph signature (labels/levels/timestamps + edges) and settings.
- App API: `updateNodes` and `updateEdges` with undo/redo parity; selection/highlight helpers; worker‑friendly caching concepts.

## Goals
- Share domain knowledge (tags, properties, types) safely and repeatably.
- Keep UX smooth on large graphs (workerized/heavy tasks + caching).
- Allow multiple plugins to read the same “truth” for types/props/relations.
- Preserve portability and offline use; avoid executing untrusted code.

---

## Decision: Split into Template System and Workspace System

- Template System (content/domain)
  - Packs that include: tags, properties, optional schema fragments (types + edge types), and optional starter subgraphs.
  - Strict JSON validation; pre‑flight checks and merge/mapping UI; single‑undo apply.
  - JSON only (no executable code); optional checksums/signatures.

- Workspace System (environment/preferences)
  - Plugin enablement map, per‑plugin config, theme, locale, overlay layout, shortcut overrides, defaults (linter/search/worker toggles).
  - Workspaces can be saved/loaded/shared as `workspace.json`. Optional profile switcher.

Rationale: separates domain content from user environment, simplifies sharing and setup, and reduces risk.

---

## Template Pack Format (proposed)

```
{
  "meta": { "name": "Example Kit", "version": "1.0.0", "author": "Team", "description": "…" },
  "requires": {
    "app": ">=0.14.0",
    "plugins": [{ "id": "core.search" }, { "id": "examples.graphLinter" }],
    "capabilities": ["searchProviders", "updateEdges"]
  },
  "schema": {
    "types": [
      { "name": "Paper", "color": "#1e3a8a",
        "properties": [
          { "name": "year", "type": "number", "required": true },
          { "name": "authors", "type": "string[]" }
        ] }
    ],
    "edgeTypes": [
      { "name": "cites", "directed": true, "sourceTypes": ["Paper"], "targetTypes": ["Paper"] },
      { "name": "depends_on", "directed": true, "noCycle": true }
    ]
  },
  "tags": [ { "id": "ml", "name": "ML", "color": "#10b981" } ],
  "properties": [ { "name": "confidence", "type": "number", "default": 0.8 } ],
  "nodes": [ { "type": "Paper", "label": "Seed Paper", "year": 2024, "tags": ["ml"] } ],
  "edges": []
}
```

### Pre‑flight Import Flow
1. Validate manifest against a JSON Schema. Fail with actionable errors.
2. Check `requires`:
   - App semver.
   - Plugins present/enabled OR match via capability registry (soft dependency).
3. Show mapping/merge UI:
   - Tags: map/merge/rename.
   - Properties/types: map/rename/skip; show diffs.
   - Subgraph: preview re‑mapped node/edge IDs.
4. Apply plan in a single undo boundary.

### Integrity & Safety
- JSON only; reject executable fields.
- Optional checksum/signature in `meta`; warn on mismatch.
- Idempotence: content hashing; warn if same pack already applied.

### Backward Compatibility
- Legacy templates: auto‑wrap into a pack and route through pre‑flight; warn/suggest exporting with the new format.

---

## Workspace System (proposed)

- Model:
  - `id`, `name`, `version`, `appVersion`
  - `pluginPrefs: { [pluginId]: boolean }`
  - `pluginConfig: { [pluginId]: any }`
  - `ui: { theme, locale, overlayLayoutOverrides, shortcutsOverrides }`
  - `defaults: { linterSeverity, searchOptions, workerToggles }`
  - `notes`, `lastAppliedTemplatePacks: string[]`
- Persistence:
  - Stored as `vertex_workspace_<id>` with an active workspace pointer.
  - Export/import `workspace.json` for sharing.

---

## Schemas (Core vs Plugin)

- Plugin‑Managed Schema (now): A “Schema Manager” plugin stores types/properties; others read it. Fast path.
- Core Schemas Engine (later): Minimal host API for shared truth and validation:
  - `schema.get() / set(next) / watch(cb)`
  - `schema.validateNode(node) / validateEdge(edge)`
  - `schema.inferType(node) / defaultsFor(type)`

Integration:
- Linter: add rules for required fields, enum, edge type constraints; use `updateNodes/updateEdges` to fix.
  - Includes `noCycle` for relations like `depends_on` (enforce DAGs) and source/target compatibility.
- Node Editor: start with a “Typed Props” side panel; consider an editor slot later if needed.
- Search: schema DSL provider (filters by type/props), merged with aggregator.
- Export: JSON‑LD/RDF mapping plugin reads shared schema.

---

## Dependencies: Plugins vs Capabilities

- Strict plugin IDs: predictable but brittle across forks.
- Capabilities: decouple from IDs. Tiny host registry declaring provided capabilities (e.g., `searchProviders`, `updateEdges`), so template packs can require features without tying to a specific plugin.

---

## Workerization & Caching (KR tasks)

- Heavy tasks run in Workers: linter rules (done), clusters (done), centrality (future), topic clustering (future).
- Cache keys include:
  - Graph signature: hash of `node id + label + level + timestamps` and all edges (s/t/directed).
  - Settings signature: booleans/thresholds that affect compute.
  - Graph ID: per‑graph scoping.

Benefits: consistent performance on large graphs, deterministic invalidation.

---

## Alternatives Considered

- Everything as plugins (no core schema): fastest to ship, but risks duplication/drift.
- Core engine only (no templates): strong consistency but no portable domain packs.
- Hard dependencies (IDs only): simpler now, brittle later; capabilities are more flexible.

Decision: ship template packs + workspace first; incubate schema UI as a plugin; consider a minimal core schema API later.

---

## Roadmap (phased)

1) Template Packs & Workspace
- Templates plugin: import/export packs, manifest validation, requires checks, mapping UI, single‑undo apply.
- Workspace model + persistence; Workspace Manager UI.

2) Capabilities & Tooling
- Capability registry in host; use in pack `requires.capabilities`.
- Telemetry or analytics optional (local only).

3) Schema Integration
- “Schema Manager” plugin: define types/properties/colors, and (optionally) edge types.
- Linter rules for required/enum/constraints; one‑click fixes.
- Search DSL provider for type/prop filters.

4) Lenses & Reasoning
- Workerized centrality/community lenses; overlays with legends.
- Rule packs (JSON) for inference/constraints consumed by linter/inference plugins.

---

## Security & UX Guardrails
- Code‑free packs; strict JSON validation.
- Pre‑flight diff; never apply without preview.
- One‑click rollback via undo boundary.
- Optional checksum/signing for provenance.

---

## Open Questions
- Promote schema to core: which minimal API first? (get/set/validate, watch)
- Command palette: unify node/command search under one overlay?
- Profile bundles: workspace + list of packs for one‑click bootstraps.

---

## References (in‑repo)
- Graph Linter (example): workerized scans, cache signature, cluster detection.
- Search: providers slot + aggregator + overlay + command routing.
- App API: `updateNodes`, `updateEdges`, selection/highlight, view resets, worker‑friendly caching concepts.
