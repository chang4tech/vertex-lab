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
import { searchCommandPlugin } from './core/searchCommandPlugin.jsx';
import { templatesPlugin } from './core/templatesPlugin.jsx';
import { workspacePlugin } from './core/workspacePlugin.jsx';
import { schemaManagerPlugin } from './core/schemaManagerPlugin.jsx';
import { showcasePlugin } from './examples/showcasePlugin.jsx';
import { followUpRemindersPlugin } from './examples/followUpRemindersPlugin.jsx';
import { gamificationPlugin } from './examples/gamificationPlugin.jsx';
import { paperReferenceProspectorPlugin } from './examples/paperReferenceProspectorPlugin.jsx';
import { searchPrefixProviderPlugin } from './examples/searchPrefixProviderPlugin.jsx';
import { searchDSLProviderPlugin } from './examples/searchDSLProviderPlugin.jsx';
import { graphLinterPlugin } from './examples/graphLinterPlugin.jsx';
import { centralityLensPlugin } from './examples/centralityLensPlugin.jsx';
import { nodeEditorExamplePlugin } from './examples/nodeEditorExamplePlugin.jsx';

export const corePlugins = [
  nodeInfoPlugin,
  edgeInfoPlugin,
  graphStatsPlugin,
  helpOverlayPlugin,
  schemaManagerPlugin,
  workspacePlugin,
  templatesPlugin,
  exportWatermarkPlugin,
  versionHistoryPlugin,
  searchCommandPlugin,
  selectionToolsPlugin,
  clipboardPlugin,
  neighborsHighlighterPlugin,
  randomNodeSelectorPlugin,
  connectNodesByIdPlugin,
  levelsPlugin,
  followUpRemindersPlugin,
  showcasePlugin,
];

export const bundledCustomPlugins = [
  gamificationPlugin,
  paperReferenceProspectorPlugin,
  searchPrefixProviderPlugin,
  searchDSLProviderPlugin,
  graphLinterPlugin,
  centralityLensPlugin,
  nodeEditorExamplePlugin,
];
