import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DOMUtils } from '../../lib/dom';
import { initFooter } from './index';
import type { Config } from '../../types';

/** The footer slice of index.html. */
function buildFixture(): void {
  document.body.innerHTML = `
    <footer class="site-footer">
      <div class="site-footer-inner shell">
        <span id="footer-brand"></span>
        <span id="footer-meta"></span>
      </div>
    </footer>
  `;
}

const baseConfig: Config = {
  name: 'marcuscjh',
  title: 'Engineer',
  subtitle: 'Cloud',
  typedMessages: [],
};

describe('initFooter', () => {
  beforeEach(() => {
    DOMUtils.clearCache();
    buildFixture();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('prefers the real name over the handle in the brand line', () => {
    initFooter({ ...baseConfig, real_name: 'Marcus Chan' });

    expect(document.getElementById('footer-brand')?.textContent).toBe(
      `Marcus Chan — ${new Date().getFullYear()}`
    );
  });

  it('falls back to the handle when no real name is configured', () => {
    initFooter(baseConfig);

    expect(document.getElementById('footer-brand')?.textContent).toBe(
      `marcuscjh — ${new Date().getFullYear()}`
    );
  });

  it('stamps the current year, not a hardcoded one', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2031-06-15T00:00:00Z'));

    initFooter(baseConfig);

    expect(document.getElementById('footer-brand')?.textContent).toBe('marcuscjh — 2031');
  });

  it('renders the email as a mailto link', () => {
    initFooter({ ...baseConfig, email: 'hello@example.com' });

    const link = document.querySelector<HTMLAnchorElement>('#footer-meta a');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toBe('mailto:hello@example.com');
    expect(link?.textContent).toBe('hello@example.com');
  });

  it('leaves the meta slot empty when no email is configured', () => {
    initFooter(baseConfig);

    expect(document.getElementById('footer-meta')?.innerHTML).toBe('');
  });

  it('escapes an email that contains markup characters', () => {
    initFooter({ ...baseConfig, email: 'a"<b>@example.com' });

    const meta = document.getElementById('footer-meta');
    expect(meta?.querySelectorAll('b')).toHaveLength(0);
    expect(meta?.querySelector('a')?.textContent).toBe('a"<b>@example.com');
  });

  it('does not throw when the footer slots are absent', () => {
    document.body.innerHTML = '';
    DOMUtils.clearCache();

    expect(() => initFooter({ ...baseConfig, email: 'hello@example.com' })).not.toThrow();
  });
});
