# Vertex Lab
 
A powerful and intuitive diagramming tool built with React and HTML5 Canvas. Create, organize, and visualize your thoughts with an interactive and user-friendly interface.

## Features

- 🎯 **Intuitive Node Management**
  - Create child, sibling, and parent nodes
  - Drag and drop nodes to reposition
  - Quick node editing and deletion
  - Multi-node selection
  - Tag manager to add/edit/remove tags

- 🎨 **Interactive Canvas**
  - Smooth pan and zoom
  - Center view on root node
  - Custom zoom controls
  - High‑DPI rendering for crisp visuals on mobile/retina
  - Mobile friendly: safe‑area aware overlays and no iOS long‑press callout
  - Space + left click to pan

- 💾 **Data Management**
  - Import/Export JSON files
  - Export as PNG images
  - Local storage persistence
  - Template library system
  - Undo/Redo support

- ⌨️ **Keyboard Shortcuts** (full list in-app: Help → Keyboard Shortcuts)
  - `⌘/Ctrl + ⇧ + N`: New diagram
  - `⌘/Ctrl + S`: Export JSON
  - `⌘/Ctrl + ⇧ + S`: Export PNG
  - `⌘/Ctrl + ⇧ + O`: Import JSON
  - `⌘/Ctrl + Z` / `⌘/Ctrl + ⇧ + Z`: Undo / Redo
  - `⌘/Ctrl + L`: Auto layout
  - `⌘/Ctrl + F`: Search
  - `⌥ + =` or `⌥ + +`: Zoom in
  - `⌥ + -`: Zoom out
  - `⌥ + 0`: Reset zoom
  - `⌥ + C`: Center diagram
  - `⌘/Ctrl + I`: Toggle node info panel
  - `M`: Toggle minimap
  - `Delete` / `Backspace`: Delete selected
  - `Enter`: Rename node
  - `Tab`: Add connected node (adds a neighbor and connects it)
  - `E`: Connect/Disconnect selected (with 2+ nodes selected; uses first selected as anchor)

## Changelog

For a detailed list of changes and fixes, see `CHANGELOG.md` at the project root.

## Plugins

Vertex Lab supports plugins that contribute UI panels, canvas overlays, commands, and search providers. Manage plugins via Settings → Plugins (enable/disable core plugins and import custom `.js/.mjs` plugins). The host error‑isolates plugin panels, dedupes plugins by id (first occurrence wins), and surfaces plugin commands in the context menu when applicable.

- Control Hub: Each plugin has a localized Control Hub with sections for “How to Use”, “Settings”, and a “Console” with Copy/Clear.
- How to Use: Authors can provide a simple `aboutPage.markdown` string for richer docs; it’s rendered as lightweight Markdown.
- First‑time tip: When you enable a plugin for the first time, a localized banner appears linking to its Control Hub.
- Incomplete indicator: Plugins with no visible contributions (no panels, commands, overlays, about, or config) show an “Incomplete” badge in the Plugins dialog.

See `doc/PLUGIN_SPEC.md` for the full specification. Migration and progress notes are summarized in `doc/progress.md` and tracked in `CHANGELOG.md`.

### Search Architecture
- Providers: Plugins may register `slots.searchProviders` to participate in matching and ranking.
- Aggregation: The core UI aggregates provider results with a built‑in fallback (exact > prefix > others; then score; then label).
- Command: Cmd/Ctrl + F routes through the `core.search.open` command so plugins can override open behavior.
- UI Plugin: The Search modal is rendered by the core `core.search` plugin as a canvas overlay. Its Control Hub exposes settings like “Include tags” and “Debounce (ms)”.
- Example: The bundled custom plugin “Prefix Search Provider (Example)” shows how to implement a simple provider.

## Getting Started

### Prerequisites

- Node.js 16.0 or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd vertex-lab-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open http://localhost:5173 in your browser

### Backend Services

A Fastify-powered API is available under `server/`. Install its dependencies separately and run it alongside the front-end.

```bash
cd server
npm install
cp .env.example .env # update as needed
npm run dev
```

`npm run dev` automatically runs `npm run postgres:start` which ensures a local Postgres 14 service (via Homebrew) is running and the `vertex` database/user exist. Set `DATABASE_URL` differently if you use another Postgres instance.

The backend listens on port 4000 by default; adjust the `.env` file if the port conflicts with other services.

For persistent teams, set `DATABASE_URL` to a Postgres instance (see `doc/BACKEND_SETUP.md` for setup). Local development defaults to SQLite at `server/data/vertex.db`.

If the API is unavailable, Vertex Lab automatically falls back to local storage so you can keep saving and loading diagrams offline. When the connection returns, local drafts are pushed in the background and the UI shows an “Unsynced” badge on any graphs that are still waiting to upload.

Set `VITE_API_BASE_URL` in your front-end `.env` (see `.env.example`) if the API runs somewhere else. You can also override at runtime by defining `window.__VERTEX_CONFIG__ = { apiBaseUrl: 'https://api.example.com' }` before the app script loads.

For production deployments, edit `public/runtime-config.js` (copied verbatim to `dist/runtime-config.js`) to point at the desired API host without triggering a rebuild.


### Access from other devices (same network)

- Start on LAN: `npm run dev -- --host`
- Use the Network URL Vite prints (e.g., `http://192.168.1.23:5173`)
- On your phone (same Wi‑Fi), open that URL in a browser
- Alternative (prod-like): `npm run build` then `npm run preview -- --host`
- Optional config: set `server: { host: true, port: 5173 }` in `vite.config.js`
- Troubleshooting: ensure same Wi‑Fi (not guest), allow Node/Vite through firewall, disable VPNs, and use the IP URL (not `localhost`)

For more details, see `doc/DEV_SERVER.md`.

## Usage

### Basic Operations

1. **Creating Nodes**
   - Click a node and press `Tab` to add a connected node (neighbor) and link it
   - Press `Enter` to rename the selected node

2. **Editing Nodes**
  - Click a node to select it
  - Press `Enter` to rename the selected node
  - Drag nodes to reposition them
  - Use Ctrl/Cmd-click to multi-select; Shift + drag to marquee select
  - With multiple nodes selected, press `E` to connect/disconnect them (first selected is the anchor)

3. **Navigation**
  - Hold Space + Left Click to pan the canvas
   - Use mouse wheel to zoom in/out
   - Click the Center button to focus on root node
   - Use View menu for zoom controls

4. **File Operations**
   - Use File menu or keyboard shortcuts for import/export
   - Save frequently used layouts as templates
   - Export your diagram as PNG for sharing

### Template Library

1. **Saving Templates**
   - Create your diagram layout
   - Click Library > Save to Library
   - Enter a name for your template

2. **Loading Templates**
   - Click Library > Load from Library
   - Select a template from the list
   - The template will replace current diagram

## Development

### Project Structure

```
react-mindmap-app/
├── src/
│   ├── App.jsx          # Main application component
│   ├── VertexCanvas.jsx  # Canvas rendering and interactions
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles
├── public/              # Static assets
└── package.json         # Project dependencies and scripts
```

### Key Components

- **App.jsx**: Main application logic, state management, and keyboard handlers
- **VertexCanvas.jsx**: Canvas rendering, pan/zoom, and node interactions
  - Mobile: pinch‑to‑zoom, long‑press context menu, high‑DPI scaling
- **MenuBar**: Application menu and toolbar functionality
- **HelpPanel**: Keyboard shortcuts and help documentation

## Testing

- Unit/UI (Vitest):
  - `npm test` – run all tests once
  - `npm run test:watch` – watch mode
  - `npm run test:coverage` – coverage report
  - `npm run test:ui` – Vitest UI

- Mobile E2E (Playwright):
  - Uses Playwright-downloaded browsers for fidelity (Chromium + WebKit).
  - One-time installs:
    - All: `npm run playwright:install:all`
    - Chromium only: `npm run playwright:install:chromium`
    - WebKit only (Mobile Safari engine): `npm run playwright:install:webkit`
  - `npm run test:e2e` – runs across configured mobile profiles (Chromium Pixel 5 + WebKit iPhone 12 + Mobile Firefox).
  - `npm run test:e2e:ui` – opens Playwright UI.
  - `npm run test:e2e:mobile` – runs Mobile Safari (WebKit) only.
  - `npm run test:e2e:ff` – runs Mobile Firefox profile.
  - Notes: tests live under `src/__tests__/e2e/`; Vite preview server auto-starts via `playwright.config.js` and prebuilds (`pretest:e2e`).

Configurable preview host/port:
- Change the preview server port/host that Playwright uses without editing files:
  - `PREVIEW_PORT=5174 npm run test:e2e`
  - `PREVIEW_HOST=0.0.0.0 PREVIEW_PORT=8080 npm run test:e2e`
- Reuse an already running preview server instead of starting one:
  - Terminal 1: `npm run build && npm run preview -- --host 127.0.0.1 --port 5174`
  - Terminal 2: `SKIP_WEB_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:5174 npm run test:e2e`

### Playwright install troubleshooting
- macOS 12 WebKit warning: Playwright ships a frozen WebKit for macOS 12; tests still run, but update macOS for latest engine.
- Proxy/localhost issues (ECONNREFUSED 127.0.0.1:443): clear proxy env vars when installing:
  - `env -u HTTPS_PROXY -u HTTP_PROXY -u ALL_PROXY npx playwright install`
- Alternate mirror (if your region blocks defaults):
  - `PLAYWRIGHT_DOWNLOAD_HOST=https://playwright.azureedge.net npx playwright install`
- CI caching: keep default `PLAYWRIGHT_BROWSERS_PATH=0` to install under project.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
5. **Tags**
   - Open Settings → Tags to manage available tags (add, rename, recolor, delete)
   - Import/Export your tag presets as JSON for reuse or sharing
   - In the Node Editor → Tags tab, toggle tags per node
