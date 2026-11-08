import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['{src,plugins}/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', '.git', '.cache'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      /* Without an explicit `include`, v8 only reports files a test imported,
         so untested modules are invisible rather than counted as 0%. */
      include: ['src/**/*.ts', 'plugins/**/*.ts'],
      /* Only genuinely uncoverable files are excluded. Application code is
         not: excluding it is how a coverage number stops meaning anything.
         `src/main.ts`, `src/components/` and `src/lib/dom.ts` used to be
         listed here, which exempted the bulk of the app from its own metric. */
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.test.ts',
        'src/test/setup.ts',
        'src/types/', // type declarations only, no runtime code
        'plugins/test-fixtures.ts', // test fixture, not shipped logic
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
  },
});
