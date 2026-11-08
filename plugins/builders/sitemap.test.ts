import { describe, expect, it } from 'vitest';
import { buildSitemap } from './sitemap.ts';
import { createSiteData } from '../test-fixtures.ts';

const LAST_MODIFIED = '2026-11-08';

describe('buildSitemap', () => {
  const xml = buildSitemap(createSiteData(), LAST_MODIFIED);

  it('starts with an XML declaration and the sitemap + image namespaces', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">');
    expect(xml.trimEnd().endsWith('</urlset>')).toBe(true);
  });

  it('emits the home page plus one entry per showcase project', () => {
    const data = createSiteData();
    expect(xml.match(/<url>/g)).toHaveLength(data.showcase.length + 1);
    expect(xml.match(/<lastmod>2026-11-08<\/lastmod>/g)).toHaveLength(data.showcase.length + 1);
  });

  it('normalises the base url so locations never double up slashes', () => {
    expect(xml).toContain('<loc>https://example.com/</loc>');
    expect(xml).not.toContain('https://example.com//');
  });

  it('uses encoded, absolute project urls', () => {
    expect(xml).toContain('<loc>https://example.com/projects/alpha/</loc>');
    expect(xml).toContain('<loc>https://example.com/projects/datav-webinar/</loc>');
  });

  it('adds an escaped image block only for entries that have an image', () => {
    expect(xml).toContain('<image:loc>https://example.com/showcase/hero&amp;main.png</image:loc>');
    expect(xml).toContain('<image:loc>https://example.com/showcase/alpha&amp;one.png</image:loc>');
    expect(xml.match(/<image:image>/g)).toHaveLength(2);
  });

  it('omits the image block when data.json has no image', () => {
    const data = createSiteData();
    delete data.seo.defaults?.image;
    data.showcase = data.showcase.map(project => ({ ...project, backgroundImage: undefined }));
    expect(buildSitemap(data, LAST_MODIFIED)).not.toContain('<image:image>');
  });
});
