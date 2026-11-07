/**
 * Inline SVG icon set.
 *
 * Replaces the Font Awesome CDN stylesheet: an icon font is a render-blocking
 * third-party request, ships thousands of unused glyphs, and renders as text
 * (so it inherits text antialiasing and can flash as a tofu box before load).
 * These are hand-authored 24x24 stroke paths drawn on the same grid, so they
 * stay optically consistent at the sizes this site uses.
 *
 * Keys are the Font Awesome class strings already stored in `data.json`, so
 * content does not need to change. `icon()` also accepts a bare name.
 */

const STROKE_PATHS: Record<string, string> = {
  'arrow-up-right': '<path d="M7.5 16.5 16.5 7.5"/><path d="M8.5 7.5h8v8"/>',
  'map-marker-alt':
    '<path d="M19.5 10.5c0 5.6-7.5 11-7.5 11s-7.5-5.4-7.5-11a7.5 7.5 0 0 1 15 0Z"/><circle cx="12" cy="10.3" r="2.6"/>',
  times: '<path d="M17.5 6.5 6.5 17.5"/><path d="m6.5 6.5 11 11"/>',
  trophy:
    '<path d="M7 5.5H4.8a2.3 2.3 0 0 0 0 4.6H7.4"/><path d="M17 5.5h2.2a2.3 2.3 0 0 1 0 4.6h-2.6"/><path d="M5 21.5h14"/><path d="M12 15.5v6"/><path d="M17 2.5H7v7a5 5 0 0 0 10 0Z"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20.5 20.5-4.8-4.8"/>',
  code: '<path d="m15.5 17.5 5.5-5.5-5.5-5.5"/><path d="M8.5 6.5 3 12l5.5 5.5"/>',
  'external-link-alt':
    '<path d="M14.5 3.5h6v6"/><path d="M20.5 3.5 11 13"/><path d="M18 14v5.5a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 19.5V7.5A1.5 1.5 0 0 1 4.5 6H10"/>',
};

/** Font Awesome class name -> local key, for names that differ. */
const FA_ALIASES: Record<string, string> = {
  close: 'times',
  xmark: 'times',
  'magnifying-glass': 'search',
  'external-link': 'external-link-alt',
  'map-marker': 'map-marker-alt',
};

/**
 * Reduce any accepted icon reference to a key in STROKE_PATHS.
 * Accepts `"fas fa-briefcase"`, `"fa-briefcase"` or `"briefcase"`.
 */
export function normalizeIconName(reference: string): string {
  const raw = (reference || '')
    .trim()
    .split(/\s+/)
    .map(token => token.replace(/^fa-/, ''))
    .filter(token => !['fa', 'fas', 'far', 'fab', 'fal', 'fad', 'solid', 'brands'].includes(token))
    .pop();

  const name = raw ?? '';
  return FA_ALIASES[name] ?? name;
}

export interface IconOptions {
  /** Rendered box in px. Defaults to 1em so the icon tracks its text. */
  size?: number | string;
  /** Extra class on the <svg>. */
  className?: string;
  /**
   * Accessible name. Omit for decorative icons — they are then marked
   * aria-hidden, which is what nearly every icon on this site wants, since
   * each one sits next to a visible text label.
   */
  label?: string;
}

/**
 * Render an inline SVG icon. Returns '' for an unknown name rather than a
 * placeholder box, so a typo degrades to "no icon" instead of visible noise.
 */
export function icon(reference: string, options: IconOptions = {}): string {
  const name = normalizeIconName(reference);
  const body = STROKE_PATHS[name];
  if (!body) {
    return '';
  }

  const size = options.size ?? '1em';
  const dimension = typeof size === 'number' ? `${size}` : size;
  const classAttr = options.className ? ` class="${options.className}"` : '';
  const a11y = options.label
    ? ` role="img" aria-label="${options.label}"`
    : ' aria-hidden="true" focusable="false"';

  return (
    `<svg${classAttr} width="${dimension}" height="${dimension}" viewBox="0 0 24 24" ` +
    `fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" ` +
    `stroke-linejoin="round"${a11y}>${body}</svg>`
  );
}
