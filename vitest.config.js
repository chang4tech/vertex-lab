import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'src/main.jsx',
        'src/**/*.d.ts',
      ],
    },
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    exclude: ['src/__tests__/e2e/**'],
  },
});
