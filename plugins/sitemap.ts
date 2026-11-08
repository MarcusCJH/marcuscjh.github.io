import type { Plugin } from 'vite';
import { buildSitemap } from './builders/sitemap.ts';
import { dataModifiedDate, loadSiteData } from './site-data.ts';

/** Emits `dist/sitemap.xml` from data.json. */
export function sitemapPlugin(): Plugin {
  return {
    name: 'site:sitemap',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: buildSitemap(loadSiteData(), dataModifiedDate()),
      });
    },
  };
}
