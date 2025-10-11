import { describe, it, expect } from 'vitest';
import generateQrMatrix from '../../utils/qrGenerator.js';

describe('qrGenerator', () => {
  it('returns a square matrix of booleans', () => {
    const matrix = generateQrMatrix('HELLO WORLD', 0);
    expect(Array.isArray(matrix)).toBe(true);
    expect(matrix.length).toBeGreaterThan(0);
    matrix.forEach((row) => {
      expect(Array.isArray(row)).toBe(true);
      expect(row.length).toBe(matrix.length);
      row.forEach((cell) => {
        expect(typeof cell === 'boolean').toBe(true);
      });
    });
  });

  it('coerces non-string values and throws for unsupported sizes', () => {
    const matrixFromNumber = generateQrMatrix(1234567890, 0);
    expect(matrixFromNumber.length).toBeGreaterThan(0);
    expect(() => generateQrMatrix('X'.repeat(4000), 0)).toThrow(/bad rs block/);
  });
});
