import type { Plugin } from 'vite';
import { renderProjectPage } from './builders/project-page.ts';
import { dataModifiedIso, loadSiteData } from './site-data.ts';

/**
 * Prerenders `dist/projects/<id>/index.html` for every showcase project,
 * linking the hashed production stylesheet from the current bundle.
 */
export function projectPagesPlugin(): Plugin {
  return {
    name: 'site:project-pages',
    apply: 'build',
    generateBundle(_options, bundle) {
      const data = loadSiteData();
      const cssAsset = Object.values(bundle).find(
        item => item.type === 'asset' && item.fileName.endsWith('.css')
      );
      if (!cssAsset) {
        this.error('Unable to generate project pages: the production CSS asset was not found.');
        return;
      }
      const modified = dataModifiedIso();
      data.showcase.forEach((project, projectIndex) => {
        this.emitFile({
          type: 'asset',
          fileName: `projects/${project.id}/index.html`,
          source: renderProjectPage({
            data,
            project,
            projectIndex,
            cssHref: `/${cssAsset.fileName}`,
            dataModifiedIso: modified,
          }),
        });
      });
    },
  };
}
