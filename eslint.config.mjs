// @ts-check
import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

/**
 * This config is `.mjs`, not `.ts`, and that is deliberate.
 *
 * The project compiles with TypeScript 7, which typescript-eslint does not
 * support yet; `scripts/eslint-ts6.cjs` is a `node -r` preload that redirects
 * `require('typescript')` to the side-by-side TS 6 copy for the lint process
 * only. That preload patches `Module._resolveFilename`, so it covers Node's
 * CommonJS loader — but ESLint loads a `.ts` config through jiti, which
 * resolves modules with its own resolver and therefore slips past the patch.
 * The `typescript-eslint` package asserts the TypeScript version at import
 * time, so under a `.ts` config it hard-throws "does not support TS 7.0"
 * before any of this runs.
 *
 * Keeping the config as native ESM means Node's own loader resolves
 * `typescript-eslint` (and the TypeScript it requires), the shim applies, and
 * the current recommended setup works unchanged. Revisit once
 * typescript-eslint supports TS >= 7.1; see scripts/eslint-ts6.cjs.
 */

/** Vitest's globals are not published in the `globals` package. */
const vitestGlobals = {
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  expect: 'readonly',
  beforeAll: 'readonly',
  beforeEach: 'readonly',
  afterAll: 'readonly',
  afterEach: 'readonly',
  vi: 'readonly',
};

export default defineConfig([
  { ignores: ['dist/', 'coverage/', 'node_modules/'] },

  js.configs.recommended,

  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        // Current replacement for the older `parserOptions.project`.
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'warn',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  { files: ['src/**/*.ts'], languageOptions: { globals: globals.browser } },
  { files: ['plugins/**/*.ts', '*.config.ts'], languageOptions: { globals: globals.node } },
  {
    files: ['**/*.test.ts', 'src/test/**/*.ts'],
    languageOptions: { globals: { ...globals.browser, ...globals.node, ...vitestGlobals } },
  },
]);
