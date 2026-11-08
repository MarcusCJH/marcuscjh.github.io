import { describe, expect, it } from 'vitest';
import { buildHeadTags } from './head-tags.ts';
import { createSiteData, parseJson } from '../test-fixtures.ts';
import type { HeadTag, PersonSchema } from '../types.ts';

const MODIFIED = '2026-11-08T12:34:56.000Z';

function findMeta(tags: HeadTag[], key: 'name' | 'property', value: string): HeadTag | undefined {
  return tags.find(tag => tag.tag === 'meta' && tag.attrs?.[key] === value);
}

describe('buildHeadTags', () => {
  const tags = buildHeadTags(createSiteData(), MODIFIED);

  it('prepends the title to the head', () => {
    expect(tags[0]).toEqual({ tag: 'title', children: 'Meta Title', injectTo: 'head-prepend' });
  });

  it('injects the core meta tags from data.json', () => {
    expect(findMeta(tags, 'name', 'description')?.attrs?.content).toBe('Meta description');
    expect(findMeta(tags, 'name', 'author')?.attrs?.content).toBe('Ada Author');
    expect(findMeta(tags, 'name', 'robots')?.attrs?.content).toBe('index, follow');
    expect(findMeta(tags, 'name', 'theme-color')?.attrs?.content).toBe('#c6f24e');
  });

  it('injects Open Graph and Twitter card tags, including image dimensions', () => {
    expect(findMeta(tags, 'property', 'og:type')?.attrs?.content).toBe('website');
    expect(findMeta(tags, 'property', 'og:image')?.attrs?.content).toBe('./showcase/hero&main.png');
    expect(findMeta(tags, 'property', 'og:image:width')?.attrs?.content).toBe('520');
    expect(findMeta(tags, 'name', 'twitter:card')?.attrs?.content).toBe('summary_large_image');
    expect(findMeta(tags, 'name', 'twitter:creator')?.attrs?.content).toBe('@ada');
  });

  it('injects canonical, alternate and sitemap links', () => {
    const links = tags.filter(tag => tag.tag === 'link');
    expect(links.map(link => link.attrs?.rel)).toEqual(['canonical', 'alternate', 'sitemap']);
    expect(links[0]!.attrs?.href).toBe('https://example.com/');
    expect(links[2]!.attrs?.href).toBe('/sitemap.xml');
  });

  it('injects the four JSON-LD documents, in order, as 4-space indented JSON', () => {
    const scripts = tags.filter(tag => tag.tag === 'script');
    expect(scripts.map(script => script.attrs?.['data-schema'])).toEqual([
      'website',
      'profile',
      'person',
      'projects',
    ]);
    expect(scripts.every(script => script.attrs?.type === 'application/ld+json')).toBe(true);
    expect(scripts[1]!.children).toContain('\n    "dateModified": "2026-11-08T12:34:56.000Z",');
    expect(parseJson<PersonSchema>(scripts[2]!.children ?? '')['@type']).toBe('Person');
  });

  it('skips optional tags when data.json omits them', () => {
    const data = createSiteData();
    data.seo.meta = {};
    data.seo.openGraph = {};
    data.seo.twitter = {};
    data.seo.defaults = { url: 'https://example.com/' };
    delete data.seo.alternateUrls;
    delete data.seo.googleSiteVerification;
    const minimal = buildHeadTags(data, MODIFIED);
    expect(findMeta(minimal, 'name', 'theme-color')).toBeUndefined();
    expect(findMeta(minimal, 'property', 'og:image')).toBeUndefined();
    expect(findMeta(minimal, 'name', 'google-site-verification')).toBeUndefined();
    expect(minimal.filter(tag => tag.tag === 'link').map(link => link.attrs?.rel)).toEqual([
      'canonical',
      'sitemap',
    ]);
    expect(findMeta(minimal, 'property', 'og:type')?.attrs?.content).toBe('website');
  });
});
