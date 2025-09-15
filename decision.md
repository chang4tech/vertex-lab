# Decision Log: Plugin System Migration

Date: 2025-09-15

## Context
The app had plugin toggles interleaved with general settings and relied on a static list of core plugins. We needed a simple, stable plugin host and a way for users to bring their own plugins without forking.

## Decisions

1) Runtime import supports only local files, not URLs
   - Rationale: Avoid remote code execution and CSP issues; keep UX explicit and safe.
   - Impact: Authors can still distribute via npm for static imports; local development is easy via file import.

2) Persist plugin sources in localStorage
   - Rationale: Zero setup and consistent with other app preferences; good for personal use.
   - Alternatives considered: IndexedDB (more complex for marginal benefit), filesystem APIs (not broadly available).

3) Minimal App API surface for plugins
   - Rationale: Keep the host stable and easy to maintain; reduce coupling.
   - Impact: Feature-detect fields; expand surface cautiously as new slots appear.

4) Dedicated Plugins dialog separate from Settings (shortcuts)
   - Rationale: Reduces UI clutter and avoids confusion with keyboard shortcuts management.
   - Impact: Clear discovery for plugin enable/disable and import.

## Consequences
- Users gain a straightforward flow to add plugins without compromising security.
- Codebase simplifies around a single merged plugin list and persisted preferences.
- Future slot expansion remains possible without breaking current plugins.

---

## 2025-09-15: Validation tightening without new features

Context: Improve plugin system focused on migration from legacy code, not feature work.

Decision: Tighten `validatePlugin` to reject `slots` supplied as an array. Spec requires `slots` to be an object; allowing arrays was an oversight.

Rationale:
- Aligns implementation to documented contract (object `slots`).
- Prevents ambiguous schemas and catches authoring errors early.
- Non-breaking for compliant plugins; corrective for malformed ones.

Implications:
- No new functionality introduced.
- Tests added to cover preference defaults and plugin validation.

## 2025-09-15: Error isolation and duplicate handling

Context: Custom plugins can fail at render time, and duplicate IDs across core/custom lists can cause subtle bugs.

Decisions
- Add an error boundary around plugin panels
  - Rationale: Prevent a single faulty panel from crashing the app; provide a clear fallback so users can recover and disable the plugin if needed.
  - Considered: Global error boundary (too broad), try/catch inside host (does not catch render errors). React ErrorBoundary is the right tool.
  - Consequence: Slight markup overhead per panel; dramatically improved resilience.

- Deduplicate plugins by id with first‑wins policy
  - Rationale: Keep core plugins authoritative and avoid accidental overrides; deterministic order and logging helps debugging.
  - Considered: last‑wins (more surprising if a custom plugin shadows core), hard error (too strict for user workflows).
- Consequence: Duplicates are ignored with a console warning; authors should pick globally unique IDs.

## 2025-09-15: New slots and visible UX

Context: Users asked for visible impact from the plugin system improvements and more extension points.

Decisions
- Add `canvasOverlays` and `commands` slots
  - Rationale: Overlays enable lightweight HUD/UI without modifying core; commands integrate into existing context menu for discoverability.
  - Alternatives: Separate commands palette or keyboard registry first (deferred to avoid scope creep).
  - Consequence: Minimal wiring in App; documented shapes; future work can expand command contexts and keyboard integration.

- Surface plugin metadata and errors in Plugins Manager
  - Rationale: Make plugin state tangible to users and aid debugging.
  - Considered: Dedicated error panel; chosen to start small within existing modal.
  - Consequence: Slightly denser Plugins UI but keeps information close to controls (enable/disable/remove).
