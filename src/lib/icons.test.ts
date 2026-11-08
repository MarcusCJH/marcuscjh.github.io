import { describe, it, expect } from 'vitest';
import { icon, normalizeIconName } from './icons';

describe('normalizeIconName', () => {
  it('strips style prefixes and the fa- marker', () => {
    expect(normalizeIconName('fas fa-search')).toBe('search');
    expect(normalizeIconName('fab fa-code')).toBe('code');
    expect(normalizeIconName('fa-trophy')).toBe('trophy');
    expect(normalizeIconName('trophy')).toBe('trophy');
  });

  it('resolves aliases to their canonical key', () => {
    expect(normalizeIconName('close')).toBe('times');
    expect(normalizeIconName('fas fa-xmark')).toBe('times');
    expect(normalizeIconName('magnifying-glass')).toBe('search');
    expect(normalizeIconName('external-link')).toBe('external-link-alt');
    expect(normalizeIconName('map-marker')).toBe('map-marker-alt');
  });

  it('returns an empty string for empty or prefix-only input', () => {
    expect(normalizeIconName('')).toBe('');
    expect(normalizeIconName('   ')).toBe('');
    expect(normalizeIconName('fas')).toBe('');
  });

  it('keeps unknown names as-is', () => {
    expect(normalizeIconName('fas fa-briefcase')).toBe('briefcase');
  });
});

describe('icon', () => {
  const known = [
    'arrow-up-right',
    'map-marker-alt',
    'times',
    'trophy',
    'search',
    'code',
    'external-link-alt',
  ];

  it.each(known)('renders an svg for %s', name => {
    const svg = icon(name);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.endsWith('</svg>')).toBe(true);
    expect(svg).toContain('viewBox="0 0 24 24"');
  });

  it('renders the same icon for a Font Awesome class string and its alias', () => {
    expect(icon('fas fa-search')).toBe(icon('search'));
    expect(icon('close')).toBe(icon('times'));
  });

  it('returns an empty string for unknown or empty references', () => {
    expect(icon('fas fa-nope')).toBe('');
    expect(icon('')).toBe('');
  });

  it('defaults to 1em and aria-hidden for decorative icons', () => {
    const svg = icon('code');
    expect(svg).toContain('width="1em" height="1em"');
    expect(svg).toContain('aria-hidden="true" focusable="false"');
    expect(svg).not.toContain('role="img"');
    expect(svg).not.toContain(' class=');
  });

  it('accepts a numeric size, a string size and a class name', () => {
    expect(icon('code', { size: 18 })).toContain('width="18" height="18"');
    expect(icon('code', { size: '2rem' })).toContain('width="2rem" height="2rem"');
    expect(icon('code', { className: 'ico' })).toContain('<svg class="ico" ');
  });

  it('exposes a label as an accessible name instead of aria-hidden', () => {
    const svg = icon('code', { label: 'Source' });
    expect(svg).toContain('role="img" aria-label="Source"');
    expect(svg).not.toContain('aria-hidden');
  });

  it('produces markup that parses as a single svg element', () => {
    const host = document.createElement('div');
    host.innerHTML = icon('trophy');
    expect(host.children).toHaveLength(1);
    expect(host.firstElementChild?.tagName.toLowerCase()).toBe('svg');
    expect(host.querySelectorAll('path').length).toBeGreaterThan(0);
  });
});
