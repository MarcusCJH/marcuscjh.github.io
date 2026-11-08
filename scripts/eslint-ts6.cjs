/**
 * Preload for ESLint only: resolve `typescript` to the side-by-side TS 6 copy.
 *
 * The project compiles with TypeScript 7 (`typescript` in devDependencies), but
 * typescript-eslint does not support the TS 7 API yet and hard-throws on load:
 *   "typescript-eslint does not support TS 7.0."
 * See https://github.com/typescript-eslint/typescript-eslint/issues/10940
 *
 * The documented workaround is to run typescript-eslint against the TS 6 API.
 * `typescript-6` (an npm alias for typescript@~6.0.3) provides that copy, and
 * this hook redirects `require('typescript')` to it. Only the lint process
 * loads this file, so `tsc`, Vite and Vitest keep using TypeScript 7.
 *
 * NOTE: this hook patches Node's CommonJS resolver, so the ESLint config must
 * stay native ESM (`eslint.config.mjs`). A `.ts` config is loaded through jiti,
 * whose own resolver bypasses this patch, and `typescript-eslint` then throws at
 * import time. See the header comment in eslint.config.mjs.
 *
 * Remove this file, the `typescript-6` devDependency and the `node -r ...`
 * prefix in the lint scripts once typescript-eslint supports TS >= 7.1.
 */
const Module = require('node:module');
const path = require('node:path');

const TS6_ROOT = path.join(__dirname, '..', 'node_modules', 'typescript-6');
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, ...rest) {
  let redirected = request;
  if (request === 'typescript') {
    redirected = TS6_ROOT;
  } else if (request.startsWith('typescript/')) {
    redirected = path.join(TS6_ROOT, request.slice('typescript/'.length));
  }
  return originalResolveFilename.call(this, redirected, ...rest);
};
