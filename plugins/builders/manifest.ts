import type { SiteData, WebManifest } from '../types.ts';

/* The other builders fall back to `config.name` when `real_name` is absent;
   this one used a template literal, which stringified a missing `real_name`
   into the document as "undefined | <title>". */
function buildFallbackName(data: SiteData): string {
  return [data.config.real_name || data.config.name, data.config.title].filter(Boolean).join(' | ');
}

/** Build the web app manifest document from data.json. */
export function buildManifest(data: SiteData): WebManifest {
  return {
    name: data.seo.defaults?.title || buildFallbackName(data),
    short_name: data.config.name || '',
    description: data.seo.meta?.description || data.seo.defaults?.description || '',
    start_url: '/',
    display: 'standalone',
    background_color: data.seo.meta?.backgroundColor || '#0a0a0a',
    theme_color: data.seo.meta?.themeColor || '#00ff88',
    icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
  };
}

/** Serialise the manifest exactly as it is written to `dist/manifest.json`. */
export function renderManifest(data: SiteData): string {
  return JSON.stringify(buildManifest(data), null, 4);
}
