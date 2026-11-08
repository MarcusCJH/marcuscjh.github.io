import { describe, it, expect, beforeEach } from 'vitest';
import { SELECTORS } from '../../lib/constants';
import { initSocials } from './index';
import type { SocialLink } from '../../types';

/** The social-links slot from the hero. */
function buildFixture(): void {
  document.body.innerHTML = `
    <div class="hero-secondary">
      <div class="social-links fade-in-up">
        <!-- Social links are loaded from data.json -->
      </div>
    </div>
  `;
}

const links: SocialLink[] = [
  { platform: 'GitHub', url: 'https://github.com/marcuscjh', icon: 'fab fa-github' },
  { name: 'LinkedIn', url: 'https://linkedin.com/in/marcuscjh', icon: 'fab fa-linkedin' },
  { url: 'https://example.com/plain', icon: 'fas fa-link' },
];

function anchors(): HTMLAnchorElement[] {
  return Array.from(document.querySelectorAll<HTMLAnchorElement>('.social-links .social-link'));
}

describe('initSocials', () => {
  beforeEach(() => {
    buildFixture();
  });

  it('renders one link per entry', () => {
    initSocials(links);

    expect(anchors()).toHaveLength(3);
  });

  it('labels a link by platform, then name, then falling back to the url', () => {
    initSocials(links);

    const labels = anchors().map(anchor => anchor.querySelector('span')?.textContent);
    expect(labels).toEqual(['GitHub', 'LinkedIn', 'https://example.com/plain']);
  });

  it('opens links in a new tab with a safe rel', () => {
    initSocials(links);

    const first = anchors()[0];
    expect(first?.getAttribute('href')).toBe('https://github.com/marcuscjh');
    expect(first?.getAttribute('target')).toBe('_blank');
    expect(first?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('appends a decorative arrow glyph to every link', () => {
    initSocials(links);

    anchors().forEach(anchor => {
      const svg = anchor.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('fills every container matching the shared selector', () => {
    document.body.innerHTML = `
      <div class="social-links"></div>
      <div class="social-links"></div>
    `;

    initSocials(links);

    document.querySelectorAll(SELECTORS.SOCIAL_LINKS).forEach(container => {
      expect(container.querySelectorAll('.social-link')).toHaveLength(3);
    });
  });

  it('clears the container when the list is empty', () => {
    initSocials(links);
    expect(anchors()).toHaveLength(3);

    initSocials([]);

    expect(anchors()).toHaveLength(0);
    expect(document.querySelector('.social-links')?.innerHTML).toBe('');
  });

  it('returns without throwing when no container exists', () => {
    document.body.innerHTML = '';

    expect(() => initSocials(links)).not.toThrow();
  });

  it('escapes a label that contains markup', () => {
    initSocials([{ platform: '<img src=x onerror=1>', url: 'https://example.com', icon: '' }]);

    const anchor = anchors()[0];
    expect(anchor?.querySelectorAll('img')).toHaveLength(0);
    expect(anchor?.querySelector('span')?.textContent).toBe('<img src=x onerror=1>');
  });
});
