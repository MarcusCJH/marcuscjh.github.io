import { describe, expect, it } from 'vitest';
import { buildManifest, renderManifest } from './manifest.ts';
import { createSiteData } from '../test-fixtures.ts';

describe('buildManifest', () => {
  it('builds every web app manifest field from data.json', () => {
    expect(buildManifest(createSiteData())).toEqual({
      name: 'Default Title',
      short_name: 'tester',
      description: 'Meta description',
      start_url: '/',
      display: 'standalone',
      background_color: '#08090a',
      theme_color: '#c6f24e',
      icons: [
        { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
      ],
    });
  });

  it('falls back to "<real name> | <title>" when seo.defaults has no title', () => {
    const data = createSiteData();
    delete data.seo.defaults?.title;
    expect(buildManifest(data).name).toBe('Ada "A&B" O\'Hara | Engineer & Architect');
  });

  it('falls back to the default description and brand colours', () => {
    const data = createSiteData();
    data.seo.meta = {};
    expect(buildManifest(data)).toMatchObject({
      description: 'Default description',
      background_color: '#0a0a0a',
      theme_color: '#00ff88',
    });
  });

  it('renders as 4-space indented JSON', () => {
    const json = renderManifest(createSiteData());
    expect(json).toContain('\n    "short_name": "tester",');
    expect(JSON.parse(json)).toEqual(buildManifest(createSiteData()));
  });
});
