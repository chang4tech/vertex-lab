import { nodeInfoPlugin } from './core/nodeInfoPlugin.jsx';
import { selectionToolsPlugin } from './core/selectionToolsPlugin.jsx';
import { clipboardPlugin } from './core/clipboardPlugin.jsx';
import { graphStatsPlugin } from './core/graphStatsPlugin.jsx';
import { neighborsHighlighterPlugin } from './core/neighborsHighlighterPlugin.jsx';
import { helpOverlayPlugin } from './core/helpOverlayPlugin.jsx';
import { randomNodeSelectorPlugin } from './core/randomNodeSelectorPlugin.jsx';
import { connectNodesByIdPlugin } from './core/connectNodesByIdPlugin.jsx';
import { levelsPlugin } from './core/levelsPlugin.jsx';
import { showcasePlugin } from './examples/showcasePlugin.jsx';

export const corePlugins = [
  nodeInfoPlugin,
  graphStatsPlugin,
  helpOverlayPlugin,
  selectionToolsPlugin,
  clipboardPlugin,
  neighborsHighlighterPlugin,
  randomNodeSelectorPlugin,
  connectNodesByIdPlugin,
  levelsPlugin,
  showcasePlugin,
];
