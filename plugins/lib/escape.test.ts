import { describe, expect, it } from 'vitest';
import { escapeHtml, escapeXml, safeJsonLd } from './escape.ts';

describe('escapeXml', () => {
  it('escapes &, <, > and " but leaves apostrophes alone', () => {
    expect(escapeXml(`Tom & "Jerry" <b>'quoted'</b>`)).toBe(
      `Tom &amp; &quot;Jerry&quot; &lt;b&gt;'quoted'&lt;/b&gt;`
    );
  });

  it('escapes ampersands before the entities it introduces', () => {
    expect(escapeXml('a & b < c')).toBe('a &amp; b &lt; c');
    expect(escapeXml('&amp;')).toBe('&amp;amp;');
  });

  it('returns plain text unchanged', () => {
    expect(escapeXml('https://example.com/projects/alpha/')).toBe(
      'https://example.com/projects/alpha/'
    );
    expect(escapeXml('')).toBe('');
  });
});

describe('escapeHtml', () => {
  it('escapes &, <, >, " and apostrophes', () => {
    expect(escapeHtml(`Tom & "Jerry" <b>'quoted'</b>`)).toBe(
      `Tom &amp; &quot;Jerry&quot; &lt;b&gt;&#39;quoted&#39;&lt;/b&gt;`
    );
  });

  it('is safe for a single-quoted-free attribute value', () => {
    expect(escapeHtml(`O'Hara & Sons`)).toBe('O&#39;Hara &amp; Sons');
  });
});

describe('safeJsonLd', () => {
  it('serialises compactly and neutralises < so a script cannot be closed early', () => {
    expect(safeJsonLd({ '@type': 'Person', name: '</script><img src=x>' })).toBe(
      '{"@type":"Person","name":"\\u003c/script>\\u003cimg src=x>"}'
    );
  });

  it('keeps key insertion order', () => {
    expect(safeJsonLd({ b: 1, a: 2 })).toBe('{"b":1,"a":2}');
  });
});
