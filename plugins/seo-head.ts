import type { HtmlTagDescriptor, Plugin } from 'vite';
import { buildHeadTags } from './builders/head-tags.ts';
import { renderStaticContent } from './builders/static-content.ts';
import { dataModifiedIso, loadSiteData } from './site-data.ts';

/**
 * Injects the data-driven `<head>` (meta tags, Open Graph, Twitter cards,
 * canonical links, JSON-LD) into `index.html` and fills its content
 * placeholders so the page is meaningful without JavaScript.
 */
export function seoHeadPlugin(): Plugin {
  return {
    name: 'site:seo-head',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const data = loadSiteData();
        const tags: HtmlTagDescriptor[] = buildHeadTags(data, dataModifiedIso());
        return { html: renderStaticContent(html, data), tags };
      },
    },
  };
}
