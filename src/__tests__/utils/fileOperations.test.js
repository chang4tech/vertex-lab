import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToJSON, validateImportData, importFromJSON } from '../../utils/fileOperations';

describe('fileOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks
    global.URL.createObjectURL = vi.fn(() => 'blob:test');
    global.URL.revokeObjectURL = vi.fn();
  });

  describe('exportToJSON', () => {
    const mockNodes = [
      { id: 1, label: 'Root', x: 400, y: 300 },
      { id: 2, label: 'Child', x: 500, y: 400 }
    ];

    it('creates a JSON blob with correct data', async () => {
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');
      
      exportToJSON(mockNodes);

      // Check if Blob was created with correct data
      expect(URL.createObjectURL).toHaveBeenCalled();
      const blobCall = URL.createObjectURL.mock.calls[0][0];
      expect(blobCall).toBeInstanceOf(Blob);
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result);
        reader.readAsText(blobCall);
      });
      expect(JSON.parse(reader.result)).toEqual(mockNodes);

      // Check if link was created and clicked
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      
      // Check if URL was revoked
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
    });

    it('generates filename with current timestamp', () => {
      const mockDate = new Date('2025-09-11T12:00:00');
      vi.setSystemTime(mockDate);

      const linkClickSpy = vi.fn();
      const originalCreateElement = document.createElement;
      
      document.createElement = vi.fn(tag => ({
        ...originalCreateElement.call(document, tag),
        click: linkClickSpy
      }));

      exportToJSON(mockNodes);

      expect(linkClickSpy).toHaveBeenCalled();
      const link = document.createElement.mock.results[0].value;
      expect(link.download).toMatch(/mindmap-20250911-120000\.json/);

      vi.useRealTimers();
      document.createElement = originalCreateElement;
    });
  });

  describe('validateImportData', () => {
    it('accepts valid node data', () => {
      const validData = [
        { id: 1, label: 'Test', x: 100, y: 100 }
      ];

      expect(() => validateImportData(validData)).not.toThrow();
    });

    it('rejects non-array data', () => {
      const invalidData = { nodes: [] };

      expect(() => validateImportData(invalidData))
        .toThrow('Imported data must be an array');
    });

    it('rejects nodes with missing properties', () => {
      const invalidData = [
        { id: 1, label: 'Test' } // missing x, y
      ];

      expect(() => validateImportData(invalidData))
        .toThrow('Invalid node format');
    });

    it('rejects nodes with wrong property types', () => {
      const invalidData = [
        { id: 1, label: 'Test', x: '100', y: 100 } // x should be number
      ];

      expect(() => validateImportData(invalidData))
        .toThrow('Invalid node format');
    });
  });

  describe('importFromJSON', () => {
    it('successfully imports valid JSON file', async () => {
      const validData = [
        { id: 1, label: 'Test', x: 100, y: 100 }
      ];
      
      const file = new File(
        [JSON.stringify(validData)],
        'test.json',
        { type: 'application/json' }
      );

      const result = await importFromJSON(file);
      expect(result).toEqual(validData);
    });

    it('rejects invalid JSON file', async () => {
      const file = new File(
        ['invalid json'],
        'test.json',
        { type: 'application/json' }
      );

      await expect(importFromJSON(file))
        .rejects
        .toThrow('Import failed: Unexpected token');
    });

    it('rejects file read errors', async () => {
      const file = new File([], 'test.json');
      vi.spyOn(FileReader.prototype, 'readAsText')
        .mockImplementation(() => {
          throw new Error('Read error');
        });

      await expect(importFromJSON(file))
        .rejects
        .toThrow('Failed to read file');
    });
  });
});
