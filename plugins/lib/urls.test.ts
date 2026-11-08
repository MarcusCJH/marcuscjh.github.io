import { describe, expect, it } from 'vitest';
import { absoluteUrl, normalizeBaseUrl, rootAssetPath } from './urls.ts';
import { truncateDescription } from './text.ts';

describe('normalizeBaseUrl', () => {
  it('strips a single trailing slash', () => {
    expect(normalizeBaseUrl('https://example.com/')).toBe('https://example.com');
    expect(normalizeBaseUrl('https://example.com')).toBe('https://example.com');
    expect(normalizeBaseUrl('')).toBe('');
  });
});

describe('absoluteUrl', () => {
  it('resolves relative data.json paths against the base url', () => {
    expect(absoluteUrl('./showcase/a.png', 'https://example.com')).toBe(
      'https://example.com/showcase/a.png'
    );
    expect(absoluteUrl('/showcase/a.png', 'https://example.com')).toBe(
      'https://example.com/showcase/a.png'
    );
  });

  it('passes absolute urls through and maps empty input to an empty string', () => {
    expect(absoluteUrl('https://cdn.example.com/a.png', 'https://example.com')).toBe(
      'https://cdn.example.com/a.png'
    );
    expect(absoluteUrl('', 'https://example.com')).toBe('');
  });
});

describe('rootAssetPath', () => {
  it('rewrites relative paths as site-root paths', () => {
    expect(rootAssetPath('./showcase/a.png')).toBe('/showcase/a.png');
    expect(rootAssetPath('showcase/a.png')).toBe('/showcase/a.png');
    expect(rootAssetPath('/showcase/a.png')).toBe('/showcase/a.png');
  });

  it('leaves remote urls untouched', () => {
    expect(rootAssetPath('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
  });
});

describe('truncateDescription', () => {
  it('returns short values unchanged', () => {
    expect(truncateDescription('short description')).toBe('short description');
  });

  it('cuts at the last word boundary and appends an ellipsis', () => {
    const value = `${'word '.repeat(40)}end`;
    const result = truncateDescription(value);
    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(159);
    expect(result).not.toContain(' …');
  });

  it('honours a custom max length', () => {
    expect(truncateDescription('alpha beta gamma', 10)).toBe('alpha beta…');
  });
});
