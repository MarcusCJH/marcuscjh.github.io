import {
  buildPersonSchema,
  buildProfilePageSchema,
  buildProjectsSchema,
  buildWebsiteSchema,
} from './schema.ts';
import type { HeadTag, SiteData } from '../types.ts';

/**
 * Build every `<head>` tag injected into `index.html` at build time: title,
 * robots/meta tags, Open Graph, Twitter cards, canonical/alternate links and
 * the four JSON-LD documents.
 *
 * @param dataModifiedIso ISO timestamp of the last data.json change.
 */
export function buildHeadTags(data: SiteData, dataModifiedIso: string): HeadTag[] {
  const { seo, config } = data;
  const defaults = seo.defaults || {};
  const meta = seo.meta || {};
  const og = seo.openGraph || {};
  const tw = seo.twitter || {};

  const title = meta.title || defaults.title || '';
  const description = meta.description || defaults.description || '';
  const image = og.image || defaults.image || '';
  const url = og.url || defaults.url || '';
  const author = defaults.author || '';
  const robots = meta.robots || defaults.robots || '';
  const canonicalUrl = seo.canonical || url;
  const imageAlt = `${config.real_name || ''} - ${config.title || ''} Portfolio`;

  const tags: HeadTag[] = [];
  const metaTag = (attrs: Record<string, string>): void => {
    tags.push({ tag: 'meta', attrs, injectTo: 'head' });
  };
  const linkTag = (attrs: Record<string, string>): void => {
    tags.push({ tag: 'link', attrs, injectTo: 'head' });
  };

  tags.push({ tag: 'title', children: title, injectTo: 'head-prepend' });
  if (meta.themeColor) {
    metaTag({ name: 'theme-color', content: meta.themeColor });
  }
  metaTag({ name: 'title', content: title });
  metaTag({ name: 'description', content: description });
  if (author) {
    metaTag({ name: 'author', content: author });
  }
  if (robots) {
    metaTag({ name: 'robots', content: robots });
  }
  if (meta.googlebot) {
    metaTag({ name: 'googlebot', content: meta.googlebot });
  }
  if (meta.bingbot) {
    metaTag({ name: 'bingbot', content: meta.bingbot });
  }

  metaTag({ property: 'og:type', content: og.type || defaults.openGraph?.type || 'website' });
  metaTag({ property: 'og:url', content: url });
  metaTag({ property: 'og:title', content: og.title || title });
  metaTag({ property: 'og:description', content: og.description || description });
  if (og.site_name) {
    metaTag({ property: 'og:site_name', content: og.site_name });
  }
  if (og.locale) {
    metaTag({ property: 'og:locale', content: og.locale });
  }
  if (image) {
    metaTag({ property: 'og:image', content: image });
    metaTag({ property: 'og:image:alt', content: imageAlt });
    if (og.imageWidth) {
      metaTag({ property: 'og:image:width', content: og.imageWidth });
    }
    if (og.imageHeight) {
      metaTag({ property: 'og:image:height', content: og.imageHeight });
    }
    if (og.imageType) {
      metaTag({ property: 'og:image:type', content: og.imageType });
    }
  }

  metaTag({
    name: 'twitter:card',
    content: tw.card || defaults.twitter?.card || 'summary_large_image',
  });
  metaTag({ name: 'twitter:url', content: tw.url || url });
  metaTag({ name: 'twitter:title', content: tw.title || title });
  metaTag({ name: 'twitter:description', content: tw.description || description });
  if (image) {
    metaTag({ name: 'twitter:image', content: tw.image || image });
    metaTag({ name: 'twitter:image:alt', content: imageAlt });
  }
  if (tw.creator) {
    metaTag({ name: 'twitter:creator', content: tw.creator });
  }
  if (tw.site) {
    metaTag({ name: 'twitter:site', content: tw.site });
  }

  if (canonicalUrl) {
    linkTag({ rel: 'canonical', href: canonicalUrl });
  }
  for (const alternate of seo.alternateUrls || []) {
    linkTag({ rel: 'alternate', href: alternate.href, hreflang: alternate.hreflang });
  }
  linkTag({ rel: 'sitemap', type: 'application/xml', href: '/sitemap.xml' });
  if (seo.googleSiteVerification) {
    metaTag({ name: 'google-site-verification', content: seo.googleSiteVerification });
  }

  const schemas: [string, object][] = [
    ['website', buildWebsiteSchema(data)],
    [
      'profile',
      buildProfilePageSchema(data, { title, description, dateModified: dataModifiedIso }),
    ],
    ['person', buildPersonSchema(data)],
    ['projects', buildProjectsSchema(data)],
  ];
  for (const [schemaName, schema] of schemas) {
    tags.push({
      tag: 'script',
      attrs: { type: 'application/ld+json', 'data-schema': schemaName },
      children: JSON.stringify(schema, null, 4),
      injectTo: 'head',
    });
  }

  return tags;
}
