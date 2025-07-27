import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.{test,spec}.js'],
    exclude: ['tests/e2e/**/*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.js',
        '**/*-optimized.js',
        '**/*.min.js',
        'scripts/',
        '.wrangler/'
      ]
    },
    testTimeout: 10000
  },
  resolve: {
    alias: {
      '@': './assets/js',
      '@modules': './assets/js/modules',
      '@config': './config'
    }
  }
});