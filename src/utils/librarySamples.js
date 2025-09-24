import { createEnhancedNode, NODE_COLORS, NODE_ICONS } from './nodeUtils';

const finalizeSample = (nodes, edges) => ({
  nodes: nodes.map(node => ({ ...node })),
  edges: edges.map(edge => ({ ...edge })),
});

const buildCognitivePsychologySample = () => {
  const nodes = [
    createEnhancedNode({ id: 1, label: 'Cognitive Psychology', x: 0, y: 0, level: 0, color: NODE_COLORS.INDIGO, icon: NODE_ICONS.BOOK }),
    createEnhancedNode({ id: 2, label: 'Memory Systems', x: -260, y: -140, level: 1, parentId: 1, color: NODE_COLORS.BLUE }),
    createEnhancedNode({ id: 3, label: 'Perception', x: 260, y: -140, level: 1, parentId: 1, color: NODE_COLORS.GREEN }),
    createEnhancedNode({ id: 4, label: 'Attention', x: -260, y: 140, level: 1, parentId: 1, color: NODE_COLORS.YELLOW }),
    createEnhancedNode({ id: 5, label: 'Language', x: 260, y: 140, level: 1, parentId: 1, color: NODE_COLORS.ORANGE }),
    createEnhancedNode({ id: 6, label: 'Problem Solving', x: 0, y: 240, level: 1, parentId: 1, color: NODE_COLORS.PURPLE }),
    createEnhancedNode({ id: 7, label: 'Research Methods', x: 0, y: -220, level: 1, parentId: 1, color: NODE_COLORS.TEAL }),
    createEnhancedNode({ id: 8, label: 'Short-term Memory', x: -420, y: -200, level: 2, parentId: 2 }),
    createEnhancedNode({ id: 9, label: 'Long-term Memory', x: -420, y: -80, level: 2, parentId: 2 }),
    createEnhancedNode({ id: 10, label: 'Working Memory', x: -320, y: -260, level: 2, parentId: 2 }),
    createEnhancedNode({ id: 11, label: 'Visual Processing', x: 420, y: -180, level: 2, parentId: 3 }),
    createEnhancedNode({ id: 12, label: 'Pattern Recognition', x: 420, y: -60, level: 2, parentId: 3 }),
    createEnhancedNode({ id: 13, label: 'Selective Attention', x: -420, y: 60, level: 2, parentId: 4 }),
    createEnhancedNode({ id: 14, label: 'Divided Attention', x: -420, y: 220, level: 2, parentId: 4 }),
    createEnhancedNode({ id: 15, label: 'Language Comprehension', x: 420, y: 80, level: 2, parentId: 5 }),
    createEnhancedNode({ id: 16, label: 'Language Production', x: 420, y: 220, level: 2, parentId: 5 }),
    createEnhancedNode({ id: 17, label: 'Heuristics & Biases', x: 0, y: 360, level: 2, parentId: 6 }),
    createEnhancedNode({ id: 18, label: 'Creative Thinking', x: 140, y: 320, level: 2, parentId: 6 }),
    createEnhancedNode({ id: 19, label: 'Experimental Design', x: -120, y: -320, level: 2, parentId: 7 }),
    createEnhancedNode({ id: 20, label: 'Neuroimaging', x: 120, y: -320, level: 2, parentId: 7 }),
  ];

  const edges = [
    { source: 1, target: 2, directed: false },
    { source: 1, target: 3, directed: false },
    { source: 1, target: 4, directed: false },
    { source: 1, target: 5, directed: false },
    { source: 1, target: 6, directed: false },
    { source: 1, target: 7, directed: false },
    { source: 2, target: 8, directed: false },
    { source: 2, target: 9, directed: false },
    { source: 2, target: 10, directed: false },
    { source: 3, target: 11, directed: false },
    { source: 3, target: 12, directed: false },
    { source: 4, target: 13, directed: false },
    { source: 4, target: 14, directed: false },
    { source: 5, target: 15, directed: false },
    { source: 5, target: 16, directed: false },
    { source: 6, target: 17, directed: false },
    { source: 6, target: 18, directed: false },
    { source: 7, target: 19, directed: false },
    { source: 7, target: 20, directed: false },
    { source: 2, target: 5, directed: false },
    { source: 3, target: 4, directed: false },
  ];

  return finalizeSample(nodes, edges);
};

const buildStructuredContactSample = () => {
  const nodes = [
    createEnhancedNode({ id: 1, label: 'Structured Contact Program', x: 0, y: 0, level: 0, color: NODE_COLORS.GREEN, icon: NODE_ICONS.GEAR }),
    createEnhancedNode({ id: 2, label: 'Participants', x: -260, y: -140, level: 1, parentId: 1, color: NODE_COLORS.BLUE }),
    createEnhancedNode({ id: 3, label: 'Preparation', x: 260, y: -140, level: 1, parentId: 1, color: NODE_COLORS.TEAL }),
    createEnhancedNode({ id: 4, label: 'Facilitated Interaction', x: -260, y: 140, level: 1, parentId: 1, color: NODE_COLORS.ORANGE }),
    createEnhancedNode({ id: 5, label: 'Shared Projects', x: 260, y: 140, level: 1, parentId: 1, color: NODE_COLORS.PURPLE }),
    createEnhancedNode({ id: 6, label: 'Reflection & Follow-up', x: 0, y: 260, level: 1, parentId: 1, color: NODE_COLORS.YELLOW }),
    createEnhancedNode({ id: 7, label: 'Balanced Representation', x: -420, y: -200, level: 2, parentId: 2 }),
    createEnhancedNode({ id: 8, label: 'Shared Code of Conduct', x: -420, y: -80, level: 2, parentId: 2 }),
    createEnhancedNode({ id: 9, label: 'Orientation Session', x: 420, y: -200, level: 2, parentId: 3 }),
    createEnhancedNode({ id: 10, label: 'Perspective Taking Exercises', x: 420, y: -80, level: 2, parentId: 3 }),
    createEnhancedNode({ id: 11, label: 'Guided Dialogue', x: -420, y: 80, level: 2, parentId: 4 }),
    createEnhancedNode({ id: 12, label: 'Rotating Roles', x: -420, y: 220, level: 2, parentId: 4 }),
    createEnhancedNode({ id: 13, label: 'Collaborative Goals', x: 420, y: 80, level: 2, parentId: 5 }),
    createEnhancedNode({ id: 14, label: 'Problem-solving Tasks', x: 420, y: 220, level: 2, parentId: 5 }),
    createEnhancedNode({ id: 15, label: 'Joint Reflection', x: 0, y: 360, level: 2, parentId: 6 }),
    createEnhancedNode({ id: 16, label: 'Long-term Partnerships', x: 140, y: 320, level: 2, parentId: 6 }),
    createEnhancedNode({ id: 17, label: 'Community Showcase', x: -140, y: 320, level: 2, parentId: 6 }),
  ];

  const edges = [
    { source: 1, target: 2, directed: false },
    { source: 1, target: 3, directed: false },
    { source: 1, target: 4, directed: false },
    { source: 1, target: 5, directed: false },
    { source: 1, target: 6, directed: false },
    { source: 2, target: 7, directed: false },
    { source: 2, target: 8, directed: false },
    { source: 3, target: 9, directed: false },
    { source: 3, target: 10, directed: false },
    { source: 4, target: 11, directed: false },
    { source: 4, target: 12, directed: false },
    { source: 5, target: 13, directed: false },
    { source: 5, target: 14, directed: false },
    { source: 6, target: 15, directed: false },
    { source: 6, target: 16, directed: false },
    { source: 6, target: 17, directed: false },
    { source: 2, target: 3, directed: false },
    { source: 4, target: 5, directed: false },
  ];

  return finalizeSample(nodes, edges);
};

const buildNarniaSample = () => {
  const nodes = [
    createEnhancedNode({ id: 1, label: 'The Chronicles of Narnia', x: 0, y: 0, level: 0, color: NODE_COLORS.BROWN, icon: NODE_ICONS.BOOK }),
    createEnhancedNode({ id: 2, label: 'Pevense Children', x: -260, y: -140, level: 1, parentId: 1, color: NODE_COLORS.PINK }),
    createEnhancedNode({ id: 3, label: 'Key Themes', x: 260, y: -140, level: 1, parentId: 1, color: NODE_COLORS.GREEN }),
    createEnhancedNode({ id: 4, label: 'Books', x: -260, y: 140, level: 1, parentId: 1, color: NODE_COLORS.BLUE }),
    createEnhancedNode({ id: 5, label: 'Allies & Mentors', x: 260, y: 140, level: 1, parentId: 1, color: NODE_COLORS.TEAL }),
    createEnhancedNode({ id: 6, label: 'Antagonists', x: 0, y: 260, level: 1, parentId: 1, color: NODE_COLORS.RED }),
    createEnhancedNode({ id: 7, label: 'Peter', x: -420, y: -220, level: 2, parentId: 2 }),
    createEnhancedNode({ id: 8, label: 'Susan', x: -420, y: -100, level: 2, parentId: 2 }),
    createEnhancedNode({ id: 9, label: 'Edmund', x: -420, y: 20, level: 2, parentId: 2 }),
    createEnhancedNode({ id: 10, label: 'Lucy', x: -420, y: 140, level: 2, parentId: 2 }),
    createEnhancedNode({ id: 11, label: 'Faith & Spirituality', x: 420, y: -220, level: 2, parentId: 3 }),
    createEnhancedNode({ id: 12, label: 'Courage & Sacrifice', x: 420, y: -100, level: 2, parentId: 3 }),
    createEnhancedNode({ id: 13, label: 'Moral Choice', x: 420, y: 20, level: 2, parentId: 3 }),
    createEnhancedNode({ id: 14, label: 'The Lion, the Witch and the Wardrobe', x: -420, y: 220, level: 2, parentId: 4 }),
    createEnhancedNode({ id: 15, label: 'Prince Caspian', x: -420, y: 340, level: 2, parentId: 4 }),
    createEnhancedNode({ id: 16, label: 'The Voyage of the Dawn Treader', x: -260, y: 360, level: 2, parentId: 4 }),
    createEnhancedNode({ id: 17, label: 'Aslan', x: 420, y: 220, level: 2, parentId: 5, icon: NODE_ICONS.STAR }),
    createEnhancedNode({ id: 18, label: 'Mr. Tumnus', x: 420, y: 340, level: 2, parentId: 5 }),
    createEnhancedNode({ id: 19, label: 'Professor Kirke', x: 260, y: 360, level: 2, parentId: 5 }),
    createEnhancedNode({ id: 20, label: 'White Witch', x: 0, y: 360, level: 2, parentId: 6 }),
    createEnhancedNode({ id: 21, label: 'Telmarines', x: -120, y: 320, level: 2, parentId: 6 }),
    createEnhancedNode({ id: 22, label: 'Calormenes', x: 120, y: 320, level: 2, parentId: 6 }),
  ];

  const edges = [
    { source: 1, target: 2, directed: false },
    { source: 1, target: 3, directed: false },
    { source: 1, target: 4, directed: false },
    { source: 1, target: 5, directed: false },
    { source: 1, target: 6, directed: false },
    { source: 2, target: 7, directed: false },
    { source: 2, target: 8, directed: false },
    { source: 2, target: 9, directed: false },
    { source: 2, target: 10, directed: false },
    { source: 3, target: 11, directed: false },
    { source: 3, target: 12, directed: false },
    { source: 3, target: 13, directed: false },
    { source: 4, target: 14, directed: false },
    { source: 4, target: 15, directed: false },
    { source: 4, target: 16, directed: false },
    { source: 5, target: 17, directed: false },
    { source: 5, target: 18, directed: false },
    { source: 5, target: 19, directed: false },
    { source: 6, target: 20, directed: false },
    { source: 6, target: 21, directed: false },
    { source: 6, target: 22, directed: false },
    { source: 7, target: 9, directed: false },
    { source: 9, target: 10, directed: false },
    { source: 11, target: 12, directed: false },
    { source: 12, target: 13, directed: false },
  ];

  return finalizeSample(nodes, edges);
};

export function getDefaultLibrarySamples() {
  return {
    'Cognitive Psychology': buildCognitivePsychologySample(),
    'Structured Contact': buildStructuredContactSample(),
    'The Chronicles of Narnia': buildNarniaSample(),
  };
}

export default getDefaultLibrarySamples;
