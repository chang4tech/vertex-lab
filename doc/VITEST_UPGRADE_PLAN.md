# Vitest Major Upgrade Plan

Vitest 0.x brings along transitive esbuild/vite advisories. Upgrading to the latest 3.x release closes the audit items reported by `npm audit`. Follow this checklist when the codebase is ready:

1. **Update dependencies**
   - Bump `vitest` to `^3.x` in both root `package.json` and `server/package.json`.
   - Upgrade peer tooling required by Vitest 3 (e.g. `vite` 5+, `@vitest/coverage-v8`, `@vitest/ui`).
   - Replace deprecated coverage options with the new `coverage` config shape if necessary.

2. **Adjust configuration**
   - Review `vitest.config.js` for breaking changes (e.g. `environment`, `include/exclude` syntax) and update accordingly.
   - Confirm JSDOM-specific setup still runs (`setupFiles`).
   - Validate server Vitest config (`server/vitest.config.js`) still points at `node` environment and test globs.

3. **Rewrite incompatible test helpers**
   - Run `npm test` (root and server) and fix any assertion or mock API differences.
   - Pay attention to changes around `vi.mock`, fake timers, and snapshot formatting.

4. **Check integration points**
   - Ensure Playwright e2e scripts (`npm run test:e2e`) are unaffected, or pin compatible versions.
   - Verify Vite dev server still runs (Vitest 3 bundles with newer Vite).

5. **Refresh documentation & tooling**
   - Update `README.md`, `doc/BACKEND_SETUP.md`, and any scripts referencing specific Vitest flags.
   - Capture upgrade notes in `CHANGELOG.md` and link this plan.

6. **Re-run quality gates**
   - `npm test`, `npm run test:coverage`, and `npm run lint` at the repo root.
   - `npm test` inside `server/`.
   - Regenerate coverage artifacts and CI caches if applicable.

7. **Remove legacy workarounds**
   - Drop the audit warning notice from documentation once advisories no longer show up.

Keep this document alongside other operational guides so the team can coordinate the upgrade when dependencies stabilize.
