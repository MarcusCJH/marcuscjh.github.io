import { escapeXml } from '../lib/escape.ts';
import { absoluteUrl, normalizeBaseUrl } from '../lib/urls.ts';
import type { SiteData } from '../types.ts';

function imageBlock(loc: string): string {
  return `\n        <image:image>\n            <image:loc>${escapeXml(loc)}</image:loc>\n        </image:image>`;
}

/**
 * Build `sitemap.xml`: the home page plus one entry per showcase project,
 * each with its preview image when data.json provides one.
 *
 * @param lastModified `YYYY-MM-DD` stamp used for every `<lastmod>`.
 */
export function buildSitemap(data: SiteData, lastModified: string): string {
  const baseUrl = normalizeBaseUrl(data.seo.defaults?.url || '');
  const mainImage = data.seo.defaults?.image
    ? imageBlock(absoluteUrl(data.seo.defaults.image, baseUrl))
    : '';
  const projectEntries = data.showcase
    .map(project => {
      const projectUrl = `${baseUrl}/projects/${encodeURIComponent(project.id)}/`;
      const image = project.backgroundImage
        ? imageBlock(absoluteUrl(project.backgroundImage, baseUrl))
        : '';
      return `    <url>
        <loc>${escapeXml(projectUrl)}</loc>
        <lastmod>${lastModified}</lastmod>${image}
    </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    <url>
        <loc>${escapeXml(baseUrl)}/</loc>
        <lastmod>${lastModified}</lastmod>${mainImage}
    </url>
${projectEntries}
</urlset>`;
}
