import { nodeInfoPlugin } from './core/nodeInfoPlugin.jsx';
import { edgeInfoPlugin } from './core/edgeInfoPlugin.jsx';
import { selectionToolsPlugin } from './core/selectionToolsPlugin.jsx';
import { clipboardPlugin } from './core/clipboardPlugin.jsx';
import { graphStatsPlugin } from './core/graphStatsPlugin.jsx';
import { neighborsHighlighterPlugin } from './core/neighborsHighlighterPlugin.jsx';
import { helpOverlayPlugin } from './core/helpOverlayPlugin.jsx';
import { randomNodeSelectorPlugin } from './core/randomNodeSelectorPlugin.jsx';
import { connectNodesByIdPlugin } from './core/connectNodesByIdPlugin.jsx';
import { levelsPlugin } from './core/levelsPlugin.jsx';
import { exportWatermarkPlugin } from './core/exportWatermarkPlugin.jsx';
import { versionHistoryPlugin } from './core/versionHistoryPlugin.jsx';
import { showcasePlugin } from './examples/showcasePlugin.jsx';
import { followUpRemindersPlugin } from './examples/followUpRemindersPlugin.jsx';

export const corePlugins = [
  nodeInfoPlugin,
  edgeInfoPlugin,
  graphStatsPlugin,
  helpOverlayPlugin,
  exportWatermarkPlugin,
  versionHistoryPlugin,
  selectionToolsPlugin,
  clipboardPlugin,
  neighborsHighlighterPlugin,
  randomNodeSelectorPlugin,
  connectNodesByIdPlugin,
  levelsPlugin,
  followUpRemindersPlugin,
  showcasePlugin,
];
