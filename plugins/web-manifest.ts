import type { Plugin } from 'vite';
import { renderManifest } from './builders/manifest.ts';
import { loadSiteData } from './site-data.ts';

/** Emits `dist/manifest.json` from data.json. */
export function webManifestPlugin(): Plugin {
  return {
    name: 'site:web-manifest',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: renderManifest(loadSiteData()),
      });
    },
  };
}
