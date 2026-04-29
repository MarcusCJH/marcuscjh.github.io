import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin, HtmlTagDescriptor } from 'vite';

const dataPath = path.resolve(__dirname, 'public/data.json');

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildManifest(data: any): object {
  return {
    name: data.seo?.defaults?.title || `${data.config?.real_name} | ${data.config?.title}`,
    short_name: data.config?.name || '',
    description: data.seo?.meta?.description || data.seo?.defaults?.description || '',
    start_url: '/',
    display: 'standalone',
    background_color: data.seo?.meta?.backgroundColor || '#0a0a0a',
    theme_color: data.seo?.meta?.themeColor || '#00ff88',
    icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
  };
}

function buildSitemap(data: any): string {
  const baseUrl = (data.seo?.defaults?.url || '').replace(/\/$/, '');
  const today = new Date().toISOString().split('T')[0];
  const name = data.config?.real_name || data.config?.name || '';
  const title = data.config?.title || '';
  const mainImage = data.seo?.defaults?.image || '';

  const showcaseImages = (data.showcase || [])
    .filter((p: any) => p.backgroundImage)
    .map((p: any) => {
      const imageUrl = p.backgroundImage.startsWith('./')
        ? `${baseUrl}/${p.backgroundImage.slice(2)}`
        : p.backgroundImage;
      return `        <image:image>\n            <image:loc>${imageUrl}</image:loc>\n            <image:title>${escapeXml(p.title)} by ${escapeXml(name)}</image:title>\n        </image:image>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    <url>
        <loc>${baseUrl}/</loc>
        <lastmod>${today}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>1.0</priority>${mainImage ? `\n        <image:image>\n            <image:loc>${mainImage}</image:loc>\n            <image:title>${escapeXml(name)} — ${escapeXml(title)} Portfolio</image:title>\n        </image:image>` : ''}
    </url>
    <url>
        <loc>${baseUrl}/#timeline-section</loc>
        <lastmod>${today}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${baseUrl}/#showcase-section</loc>
        <lastmod>${today}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
${showcaseImages}
    </url>
</urlset>`;
}

function seoInjectPlugin(): Plugin {
  return {
    name: 'seo-inject',

    configureServer(server) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      server.middlewares.use('/manifest.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(buildManifest(data), null, 4));
      });
      server.middlewares.use('/sitemap.xml', (_req, res) => {
        res.setHeader('Content-Type', 'application/xml');
        res.end(buildSitemap(data));
      });
    },

    generateBundle() {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      this.emitFile({ type: 'asset', fileName: 'manifest.json', source: JSON.stringify(buildManifest(data), null, 4) });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: buildSitemap(data) });
    },

    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        const { seo, config } = data;
        const defaults = seo.defaults || {};
        const meta = seo.meta || {};
        const og = seo.openGraph || {};
        const tw = seo.twitter || {};

        const title = meta.title || defaults.title || '';
        const description = meta.description || defaults.description || '';
        const keywords = meta.keywords || '';
        const image = og.image || defaults.image || '';
        const url = og.url || defaults.url || '';
        const author = defaults.author || '';
        const robots = meta.robots || defaults.robots || '';
        const canonicalUrl = seo.canonical || url;
        const imageAlt = `${config.real_name || ''} - ${config.title || ''} Portfolio`;

        const tags: HtmlTagDescriptor[] = [
          { tag: 'title', children: title, injectTo: 'head-prepend' },
          ...(meta.themeColor ? [{ tag: 'meta' as const, attrs: { name: 'theme-color', content: meta.themeColor }, injectTo: 'head' as const }] : []),
          { tag: 'meta', attrs: { name: 'title', content: title }, injectTo: 'head' },
          { tag: 'meta', attrs: { name: 'description', content: description }, injectTo: 'head' },
          ...(keywords ? [{ tag: 'meta' as const, attrs: { name: 'keywords', content: keywords }, injectTo: 'head' as const }] : []),
          ...(author ? [{ tag: 'meta' as const, attrs: { name: 'author', content: author }, injectTo: 'head' as const }] : []),
          ...(robots ? [{ tag: 'meta' as const, attrs: { name: 'robots', content: robots }, injectTo: 'head' as const }] : []),
          ...(meta.googlebot ? [{ tag: 'meta' as const, attrs: { name: 'googlebot', content: meta.googlebot }, injectTo: 'head' as const }] : []),
          ...(meta.bingbot ? [{ tag: 'meta' as const, attrs: { name: 'bingbot', content: meta.bingbot }, injectTo: 'head' as const }] : []),
          { tag: 'meta', attrs: { property: 'og:type', content: og.type || defaults.openGraph?.type || 'website' }, injectTo: 'head' },
          { tag: 'meta', attrs: { property: 'og:url', content: url }, injectTo: 'head' },
          { tag: 'meta', attrs: { property: 'og:title', content: og.title || title }, injectTo: 'head' },
          { tag: 'meta', attrs: { property: 'og:description', content: og.description || description }, injectTo: 'head' },
          ...(og.site_name ? [{ tag: 'meta' as const, attrs: { property: 'og:site_name', content: og.site_name }, injectTo: 'head' as const }] : []),
          ...(og.locale ? [{ tag: 'meta' as const, attrs: { property: 'og:locale', content: og.locale }, injectTo: 'head' as const }] : []),
          ...(image ? [
            { tag: 'meta' as const, attrs: { property: 'og:image', content: image }, injectTo: 'head' as const },
            { tag: 'meta' as const, attrs: { property: 'og:image:alt', content: imageAlt }, injectTo: 'head' as const },
            ...(og.imageWidth ? [{ tag: 'meta' as const, attrs: { property: 'og:image:width', content: og.imageWidth }, injectTo: 'head' as const }] : []),
            ...(og.imageHeight ? [{ tag: 'meta' as const, attrs: { property: 'og:image:height', content: og.imageHeight }, injectTo: 'head' as const }] : []),
            ...(og.imageType ? [{ tag: 'meta' as const, attrs: { property: 'og:image:type', content: og.imageType }, injectTo: 'head' as const }] : []),
          ] : []),
          { tag: 'meta', attrs: { name: 'twitter:card', content: tw.card || defaults.twitter?.card || 'summary_large_image' }, injectTo: 'head' },
          { tag: 'meta', attrs: { name: 'twitter:url', content: tw.url || url }, injectTo: 'head' },
          { tag: 'meta', attrs: { name: 'twitter:title', content: tw.title || title }, injectTo: 'head' },
          { tag: 'meta', attrs: { name: 'twitter:description', content: tw.description || description }, injectTo: 'head' },
          ...(image ? [
            { tag: 'meta' as const, attrs: { name: 'twitter:image', content: tw.image || image }, injectTo: 'head' as const },
            { tag: 'meta' as const, attrs: { name: 'twitter:image:alt', content: imageAlt }, injectTo: 'head' as const },
          ] : []),
          ...(tw.creator ? [{ tag: 'meta' as const, attrs: { name: 'twitter:creator', content: tw.creator }, injectTo: 'head' as const }] : []),
          ...(tw.site ? [{ tag: 'meta' as const, attrs: { name: 'twitter:site', content: tw.site }, injectTo: 'head' as const }] : []),
          ...(canonicalUrl ? [{ tag: 'link' as const, attrs: { rel: 'canonical', href: canonicalUrl }, injectTo: 'head' as const }] : []),
          ...(seo.alternateUrls ? seo.alternateUrls.map((alt: { href: string; hreflang: string }) => ({ tag: 'link' as const, attrs: { rel: 'alternate', href: alt.href, hreflang: alt.hreflang }, injectTo: 'head' as const })) : []),
          { tag: 'link', attrs: { rel: 'sitemap', type: 'application/xml', href: '/sitemap.xml' }, injectTo: 'head' },
          ...(seo.googleSiteVerification ? [{ tag: 'meta' as const, attrs: { name: 'google-site-verification', content: seo.googleSiteVerification }, injectTo: 'head' as const }] : []),
        ];

        const name = config.real_name || config.name || '';
        const baseUrl = (defaults.url || '').replace(/\/$/, '');
        const websiteSchema = {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: `${name} — Portfolio`,
          url: baseUrl,
          description: `Personal portfolio of ${name}, ${config.title || ''}.`,
          author: { '@type': 'Person', name },
        };
        tags.push({
          tag: 'script',
          attrs: { type: 'application/ld+json' },
          children: JSON.stringify(websiteSchema, null, 4),
          injectTo: 'head',
        });

        return { html, tags };
      },
    },
  };
}

export default defineConfig({
  plugins: [seoInjectPlugin()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  preview: {
    port: 4173,
    open: true,
  },
  publicDir: 'public',
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
