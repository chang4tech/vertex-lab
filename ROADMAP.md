# Roadmap

This document outlines the near-term, next-phase, and later goals for Vertex Lab. It is intentionally concise and delivery-focused. Milestones map to planned minor versions and time windows.

## Milestones

- v0.4.0 – Near-Term (≈ 2 weeks)
  - Search polish: ranking, keyboard navigation, empty states; add tests
  - Canvas performance: profile 1k–5k nodes; memoize hot paths; batch state updates
  - Accessibility: dialogs/menus ARIA roles, focus traps, contrast sweep
  - E2E coverage: import/export flows, plugin conflicts, mobile nav smoke tests
  - CI: GitHub Actions for lint/test/build + Playwright matrix

- v0.5.0 – Next (≈ 3–5 weeks)
  - Large-graph scaling: virtualized labels, OffscreenCanvas/worker-friendly layouts
  - Background workers: move layout + search indexing off main thread
  - Import/export hardening: JSON schema validation + sanitization
  - Plugin sandbox: scoped API and isolation strategy
  - i18n: complete ES strings, extraction tooling, fallbacks

- v0.6.0 – Later (≈ 6–8 weeks)
  - Data migrations: versioned localStorage keys and data shape
  - Undo/redo: bounded history, snapshot compression
  - Plugin API 1.0: stable hooks, typed docs, example gallery
  - Persistence options: export bundles; explore optional cloud sync design

## Quality Gates

- Unit coverage ≥ 80% across `utils/` and interactive components
- E2E flake rate < 1%; keep 60fps pan/zoom on 2k nodes on mid‑tier hardware
- Zero known accessibility regressions (keyboard + screen reader paths)

## Release Prep

- Use `npm run release` to cut the next version (minor by default)
- Update README, PLUGINS docs, and include a demo graph for screenshots

