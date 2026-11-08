import type { IndexHtmlTransformContext, IndexHtmlTransformResult } from 'vite';
import { describe, expect, it } from 'vitest';
import { seoHeadPlugin } from './seo-head.ts';
import { hookFunction } from './test-fixtures.ts';
import { loadSiteData } from './site-data.ts';

type Transform = (html: string, ctx: IndexHtmlTransformContext) => IndexHtmlTransformResult;

describe('seoHeadPlugin', () => {
  const plugin = seoHeadPlugin();
  const transform = hookFunction(plugin.transformIndexHtml) as unknown as Transform;
  const ctx = {} as IndexHtmlTransformContext;

  it('is named and runs before other HTML transforms', () => {
    expect(plugin.name).toBe('site:seo-head');
    expect(plugin.transformIndexHtml).toMatchObject({ order: 'pre' });
  });

  it('fills the content placeholders and returns the head tags', () => {
    const data = loadSiteData();
    const result = transform('<span class="brand-text"></span><h1 class="hero-title"></h1>', ctx);
    if (typeof result !== 'object' || Array.isArray(result) || !('html' in result)) {
      throw new Error('Expected an { html, tags } result');
    }
    expect(result.html).toContain(`<span class="brand-text">`);
    expect(result.html).not.toContain('<span class="brand-text"></span>');
    const tags = result.tags;
    expect(Array.isArray(tags)).toBe(true);
    const list = Array.isArray(tags) ? tags : [];
    expect(list[0]).toMatchObject({ tag: 'title', injectTo: 'head-prepend' });
    expect(list.filter(tag => tag.tag === 'script')).toHaveLength(4);
    expect(list.some(tag => tag.tag === 'link' && tag.attrs?.href === '/sitemap.xml')).toBe(true);
    expect(data.config.name.length).toBeGreaterThan(0);
  });
});
