*** MOVED: This file was moved from the repository root (GEMINI.md) ***

# Vertex Lab

This is a powerful and intuitive diagramming tool built with React and HTML5 Canvas. The application allows users to create, organize, and visualize thoughts with an interactive interface featuring drag-and-drop nodes, pan/zoom controls, and comprehensive keyboard shortcuts.

## ✨ Core Features

- **Interactive Canvas**: Smooth pan, zoom, and node dragging.
- **Node Management**: Create, edit, delete, and connect nodes.
- **Undo/Redo**: Full history of all actions.
- **File Operations**: Import/export to JSON and PNG.
- **Local Storage**: Auto-saves your work.
- **Keyboard Shortcuts**: Extensive shortcuts for all major actions.
- **Internationalization**: Support for English and Chinese.

## 🚀 Recently Added Features

### 🎨 **Visual Themes**
- **5 Beautiful Themes**: Instantly switch between themes (View → Choose Theme).
- **Persistence**: Your chosen theme is saved to local storage.
- **Live Previews**: See a preview of each theme before applying.

### 🔍 **Fuzzy Search**
- **Quick Find**: Instantly find nodes with fuzzy search (Edit → Search, Cmd+F).
- **Highlighting**: Search results are highlighted on the canvas.
- **Search History**: Access your recent searches.

### 🗺️ **Navigation**
- **Minimap**: Get a high-level overview of your diagram (View → Minimap).
- **Auto-Layout**: Automatically arrange your nodes in a force-directed layout (Edit → Auto Layout, Cmd+L).

### 💾 **Data Management**
- **Template Library**: Save and load your own templates (Library → Save/Load).
- **Drag and Drop**: Import JSON files by dragging them onto the canvas.

### ℹ️ **Node Info Panel**
- **Detailed Metadata**: View detailed information for selected nodes.
- **Multi-Selection Analysis**: Get insights and statistics for multiple nodes.
- **Toggle Visibility**: Show or hide the panel with `Cmd/Ctrl + I`.

## 📋 Usage Instructions

### Basic Controls
- **Create Node**: Double-click on the canvas.
- **Create Child Node**: Press `Tab` with a node selected.
- **Edit Node**: Double-click a node or press `F2`.
- **Delete Node**: Select a node and press `Delete` or `Backspace`.
- **Pan**: Hold `Space` and drag the canvas.
- **Zoom**: Use the mouse wheel.

### Keyboard Shortcuts
- **`Cmd/Ctrl + Z`**: Undo
- **`Cmd/Ctrl + Y`**: Redo
- **`Cmd/Ctrl + S`**: Save to local storage (auto-saves by default)
- **`Cmd/Ctrl + O`**: Open/Import JSON
- **`Cmd/Ctrl + E`**: Export to JSON
- **`Cmd/Ctrl + P`**: Export to PNG
- **`Cmd/Ctrl + F`**: Open search
- **`Cmd/Ctrl + L`**: Auto-layout nodes

For a full list of shortcuts, see **Settings → Keyboard Shortcuts**.

## 🛠️ Development

### Running Locally
1. `npm install`
2. `npm run dev`

### Running Tests
- `npm run test` - Run all tests.
- `npm run test:watch` - Run tests in watch mode.

## 📝 Future Enhancements

- **Node Enhancements**: Add support for tags, colors, icons, and rich text.
- **Performance Optimization**: Implement virtualization for large diagrams.
- **Collaboration**: Add real-time collaboration features.
- **Advanced Export**: Export to more formats like Markdown and FreeMind.

See `doc/TODO.md` for a detailed list of planned features.

