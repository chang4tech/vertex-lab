*** MOVED: This file was moved from the repository root (CODEBUDDY.md) ***

# Vertex Lab

This is a powerful and intuitive diagramming tool built with React and HTML5 Canvas. The application allows users to create, organize, and visualize thoughts with an interactive interface featuring drag-and-drop nodes, pan/zoom controls, and comprehensive keyboard shortcuts.

## Development Commands

### Basic Commands
- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production 
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Testing
- `npm run test` - Run tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run test:ui` - Open Vitest UI for interactive testing

## Architecture Overview

### Core Components Structure

The application follows a modular React architecture with clear separation of concerns:

**Main Application Layer (`src/App.jsx`)**
- Central state management for nodes, undo/redo stacks, and UI state
- Keyboard shortcut handling and event coordination
- Menu system integration and file operations
- Internationalization (i18n) support with react-intl

**Canvas Rendering Layer (`src/VertexCanvas.jsx`)**
- HTML5 Canvas-based rendering with imperative ref API
- Pan/zoom functionality with smooth interactions
- Node positioning, selection, and drag operations
- Edge rendering between parent-child nodes

**Component Architecture (`src/components/`)**
- `panels/` - UI panels (Minimap, Help, etc.)
- `menu/` - Menu system components
- `canvas/` - Canvas-specific utilities
- Modular component design for reusability

**Custom Hooks (`src/hooks/`)**
- `useCanvasOperations.js` - Canvas interaction logic
- `useKeyboardShortcuts.js` - Centralized keyboard handling

**Utilities (`src/utils/`)**
- `fileOperations.js` - Import/export functionality (JSON, PNG)
- `shortcutUtils.js` - Keyboard shortcut utilities

### State Management

The application uses React's built-in state management with:
- **Nodes Array**: Core data structure containing `{ id, label, x, y, parentId }`
- **Undo/Redo Stacks**: History management for all node operations
- **UI State**: Selected nodes, canvas view state, panel visibility
- **Local Storage**: Automatic persistence and template library system

### Key Features Implementation

**Multi-Modal Interaction**
- Mouse: Click selection, drag positioning, pan (Space+click), zoom (wheel)
- Keyboard: Comprehensive shortcuts for node creation, navigation, and operations
- Touch: Basic touch support for mobile devices

**File System Integration**
- JSON import/export for data persistence
- PNG export with canvas-to-image conversion
- Template library with localStorage backend
- Drag-and-drop file import support

**Internationalization**
- React-intl integration for multi-language support
- Locale switching with persistent user preference
- Formatted messages throughout the UI

## Testing Setup

- **Framework**: Vitest with React Testing Library
- **Environment**: jsdom for DOM simulation
- **Coverage**: v8 provider with HTML/text reporting
- **Test Location**: `src/**/*.{test,spec}.{js,jsx}`
- **Setup**: `src/__tests__/setup.js` for global test configuration

## Build Configuration

- **Bundler**: Vite for fast development and optimized builds
- **React Plugin**: @vitejs/plugin-react for JSX transformation
- **Linting**: ESLint with React hooks and refresh plugins
- **Output**: Static files in `dist/` directory

## Development Patterns

**Component Design**
- Functional components with hooks
- PropTypes for runtime type checking
- Ref forwarding for imperative canvas operations
- Controlled components with lifting state up

**Event Handling**
- Centralized keyboard shortcuts in App.jsx
- Canvas events handled in VertexCanvas with callbacks
- Menu interactions with dropdown state management
- File operations with hidden input elements

**Performance Considerations**
- Canvas rendering optimizations with selective redraws
- Debounced operations for smooth interactions
- Efficient node lookup with ID-based indexing
- Minimal re-renders through proper dependency arrays

