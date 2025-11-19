# Templates (Packs)

Template Packs are data-only bundles that include tag sets, optional schema fragments (types/edge types), properties, and an optional starter subgraph. They are imported via the Templates panel (Plugins → Templates) and applied with a single undo boundary.

## Format

```
{
  "meta": { "name": "Example", "version": "1.0.0", "author": "Team" },
  "requires": { "app": ">=0.18.0", "plugins": [{"id":"core.schemaManager"}], "capabilities": ["updateEdges"] },
  "schema": { "types": [ { "name": "Paper", "color": "#1e3a8a", "properties": [ {"name": "year", "type": "number", "required": true} ] } ], "edgeTypes": [] },
  "tags": [ {"id": "ml", "name": "ML", "color":"#10b981" } ],
  "properties": [ {"name": "confidence", "type": "number", "default": 0.8 } ],
  "nodes": [ { "id": 1001, "type": "Paper", "label": "Seed Paper", "year": 2024 } ],
  "edges": [ { "source": 1001, "target": 1002, "directed": true } ]
}
```

- JSON only; no executable code.
- Pre-flight shows a dependency summary and a tag merge plan; properties/types are accepted (schema is stored via the Schema Manager plugin).
- Nodes/edges IDs are remapped on apply to avoid collisions.

## Seed Pack: Paper Research Kit

- Path: `public/packs/paper_research_kit.json`
- Contents: common research tags (ML/CV/NLP), schema for Paper/Concept with properties, and a small starter graph.
- Import: open Templates panel and click “Load Seed: Paper Research Kit”.

## Roadmap
- Strict JSON schema validation for packs with richer error messages.
- Mapping UI for properties/types (rename/skip); schema promotion to core API.
- Capability registry for softer dependency checks (e.g., `updateEdges`).
