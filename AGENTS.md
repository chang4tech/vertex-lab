# Repository Guidelines

## Project Structure & Module Organization
- `src/` – React source. Key areas: `components/` (UI, e.g., `NodeInfoPanel.jsx`), canvas (`VertexCanvas.jsx`), `hooks/` (e.g., `useKeyboardShortcuts.js`), `utils/` (layout, node, search helpers), `i18n/` (locales), `themes/`, `styles/`.
- `src/__tests__/` – Unit/UI tests mirroring `src` (e.g., `components/VertexCanvas.test.jsx`, `utils/nodeUtils.test.js`).
- `public/` – Static assets. `dist/` – Build output (ignored).
- Entrypoints: `src/main.jsx`, `src/App.jsx`. Config: `vite.config.js`, `vitest.config.js`, `eslint.config.js`.

## Build, Test, and Development Commands
- `npm run dev` – Start Vite dev server at `http://localhost:5173`.
- `npm run build` – Production build to `dist/`.
- `npm run preview` – Serve the production build locally.
- `npm run lint` – Run ESLint on the repo.
- `npm test` / `npm run test:watch` – Run Vitest (jsdom environment).
- `npm run test:coverage` – Coverage report (text + HTML).
- `npm run test:ui` – Vitest UI for interactive runs.

## Coding Style & Naming Conventions
- Language: React 19 + JSX, ES Modules.
- Indentation: 2 spaces; semicolons optional but be consistent.
- Components: PascalCase filenames (e.g., `ThemeSelector.jsx`). Hooks: `useX` camelCase. Utils: camelCase.
- Prefer functional components with hooks; keep side effects in `useEffect`.
- Linting: ESLint (recommended rules + React Hooks + React Refresh). Fix warnings before PR.

## Testing Guidelines
- Framework: Vitest + Testing Library (`@testing-library/react`, `jest-dom`).
- Location: `src/__tests__` mirroring source folders.
- Naming: `*.test.{js,jsx}` or `*.spec.{js,jsx}`.
- Setup: `src/__tests__/setup.js` auto-mocks canvas, ResizeObserver, URL, and localStorage.
- Write tests for new logic (especially `utils/` and interactive components). Ensure all tests pass.

## Commit & Pull Request Guidelines
- Commits: concise imperative titles (e.g., "Add search", "Fix canvas pan"). Group related changes.
- PRs: include summary, rationale, screenshots/GIFs for UI changes, test coverage notes, and linked issues.
- Keep PRs small and focused; ensure `lint` and `test` pass locally.

## Security & Configuration Tips
- Do not commit secrets. Configuration is via Vite/env; prefer `import.meta.env` and `.env.local` (gitignored).
- Validate and sanitize imported files (JSON) and user input when extending file operations.
