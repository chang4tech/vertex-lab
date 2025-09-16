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

## 2025-09-15: Core plugin scope and command filtering API

Context: Introduce useful core plugins without expanding the App API too aggressively, and ensure command predicates can use selection context.

Decisions
- Ship Selection Tools and Clipboard Tools as core plugins
  - Rationale: They use existing safe App APIs (edit, toggle collapse, delete) or browser clipboard; provide immediate user value.
  - Consequence: Visible, low-risk additions that demonstrate panel and command slots.

- Pass minimal API to command filtering
  - Rationale: Function predicates in `when(api, ctx)` should have access to selection/nodes to enable/disable accurately.
- Consequence: Predictable command visibility; still read‑only to avoid exposing mutating actions widely.

## 2025-09-15: Command runner API additions (edges + setHighlightedNodes)

Context: Enable non-destructive, useful commands (e.g., highlight neighbors) without broadening mutation surface.

Decision
- Include `edges` and `setHighlightedNodes` in the command runner API
  - Rationale: Commands often need graph context to compute results and a way to present them; highlighting is reversible and safe.
  - Alternatives: Add full write APIs; rejected for now to keep safety and simplicity.
- Consequence: Plugins can implement helpful visual tools (neighbors, heatmaps later) while keeping data integrity intact.

## 2025-09-15: Per-plugin pages and logging helpers

Context: Users want each plugin to have its own page for configuration and console.

Decisions
- Add router support for `#/plugin/:id/:tab` and a `PluginPage` component
  - Rationale: Keep plugin management discoverable via deep links and allow plugins to grow settings UIs without cluttering global Settings.
  - Consequence: A simple page frame with tabs (Config/Console); minimal app API exposure on config pages.

- Provide `api.plugin` helpers (log/openConfig/openConsole)
  - Rationale: Give plugins a standard way to log to the console page and navigate users to their pages.
  - Alternatives: Global logging API via imports (not compatible with runtime-loaded plugins); using window events (more brittle).
  - Consequence: More cohesive developer experience and easier debugging for users.

## 2025-09-16: Control Hub i18n, Markdown docs, and completeness indicator

Context: Users requested clearer, localized plugin guidance and noticed several plugins appear incomplete.

Decisions
- Localize Control Hub labels and tip banner
  - Rationale: Make the Hub and first‑time enablement UX readable across locales; avoid hardcoded English strings.
  - Consequence: Introduces new i18n keys used by PluginPage, PluginsManager, and the tip banner.

- Support `aboutPage.markdown` in addition to `render`
  - Rationale: Many “How to Use” sections are static lists; Markdown lowers authoring cost while remaining safe (lightweight parser for headings/lists/paragraphs).
  - Alternatives: Bring a full Markdown library (heavier dependency); render HTML (security concerns). Chosen: minimal internal renderer.
  - Consequence: Core plugins now ship Markdown docs; Hub prefers Markdown if present.

- Add “Incomplete” badge heuristic in Plugins dialog
  - Rationale: Surface plugins with no visible contributions so users understand why enabling them has no visible effect yet.
  - Heuristic: No panels, commands, overlays, about, or config → mark as incomplete. Non-blocking and purely informational.

- Fix effect ordering for tip banner
  - Rationale: Avoid referencing `activePlugins` before initialization to prevent runtime errors.
  - Consequence: Single effect lives below `activePlugins`; eliminates temporal dead zone.

## 2025-09-16: Mobile experience improvements

Context: The app is frequently used on touch devices; canvas clarity and touch ergonomics needed refinement.

Decisions
- Add high‑DPI (devicePixelRatio) scaling
  - Rationale: Canvas appears blurry on retina/mobile without DPR-aware backing store.
  - Approach: Scale the 2D context using setTransform and size the backing store to CSS×DPR while keeping world units in CSS space.
  - Considered: Rewriting draw logic to account for pixels; rejected—transform is simpler and safer.

- Improve long‑press handling for context menu
  - Rationale: Users could accidentally trigger the menu during slow pans.
  - Change: Increase movement cancel threshold from 12px to 20px while keeping ~500ms delay.

- Respect safe‑area and touch targets for quick controls
  - Rationale: Avoid overlap with iOS home indicators; ensure accessible hit areas.
  - Change: Offset controls using CSS env() and enforce 44×44 button sizes.

- Adjust Node Info panel and menus on mobile
  - Rationale: Reduce canvas occlusion and make tapping easier.
  - Change: Narrow panel width on mobile; increase menu item spacing via media query for coarse pointers.

## 2025-09-16: iOS long‑press callout suppression and overlay layering

Context: On iOS, long‑pressing the canvas could trigger the native callout (Search/Define), competing with our custom context menu. Floating FABs/help occasionally overlaid dropdown menus on mobile.

Decisions
- Suppress iOS callout and selection on the canvas
  - Approach: Inline canvas styles `-webkit-touch-callout: none`, `-webkit-user-select: none`, `user-select: none`; additionally call `preventDefault()` on touch `pointerdown` before starting long‑press logic.
  - Rationale: CSS alone can be insufficient on some WebKit builds; combining CSS with early `preventDefault()` is a robust pattern.
  - Considered: Global `touch-action: none` on body (too invasive), intercepting `contextmenu` only (doesn’t prevent selection toolbar). The chosen approach is scoped and does not block scroll in other areas.

- Respect safe‑area and fix overlay stacking
  - Changes: Use `env(safe-area-inset-*)` for minimap offsets; raise `.menu/.menu-dropdown` z-index above floating FABs/help.
  - Rationale: Ensure menus are never obscured and avoid overlap with the iOS home indicator.

- Enable safe-area via viewport
  - Change: `viewport-fit=cover` in the HTML meta viewport to expose insets on iOS.

Implications
- Mobile UX feels native: no iOS callout over the canvas, menus stay on top, and overlays avoid the home indicator.
- Scoped changes minimize risk to desktop UX.

## 2025-09-16: LAN access documentation

Context: Developers need to access the dev server from other devices for mobile testing.

Decision
- Document LAN usage succinctly in README and provide a detailed `doc/DEV_SERVER.md` including `--host`, preview, IP lookup, and firewall tips.
  - Rationale: Keep README actionable while moving detailed guidance to docs to avoid clutter.
  - Considered: Default `server.host=true` in Vite config; left optional and documented to avoid unexpected exposure on untrusted networks by default.
