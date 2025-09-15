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

Vertex Lab supports simple plugins that contribute UI panels. Manage plugins via Settings → Plugins (enable/disable core plugins and import custom `.js/.mjs` plugins). The host error‑isolates plugin panels and dedupes plugins by id (first occurrence wins). See `doc/PLUGIN_SPEC.md` for the full specification. Migration notes are recorded in the Unreleased section of `CHANGELOG.md` and summarized in `doc/progress.md`.

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
- **MenuBar**: Application menu and toolbar functionality
- **HelpPanel**: Keyboard shortcuts and help documentation

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
