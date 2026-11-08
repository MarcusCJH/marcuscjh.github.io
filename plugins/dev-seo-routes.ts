import type { Plugin } from 'vite';
import { renderManifest } from './builders/manifest.ts';
import { renderProjectPage } from './builders/project-page.ts';
import { buildSitemap } from './builders/sitemap.ts';
import { dataModifiedDate, dataModifiedIso, loadSiteData } from './site-data.ts';

/** Dev-server source path of the stylesheet the project pages link. */
const DEV_CSS_HREF = '/src/styles/style.css';

/**
 * Serves the build-time generated routes (`/projects/<id>/`, `/manifest.json`,
 * `/sitemap.xml`) from the dev server so they can be previewed without a build.
 */
export function devSeoRoutesPlugin(): Plugin {
  return {
    name: 'site:dev-seo-routes',
    apply: 'serve',
    configureServer(server) {
      const data = loadSiteData();

      server.middlewares.use((req, res, next) => {
        const match = req.url?.match(/^\/projects\/([^/?#]+)\/?(?:\?.*)?$/);
        if (!match) {
          next();
          return;
        }
        const projectId = decodeURIComponent(match[1] ?? '');
        const projectIndex = data.showcase.findIndex(entry => entry.id === projectId);
        const project = data.showcase[projectIndex];
        if (!project) {
          next();
          return;
        }
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(
          renderProjectPage({
            data,
            project,
            projectIndex,
            cssHref: DEV_CSS_HREF,
            dataModifiedIso: dataModifiedIso(),
          })
        );
      });

      server.middlewares.use('/manifest.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(renderManifest(data));
      });

      server.middlewares.use('/sitemap.xml', (_req, res) => {
        res.setHeader('Content-Type', 'application/xml');
        res.end(buildSitemap(data, dataModifiedDate()));
      });
    },
  };
}
