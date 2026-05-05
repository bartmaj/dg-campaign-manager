import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage',
      include: ['domain/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/*.d.ts',
        // In-memory matcher; perf-tested separately, not a line-coverage target per ADR-005.
        'domain/searchMatch.ts',
      ],
      thresholds: {
        perFile: true,
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
})
