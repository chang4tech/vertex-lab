/**
 * Utility functions for file operations
 */

export function exportToJSON(nodes) {
  const blob = new Blob([JSON.stringify(nodes, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const filename = `mindmap-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.json`;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

export function validateImportData(data) {
  if (!Array.isArray(data)) {
    throw new Error('Imported data must be an array');
  }

  if (!data.every(n => 
    n.id && 
    typeof n.x === 'number' && 
    typeof n.y === 'number' && 
    typeof n.label === 'string')) {
    throw new Error('Invalid node format');
  }

  return true;
}

export function importFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const content = event.target.result;
        const data = JSON.parse(content);
        if (validateImportData(data)) {
          resolve(data);
        }
      } catch (error) {
        reject(new Error(`Import failed: ${error.message}`));
      }
    };
    reader.onerror = error => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
