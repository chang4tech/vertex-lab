# Vertex Lab
 
A powerful and intuitive diagramming tool built with React and HTML5 Canvas. Create, organize, and visualize your thoughts with an interactive and user-friendly interface.

## Features

- 🎯 **Intuitive Node Management**
  - Create child, sibling, and parent nodes
  - Drag and drop nodes to reposition
  - Quick node editing and deletion
  - Multi-node selection

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

- ⌨️ **Keyboard Shortcuts**
  - `Tab`: Insert child node
  - `Enter`: Insert sibling node after
  - `Shift + Enter`: Insert sibling node before
  - `Ctrl/Cmd + Enter`: Insert parent node
  - `Ctrl/Cmd + ←↑↓→`: Multi-node selection
  - `Shift + ←↑↓→`: Move node
  - `Ctrl/Cmd + E`: Expand/collapse node
  - `Space + Left Click`: Pan canvas
  - `Ctrl/Cmd + O`: Import JSON
  - `Ctrl/Cmd + S`: Export JSON
  - `Ctrl/Cmd + Shift + S`: Export PNG
  - `Ctrl/Cmd + Z`: Undo
  - `Ctrl/Cmd + Shift + Z`: Redo
  - `Delete/Backspace`: Delete selected node

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
   - Click a node and press `Tab` to create a child node
   - Press `Enter` to create a sibling node after
   - Press `Shift + Enter` to create a sibling before
   - Press `Ctrl/Cmd + Enter` to create a parent node

2. **Editing Nodes**
   - Click a node to select it
   - Press `Enter` to edit the selected node's text
   - Drag nodes to reposition them
   - Use arrow keys with Shift to move nodes

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
vertex-lab-app/
├── src/
│   ├── App.jsx          # Main application component
│   ├── MindMapCanvas.jsx # Canvas rendering and interactions
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles
├── public/              # Static assets
└── package.json         # Project dependencies and scripts
```

### Key Components

- **App.jsx**: Main application logic, state management, and keyboard handlers
- **MindMapCanvas.jsx**: Canvas rendering, pan/zoom, and node interactions
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
