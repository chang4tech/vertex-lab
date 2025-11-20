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
- Pre-flight shows a dependency summary and a tag merge plan.
- If a pack includes a schema fragment, the importer provides a mapping UI:
  - Types: rename or skip per incoming type.
  - Properties: rename or skip per property of each incoming type.
  - Optionally import the mapped schema directly into the Schema Manager (and include edge types).
  - Renames apply to imported nodes (type and property names) as well.
- Validation errors are grouped by section (Meta, Requires, Schema, Tags, Properties, Nodes, Edges) for faster resolution.
- Mapping warnings highlight potential collisions:
  - Duplicate property target names within a type mapping.
  - Target property names that already exist in the destination type.
- The importer validates `schema.edgeTypes` entries (name, directed, noCycle, optional source/target type lists) and, when types are present, checks that referenced types exist.
- Apply is disabled until required plugins from `requires.plugins` are enabled; the summary offers an “Enable” button to toggle missing core plugins (when available).
- Nodes/edges IDs are remapped on apply to avoid collisions.

## Seed Pack: Paper Research Kit

- Path: `public/packs/paper_research_kit.json`
- Contents: common research tags (ML/CV/NLP), schema for Paper/Concept with properties, and a small starter graph.
- Import: open Templates panel and click “Load Seed: Paper Research Kit”.

## Roadmap
- Strict JSON schema validation for packs with richer error messages.
- Schema promotion to core API (watch/set/validate) beyond the plugin-managed manager.
- Capability registry for softer dependency checks (e.g., `updateEdges`).

## JSON Schema (Author Guidance)

The following JSON Schema (Draft-07 style) describes the expected shape of a Template Pack. It is intended to help authors validate packs during authoring. The app performs its own validation and may accept additional fields; unknown fields are ignored.

```
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["meta"],
  "additionalProperties": true,
  "properties": {
    "meta": {
      "type": "object",
      "required": ["name"],
      "additionalProperties": true,
      "properties": {
        "name": { "type": "string", "minLength": 1 },
        "version": { "type": "string" },
        "author": { "type": "string" },
        "description": { "type": "string" }
      }
    },
    "requires": {
      "type": "object",
      "additionalProperties": true,
      "properties": {
        "app": { "type": "string" },
        "plugins": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["id"],
            "properties": { "id": { "type": "string", "minLength": 1 } },
            "additionalProperties": true
          }
        },
        "capabilities": { "type": "array", "items": { "type": "string" } }
      }
    },
    "schema": {
      "type": "object",
      "additionalProperties": true,
      "properties": {
        "types": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["name"],
            "additionalProperties": true,
            "properties": {
              "name": { "type": "string", "minLength": 1 },
              "color": { "type": "string" },
              "properties": {
                "type": "array",
                "items": {
                  "type": "object",
                  "required": ["name", "type"],
                  "additionalProperties": true,
                  "properties": {
                    "name": { "type": "string", "minLength": 1 },
                    "type": { "enum": ["string", "number", "boolean", "string[]", "number[]"] },
                    "required": { "type": "boolean" },
                    "default": {},
                    "enum": { "type": "array", "items": { "type": "string" } }
                  }
                }
              }
            }
          }
        },
        "edgeTypes": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["name"],
            "additionalProperties": true,
            "properties": {
              "name": { "type": "string", "minLength": 1 },
              "directed": { "type": "boolean" },
              "sourceTypes": { "type": "array", "items": { "type": "string" } },
              "targetTypes": { "type": "array", "items": { "type": "string" } },
              "noCycle": { "type": "boolean" }
            }
          }
        }
      }
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name"],
        "additionalProperties": true,
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string", "minLength": 1 },
          "color": { "type": "string" }
        }
      }
    },
    "properties": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "type"],
        "additionalProperties": true,
        "properties": {
          "name": { "type": "string", "minLength": 1 },
          "type": { "enum": ["string", "number", "boolean", "string[]", "number[]"] },
          "default": {}
        }
      }
    },
    "nodes": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": true,
        "properties": {
          "id": { "type": ["integer", "string"] },
          "type": { "type": "string" },
          "label": { "type": "string" },
          "x": { "type": "number" },
          "y": { "type": "number" },
          "level": { "type": ["integer", "number"] },
          "tags": { "type": "array", "items": { "type": ["string", "number"] } }
        }
      }
    },
    "edges": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["source", "target"],
        "additionalProperties": true,
        "properties": {
          "source": {},
          "target": {},
          "directed": { "type": "boolean" },
          "type": { "type": "string" }
        }
      }
    }
  }
}
```

Tips
- Keep packs JSON-only (no code).
- Prefer stable names for types/properties; use the importer to map/rename on load.
- Use the importer’s pre-flight to review dependencies, tag plan, and mapping before apply.
