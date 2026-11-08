/** URL helpers shared by the sitemap, JSON-LD and prerendered pages. */

/** Drop a single trailing slash so `${baseUrl}/...` never doubles up. */
export function normalizeBaseUrl(value: string): string {
  return value.replace(/\/$/, '');
}

/** Resolve a data.json asset reference (`./showcase/x.png`) against `baseUrl`. */
export function absoluteUrl(value: string, baseUrl: string): string {
  if (!value) {
    return '';
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return `${baseUrl}/${value.replace(/^\.\//, '').replace(/^\//, '')}`;
}

/** Turn a data.json asset reference into a site-root-relative path. */
export function rootAssetPath(value: string): string {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return `/${value.replace(/^\.\//, '').replace(/^\//, '')}`;
}
