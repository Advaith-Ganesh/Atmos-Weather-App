/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      // The layers where a regression is silent rather than visible on screen.
      include: ['src/api/**', 'src/lib/**', 'src/hooks/**'],
      // Set just below the current figures so the gate catches a real drop
      // without failing on noise.
      thresholds: {
        statements: 95,
        branches: 85,
        functions: 95,
        lines: 95,
      },
    },
  },
});
