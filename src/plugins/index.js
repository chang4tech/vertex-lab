import { nodeInfoPlugin } from './core/nodeInfoPlugin.jsx';
import { selectionToolsPlugin } from './core/selectionToolsPlugin.jsx';
import { clipboardPlugin } from './core/clipboardPlugin.jsx';
import { graphStatsPlugin } from './core/graphStatsPlugin.jsx';
import { neighborsHighlighterPlugin } from './core/neighborsHighlighterPlugin.jsx';
import { showcasePlugin } from './examples/showcasePlugin.jsx';

export const corePlugins = [
  nodeInfoPlugin,
  graphStatsPlugin,
  selectionToolsPlugin,
  clipboardPlugin,
  neighborsHighlighterPlugin,
  showcasePlugin,
];
