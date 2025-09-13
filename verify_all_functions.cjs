// Verify all function orders in App.jsx
const fs = require('fs');

const content = fs.readFileSync('src/App.jsx', 'utf8');
const lines = content.split('\n');

const functions = {
  createNewNode: { definition: -1, usage: [] },
  handleToggleNodeInfoPanel: { definition: -1, usage: [] },
  showNodeInfoPanel: { definition: -1, usage: [] }
};

lines.forEach((line, index) => {
  const lineNum = index + 1;
  
  // Check for function definitions
  if (line.includes('const createNewNode = useCallback')) {
    functions.createNewNode.definition = lineNum;
  }
  if (line.includes('const handleToggleNodeInfoPanel = useCallback')) {
    functions.handleToggleNodeInfoPanel.definition = lineNum;
  }
  if (line.includes('const [showNodeInfoPanel, setShowNodeInfoPanel] = useState')) {
    functions.showNodeInfoPanel.definition = lineNum;
  }
  
  // Check for usages
  if (line.includes('createNewNode(') && !line.includes('const createNewNode')) {
    functions.createNewNode.usage.push(lineNum);
  }
  if (line.includes('handleToggleNodeInfoPanel') && !line.includes('const handleToggleNodeInfoPanel')) {
    functions.handleToggleNodeInfoPanel.usage.push(lineNum);
  }
  if (line.includes('showNodeInfoPanel') && !line.includes('const [showNodeInfoPanel')) {
    functions.showNodeInfoPanel.usage.push(lineNum);
  }
});

console.log('Function order verification:');
console.log('==========================');

Object.entries(functions).forEach(([name, info]) => {
  console.log(`\n${name}:`);
  console.log(`  Definition: line ${info.definition}`);
  console.log(`  Usages: lines ${info.usage.join(', ')}`);
  
  if (info.definition > 0 && info.usage.length > 0) {
    const allUsagesAfterDefinition = info.usage.every(usage => usage > info.definition);
    if (allUsagesAfterDefinition) {
      console.log(`  ✅ CORRECT: All usages come after definition`);
    } else {
      const badUsages = info.usage.filter(usage => usage <= info.definition);
      console.log(`  ❌ ERROR: Usages before definition at lines: ${badUsages.join(', ')}`);
    }
  } else if (info.definition === -1) {
    console.log(`  ⚠️  WARNING: Definition not found`);
  } else if (info.usage.length === 0) {
    console.log(`  ⚠️  WARNING: No usages found`);
  }
});

console.log('\n==========================');
const allCorrect = Object.values(functions).every(info => 
  info.definition > 0 && info.usage.length > 0 && 
  info.usage.every(usage => usage > info.definition)
);

if (allCorrect) {
  console.log('🎉 ALL FUNCTIONS HAVE CORRECT ORDER!');
} else {
  console.log('❌ Some functions have ordering issues');
}