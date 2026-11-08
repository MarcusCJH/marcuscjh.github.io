import { describe, it, expect } from 'vitest';
import { escapeHtml, markup, setHtml, unsafeHtml } from './html';

describe('escapeHtml', () => {
  it('escapes the five markup-significant characters', () => {
    expect(escapeHtml(`& < > " '`)).toBe('&amp; &lt; &gt; &quot; &#39;');
  });

  it('escapes ampersands before the other entities', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  it('leaves text without special characters untouched', () => {
    expect(escapeHtml('Marcus Chan — Engineer')).toBe('Marcus Chan — Engineer');
  });
});

describe('markup', () => {
  it('escapes interpolated strings', () => {
    const value = `Tom & Jerry's <script>"x"</script>`;
    expect(markup`<p>${value}</p>`.toString()).toBe(
      '<p>Tom &amp; Jerry&#39;s &lt;script&gt;&quot;x&quot;&lt;/script&gt;</p>'
    );
  });

  it('escapes values inside quoted attributes', () => {
    expect(markup`<a title="${'a" onclick="evil()'}"></a>`.toString()).toBe(
      '<a title="a&quot; onclick=&quot;evil()"></a>'
    );
  });

  it('keeps a static template with no values intact', () => {
    expect(markup`<br>`.toString()).toBe('<br>');
  });

  it('does not double-escape a nested html fragment', () => {
    const inner = markup`<span>${'a & b'}</span>`;
    expect(markup`<div>${inner}</div>`.toString()).toBe('<div><span>a &amp; b</span></div>');
  });

  it('concatenates arrays of fragments with no separator', () => {
    const items = ['a & b', '<c>'].map(item => markup`<li>${item}</li>`);
    expect(markup`<ul>${items}</ul>`.toString()).toBe(
      '<ul><li>a &amp; b</li><li>&lt;c&gt;</li></ul>'
    );
  });

  it('escapes arrays of plain strings and flattens nested arrays', () => {
    expect(markup`<p>${['<a>', ['&', markup`<b></b>`]]}</p>`.toString()).toBe(
      '<p>&lt;a&gt;&amp;<b></b></p>'
    );
  });

  it('renders an empty array as nothing', () => {
    expect(markup`<ul>${[]}</ul>`.toString()).toBe('<ul></ul>');
  });

  it('renders null and undefined as an empty string', () => {
    expect(markup`<p>${null}|${undefined}</p>`.toString()).toBe('<p>|</p>');
  });

  it('stringifies numbers, including zero', () => {
    expect(markup`<i style="--item-index: ${0}">${42}</i>`.toString()).toBe(
      '<i style="--item-index: 0">42</i>'
    );
  });

  it('stringifies booleans so aria attributes keep their value', () => {
    expect(markup`<button aria-pressed="${false}" hidden="${true}"></button>`.toString()).toBe(
      '<button aria-pressed="false" hidden="true"></button>'
    );
  });
});

describe('unsafeHtml', () => {
  it('splices trusted markup in without escaping', () => {
    expect(markup`<span>${unsafeHtml('<svg aria-hidden="true"></svg>')}</span>`.toString()).toBe(
      '<span><svg aria-hidden="true"></svg></span>'
    );
  });
});

describe('setHtml', () => {
  it('writes a fragment to an element', () => {
    const element = document.createElement('div');
    setHtml(element, markup`<p>${'a & b'}</p>`);
    expect(element.innerHTML).toBe('<p>a &amp; b</p>');
    expect(element.querySelector('p')?.textContent).toBe('a & b');
  });

  it('escapes a bare string rather than parsing it as markup', () => {
    const element = document.createElement('div');
    setHtml(element, '<em>nope</em>');
    expect(element.querySelector('em')).toBeNull();
    expect(element.textContent).toBe('<em>nope</em>');
  });
});

describe('markup with a hand-built strings array', () => {
  it('tolerates a strings array shorter than the values', () => {
    const strings = Object.assign([], { raw: [] }) as unknown as TemplateStringsArray;
    expect(markup(strings, '<b>', 1).toString()).toBe('&lt;b&gt;1');
  });
});
