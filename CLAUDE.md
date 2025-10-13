# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vertex Lab is a React-based interactive diagramming tool with an HTML5 Canvas renderer, extensible plugin system, and optional Fastify backend. It features pan/zoom, multi-selection, undo/redo, keyboard shortcuts, internationalization (react-intl), themes, and mobile support with touch gestures.

## Commands

### Frontend Development

```bash
# Start development server (runs on http://localhost:5173)
npm run dev

# Access from other devices on same network
npm run dev -- --host

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

### Testing

```bash
# Run all unit tests (Vitest)
npm test

# Watch mode for unit tests
npm run test:watch

# Coverage report
npm run test:coverage

# Vitest UI
npm run test:ui

# E2E tests (Playwright) - auto-builds and starts preview server
npm run test:e2e

# Playwright UI mode
npm run test:e2e:ui

# Mobile-specific E2E tests
npm run test:e2e:mobile    # WebKit (Safari)
npm run test:e2e:ff        # Mobile Firefox

# Install Playwright browsers (one-time setup)
npm run playwright:install:all
npm run playwright:install:chromium
npm run playwright:install:webkit
```

**Test Structure:**
- Unit/integration tests: `src/**/*.{test,spec}.{js,jsx}` (excludes `e2e/`)
- E2E tests: `src/__tests__/e2e/`
- Test setup: `src/__tests__/setup.js`
- Vitest config: `vitest.config.js` (jsdom environment, globals enabled)
- Playwright config: `playwright.config.js` (mobile profiles, auto webServer)

### Backend Development

```bash
cd server

# Install dependencies (first time)
npm install

# Copy .env.example to .env and configure
cp .env.example .env

# Start backend (auto-starts postgres, runs on http://localhost:4000)
npm run dev

# Run backend tests
npm test

# Lint backend
npm run lint
```

**Backend Notes:**
- Fastify API with SQLite (default) or PostgreSQL support
- `npm run dev` runs `postgres:start` script (Homebrew-based Postgres 14)
- Configure via `DATABASE_URL` in `.env` for custom Postgres
- Data stored in `server/data/vertex.db` by default
- Frontend fallback to localStorage if backend unavailable
- See `doc/BACKEND_SETUP.md` for detailed setup

## Architecture

### Core Components

**App.jsx** (src/App.jsx)
- Main application component and state container
- Manages nodes, edges, selected/highlighted state, undo/redo stacks
- Integrates plugin system via `PluginHost`
- Keyboard shortcuts via `useKeyboardShortcuts` hook
- Handles context menu routing and plugin commands
- Key state: `nodes`, `edges`, `selectedNodeIds`, `highlightedNodeIds`, `undoStack`, `redoStack`

**VertexCanvas** (src/VertexCanvas.jsx)
- HTML5 Canvas-based rendering component (forwardRef with imperative API)
- Pan/zoom with mouse wheel, space+drag, pinch gestures
- Node hit testing for multiple shapes (circle, rectangle, diamond, hexagon, ellipse)
- High-DPI (devicePixelRatio) scaling for crisp rendering
- Marquee selection (Shift+drag), multi-select (Ctrl/Cmd+click)
- Exposed methods: `center()`, `zoom(factor)`, `fitToView()`, `resetZoom()`, `exportAsPNG()`, `focusOnNode(id)`, `setViewport(viewport)`
- Touch: long-press for context menu, pinch-to-zoom, iOS callout suppression

**Plugin System** (src/plugins/)
- `PluginHost.jsx`: Renders plugin panels, overlays, and error boundaries
- `registry.js`: `mergePlugins` utility (dedupes by id, first wins)
- `commands.js`: Collects plugin commands and filters by context (node/canvas)
- `index.js`: Exports `corePlugins` and `bundledCustomPlugins`
- Core plugins: `nodeInfoPlugin`, `edgeInfoPlugin`, `selectionToolsPlugin`, `clipboardPlugin`, `graphStatsPlugin`, `neighborsHighlighterPlugin`, `helpOverlayPlugin`, `randomNodeSelectorPlugin`, `connectNodesByIdPlugin`, `levelsPlugin`, `exportWatermarkPlugin`, `versionHistoryPlugin`
- Custom plugins: `showcasePlugin`, `followUpRemindersPlugin`, `gamificationPlugin`, `paperReferenceProspectorPlugin`

**Plugin Slots:**
- `sidePanels`: Right-side panels
- `canvasOverlays`: HUD/UI above canvas
- `commands`: Context menu actions (filtered by `when` predicate)
- `controlHub`: Per-plugin page with `aboutPage` (markdown support) and `configPage`

**Plugin API (passed to render/visible):**
- `nodes`, `edges`, `selectedNodeIds`, `selectedNodes`, `highlightedNodeIds`
- `onEditNode(id)`, `onDeleteNodes(ids)`, `onToggleCollapse(id)`
- `setHighlightedNodes(ids)` (non-destructive highlight)
- `showNodeInfoPanel`, `hideNodeInfoPanel()`
- `setPluginEnabled(id, enabled)`, `pluginPrefs`
- `overlayLayout`, `setOverlayLayout(patch)`, `resetOverlayLayout()`
- `isHelpVisible`, `toggleHelp()`, `isMobile`
- `plugin: { id, log(message, level), openHub() }` (scoped helpers)

### Key Utilities

**nodeUtils.js** (src/utils/)
- `createEnhancedNode`: Factory for nodes with enhanced properties (shape, color, fontSize, etc.)
- `upgradeNode`: Ensures backward compatibility with legacy nodes
- `getNodeDisplayText`, `getNodeBorderColor`, `getNodeTextColor`, `getThemeNodeColor`
- `NODE_SHAPES`: Circle, Rectangle, RoundedRectangle, Diamond, Hexagon, Ellipse
- `getVisibleNodes`: Filters nodes based on collapsed state

**layoutUtils.js**
- `organizeLayout`: Auto-layout algorithm (force-directed or hierarchical)
- `detectCollisions`: Collision detection and resolution

**edgeUtils.js**
- `addUndirectedEdge`, `edgesFromParentIds`

**shortcutUtils.js**
- `APP_SHORTCUTS`: Keyboard shortcut definitions (cross-platform Cmd/Ctrl)
- `formatShortcut`: Display formatting for shortcuts

**apiClient.js**
- `saveGraph`, `loadGraph`, `listGraphs`, `deleteGraph` (with offline fallback)

### State Management

- No Redux/MobX: App.jsx manages global state via React hooks
- Undo/redo: Managed via `undoStack`/`redoStack` with deep cloning
- Persistence: localStorage for frontend (`vertex_graph_<uuid>_*` keys), backend API for synced storage
- Plugin preferences: `loadPluginPrefs`/`savePluginPrefs` (localStorage)
- Theme: `ThemeContext.jsx` provider with multiple themes
- i18n: `react-intl` with locale files in `src/i18n/locales/` (en.json, zh-CN.json, es.json)

### Routing

Simple hash-based router:
- `/` - Landing page
- `#/g/:uuid` - Graph page with UUID
- `#/plugin/:id` - Plugin Control Hub page

### Data Model

**Node Schema:**
```javascript
{
  id: number | string,
  label: string,
  x: number, y: number,
  level: number,
  parentId: number | string | null,
  shape?: 'circle' | 'rectangle' | 'roundedRectangle' | 'diamond' | 'hexagon' | 'ellipse',
  color?: string,
  borderColor?: string,
  textColor?: string,
  fontSize?: number,
  fontWeight?: string,
  fontStyle?: string,
  tags?: string[],
  isCollapsed?: boolean,
  emoji?: string,
  notes?: string
}
```

**Edge Schema:**
```javascript
{
  id?: string,
  source: string | number,
  target: string | number,
  directed?: boolean
}
```

## Plugin Development

**Creating a Plugin:**

1. Create file in `src/plugins/custom/myPlugin.jsx`
2. Export plugin object with unique id (reverse-DNS style: `vendor.pluginName`)
3. Add to `src/plugins/index.js` (either `corePlugins` or `bundledCustomPlugins`)
4. Restart dev server

**Example Plugin:**
```javascript
export const myPlugin = {
  id: 'acme.myPlugin',
  name: 'My Plugin',
  description: 'Does something useful',
  version: '1.0.0',
  author: 'Your Name',
  slots: {
    sidePanels: [{
      id: 'myPanel',
      visible: (api) => api.selectedNodes.length > 0,
      render: (api) => (
        <div style={{ padding: 12 }}>
          Selected: {api.selectedNodes.length}
        </div>
      )
    }],
    commands: [{
      id: 'myCommand',
      title: 'Do Something',
      when: 'node', // or 'canvas' or (api, ctx) => boolean
      run: (api, ctx) => {
        console.log('Running on node', ctx.nodeId);
      }
    }]
  }
};
```

**Plugin Testing:**
```javascript
import { render, screen } from '@testing-library/react';
import { PluginHost } from '../../plugins/PluginHost.jsx';

it('renders my plugin panel', () => {
  const api = { nodes: [], selectedNodeIds: [] };
  render(<PluginHost plugins={[myPlugin]} appApi={api} />);
  expect(screen.getByText('My Panel')).toBeInTheDocument();
});
```

**Key Plugin Guidelines:**
- Plugins are error-isolated (ErrorBoundary wraps each panel)
- First occurrence wins on duplicate IDs (console warning emitted)
- Use `api.plugin.log(message, level)` for logging to Control Hub console
- Persist settings in localStorage under unique prefix
- See `doc/PLUGIN_SPEC.md` for complete specification
- Example plugins: `src/plugins/examples/helloPlugin.jsx`, `src/plugins/examples/showcasePlugin.jsx`

## Common Development Tasks

### Adding a New Node Shape

1. Add shape constant to `NODE_SHAPES` in `src/utils/nodeUtils.js`
2. Implement drawing logic in `drawNodeShape()` in `src/VertexCanvas.jsx`
3. Implement hit testing in `isPointInsideNode()` and `getNodePolygonPoints()`
4. Update Node Editor UI to expose shape selector

### Adding a Keyboard Shortcut

1. Define shortcut in `APP_SHORTCUTS` in `src/utils/shortcutUtils.js`
2. Add handler in `useKeyboardShortcuts` hook in `src/hooks/useKeyboardShortcuts.js`
3. Update help documentation in `HelpModal.jsx`
4. Use `event.code` for layout-agnostic keys, `event.key` for symbols

### Adding a Translation String

1. Add key to all locale files in `src/i18n/locales/` (en.json, zh-CN.json, es.json)
2. Use `<FormattedMessage id="your.key" />` in JSX
3. Use `intl.formatMessage({ id: 'your.key' })` in JavaScript

### Canvas Coordinate Systems

- **Screen space:** clientX/clientY from mouse events
- **Canvas CSS space:** After subtracting rect.left/rect.top
- **World space:** After applying inverse transform: `(canvasX - offsetX) / scale`
- View state stored in `view.current`: `{ offsetX, offsetY, scale }`

### Working with Undo/Redo

- Undo stack stores `{ nodes, edges }` snapshots
- Call `saveToUndoStack()` before mutations
- Max stack depth: 50 entries
- Deep clone required to prevent reference mutations

## Mobile Considerations

- Canvas uses `touchAction: 'none'` to prevent scroll interference
- Pinch-to-zoom implemented via PointerEvent API
- Long-press (500ms) triggers context menu
- High-DPI scaling with `window.devicePixelRatio`
- iOS callout suppression via CSS (`-webkit-touch-callout: none`)
- Safe-area insets for notches: `env(safe-area-inset-*)`
- Touch-friendly hit targets: minimum 44px (following iOS HIG)

## Backend Integration

**Frontend Config:**
- Set `VITE_API_BASE_URL` in `.env` (default: http://localhost:4000)
- Runtime override: `window.__VERTEX_CONFIG__ = { apiBaseUrl: '...' }` in `public/runtime-config.js`

**API Endpoints:**
- `POST /api/graphs` - Create/update graph
- `GET /api/graphs/:id` - Load graph
- `GET /api/graphs` - List all graphs
- `DELETE /api/graphs/:id` - Delete graph

**Offline Behavior:**
- Frontend detects failed API calls and falls back to localStorage
- "Unsynced" badge shown for graphs pending upload
- Auto-retry sync when connection restored

## Important Files

- `src/App.jsx` - Main app state and logic
- `src/VertexCanvas.jsx` - Canvas renderer and interactions
- `src/plugins/PluginHost.jsx` - Plugin rendering system
- `src/plugins/index.js` - Plugin registry
- `src/utils/nodeUtils.js` - Node operations and shapes
- `src/utils/layoutUtils.js` - Auto-layout algorithms
- `src/utils/shortcutUtils.js` - Keyboard shortcuts
- `src/hooks/useKeyboardShortcuts.js` - Shortcut handler
- `doc/PLUGIN_SPEC.md` - Complete plugin API documentation
- `doc/BACKEND_SETUP.md` - Backend setup guide
- `doc/DEV_SERVER.md` - LAN access guide
- `CHANGELOG.md` - Detailed change history

## Testing Strategies

### Unit Testing Components

**Testing Canvas Components:**
- Mock canvas context methods in test setup (`src/__tests__/setup.js`)
- Use `getBoundingClientRect` mock for coordinate calculations
- Wrap components in `ThemeProvider` for context access
- Example: `VertexCanvas.test.jsx` demonstrates canvas mocking patterns

```javascript
import { render } from '@testing-library/react';
import { ThemeProvider } from '../../contexts/ThemeContext';

const renderWithTheme = (ui) => render(<ThemeProvider>{ui}</ThemeProvider>);

it('renders canvas', () => {
  const { container } = renderWithTheme(<VertexCanvas nodes={[]} />);
  expect(container.querySelector('canvas')).toBeInTheDocument();
});
```

**Testing Plugins:**
- Use `PluginHost` with minimal `appApi` mock
- Test visibility predicates independently
- Verify error boundaries don't crash on plugin errors
- Example: `PluginHost.test.jsx`, `PluginHostErrorBoundary.test.jsx`

**Testing Hooks:**
- Test `useKeyboardShortcuts` with simulated keyboard events
- Mock `event.code` and `event.key` for layout-agnostic tests
- Verify modifier keys (Ctrl/Cmd/Alt/Shift) correctly
- Example: `useKeyboardShortcuts.test.js`

**Testing Mobile Interactions:**
- Use `PointerEvent` polyfill from setup file
- Test touch events with `pointerType: 'touch'`
- Use `vi.useFakeTimers()` for long-press timing
- Example: `VertexCanvas.mobile.test.jsx`

### E2E Testing (Playwright)

**Running E2E Tests:**
- Build happens automatically via `pretest:e2e` script
- Tests run against Vite preview server (prod-like build)
- Mobile profiles: Chromium (Pixel 5), WebKit (iPhone), Firefox
- Use `npm run test:e2e:ui` for debugging

**Custom Preview Server:**
```bash
# Change port/host
PREVIEW_PORT=5174 npm run test:e2e

# Reuse existing server (skip auto-start)
npm run build && npm run preview -- --host 127.0.0.1 --port 5174
SKIP_WEB_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:5174 npm run test:e2e
```

**Mobile E2E Patterns:**
- Use `page.waitForSelector()` to wait for canvas/controls
- Test pinch-to-zoom with `touchscreen.tap()`
- Verify safe-area-inset CSS applies correctly
- Example: `src/__tests__/e2e/mobile.spec.js`

### Test Coverage

- Run `npm run test:coverage` for HTML report in `coverage/`
- Coverage thresholds not enforced but aim for >70% on critical paths
- Canvas rendering logic has limited coverage (mostly integration tests)
- Focus coverage on: state management, utilities, plugin system

## Troubleshooting

### Playwright Installation Issues

**macOS WebKit Warning:**
- Playwright frozen WebKit build requires macOS 13+
- Tests run on macOS 12 but update OS for latest engine
- Skip WebKit: `npm run playwright:install:chromium`

**Proxy/Localhost ECONNREFUSED:**
```bash
# Clear proxy environment variables
env -u HTTPS_PROXY -u HTTP_PROXY -u ALL_PROXY npx playwright install
```

**Alternate Mirror (regional blocks):**
```bash
npm run playwright:install:mirror
# or manually:
PLAYWRIGHT_DOWNLOAD_HOST=https://playwright.azureedge.net npx playwright install
```

**CI Caching:**
- Keep `PLAYWRIGHT_BROWSERS_PATH=0` (default) to install under project
- Cache `node_modules/.cache/playwright` for faster CI builds

### Canvas/Testing Issues

**Canvas Not Rendering in Tests:**
- Ensure `src/__tests__/setup.js` imported by Vitest
- Check `HTMLCanvasElement.prototype` mocks are defined
- Use `vi.clearAllMocks()` in `beforeEach` to reset state

**devicePixelRatio Tests Failing:**
```javascript
// Save and restore window.devicePixelRatio
const prev = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio');
Object.defineProperty(window, 'devicePixelRatio', { value: 2, configurable: true });
// ... test code ...
if (prev) Object.defineProperty(window, 'devicePixelRatio', prev);
```

**PointerEvent Not Defined:**
- Polyfill provided in `setup.js` for jsdom
- Use `new PointerEvent('pointerdown', { pointerType: 'touch', pointerId: 1 })`

### Backend/CORS Issues

**Backend Not Starting:**
- Check Postgres service: `brew services list`
- Verify port 4000 available: `lsof -ti:4000`
- Check logs in `server/.env` (set `LOG_LEVEL=debug`)

**CORS Errors:**
- Backend uses `@fastify/cors` with `origin: true` (allows all in dev)
- For production, set `CORS_ORIGIN` in `server/.env`
- Frontend `VITE_API_BASE_URL` must match backend host

**Database Migrations:**
- SQLite: Delete `server/data/vertex.db` to reset
- Postgres: Drop and recreate database for clean slate

### Plugin Issues

**Plugin Not Loading:**
- Check console for duplicate ID warnings
- Verify plugin exported as default or named export
- Ensure `id` follows reverse-DNS format
- Check plugin added to `corePlugins` or `bundledCustomPlugins` in `index.js`

**Plugin Crashes App:**
- Plugins wrapped in ErrorBoundary but still debug
- Check Control Hub console for plugin logs
- Use `api.plugin.log(message, 'error')` for debugging

**Custom Plugin Import Fails:**
- File must be `.js` or `.mjs` with valid ES module syntax
- Plugin validation rejects: missing id/slots, slots as array, invalid slot structure
- Check browser console for validation errors

## Deployment

### Frontend (Static Hosting)

**Netlify (configured via `netlify.toml`):**
```bash
# Build command
npm run build

# Publish directory
dist/

# Environment variables (set in Netlify UI)
# VITE_API_BASE_URL - Optional, for backend integration
```

**Other Static Hosts (Vercel, Cloudflare Pages, GitHub Pages):**
- Build command: `npm run build`
- Output directory: `dist`
- SPA fallback: Configure redirects to `index.html` for client-side routing
  - Netlify: `_redirects` file with `/* /index.html 200`
  - Vercel: `vercel.json` with rewrites
  - GitHub Pages: Add `404.html` copy of `index.html`

**Runtime Configuration:**
- Edit `dist/runtime-config.js` after build to change API URL without rebuild
- Use `window.__VERTEX_CONFIG__ = { apiBaseUrl: 'https://api.example.com' }`

### Backend (Fastify API)

**Production Deployment:**
```bash
cd server
npm install --production
npm start  # Uses node src/index.js
```

**Environment Variables:**
```bash
PORT=4000
DATABASE_URL=postgres://user:pass@host:5432/db
DATABASE_SSL=true  # Enable for managed Postgres (RDS, Render, Supabase)
CORS_ORIGIN=https://vertex-lab.example.com
LOG_LEVEL=info
```

**Recommended Hosts:**
- **Railway/Render:** Auto-deploy from Git, managed Postgres available
- **Fly.io:** Dockerfile deployment, Postgres add-on
- **AWS ECS/Lambda:** Containerized or serverless via adapter
- **Heroku:** Procfile: `web: node server/src/index.js`

**Database Setup:**
- Use managed Postgres for production (avoid SQLite)
- Connection pooling recommended for high traffic
- Backup strategy: pg_dump daily or use provider backups

**Health Check Endpoint:**
- Add `GET /health` route returning `{ status: 'ok' }`
- Use for load balancer health checks

### Docker Deployment

**Frontend Dockerfile:**
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Backend Dockerfile:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --production
COPY server/ .
EXPOSE 4000
CMD ["node", "src/index.js"]
```

**Docker Compose:**
```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "80:80"
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgres://user:pass@db:5432/vertex
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: vertex
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

### Performance Optimization

**Frontend:**
- Vite auto-chunks code by route
- Lazy-load plugins: Use dynamic imports for bundled custom plugins
- Enable gzip/brotli in CDN/reverse proxy
- Set cache headers: `Cache-Control: max-age=31536000` for `/assets/*`

**Backend:**
- Enable Fastify clustering for multi-core
- Add Redis for session storage if implementing auth
- Use Postgres connection pooling (pg `max: 20`)
- Monitor with Pino logs + aggregator (Datadog, Logtail)

## Notes

- React 19 with Vite 7
- ESLint flat config (`eslint.config.js`)
- Main branch for PRs (check git status for current branch)
- Vitest uses jsdom environment with globals enabled
- Playwright tests require `npm run build` first (automated via pretest:e2e)
- Canvas is redrawn on custom 'redraw' event dispatched to canvas element
