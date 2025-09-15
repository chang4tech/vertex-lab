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

