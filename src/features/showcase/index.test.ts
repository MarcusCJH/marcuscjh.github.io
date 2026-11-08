import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { DOMUtils } from '../../lib/dom';
import { initShowcase } from './index';
import type { ShowcaseProject } from '../../types';

/** The projects grid of index.html. */
function buildFixture(): void {
  document.body.innerHTML = `
    <section class="content-section shell" id="showcase-section">
      <header class="section-header">
        <h2 class="section-title">projects</h2>
      </header>
      <div class="showcase-grid" id="showcase-grid">
        <!-- Projects are loaded from data.json -->
      </div>
    </section>
  `;
}

function project(id: string, overrides: Partial<ShowcaseProject> = {}): ShowcaseProject {
  return {
    id,
    title: `Project ${id}`,
    backgroundImage: `/images/${id}.png`,
    ...overrides,
  };
}

function cards(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('#showcase-grid [data-showcase-item]'));
}

describe('initShowcase', () => {
  /**
   * The cards render a real <a href> to the project page; jsdom logs an
   * unimplemented-navigation error if a click reaches its default action, so
   * a capture-phase listener cancels it before the card's own handlers run.
   */
  const cancelNavigation = (event: Event): void => {
    event.preventDefault();
  };

  beforeAll(() => {
    document.addEventListener('click', cancelNavigation, true);
  });

  afterAll(() => {
    document.removeEventListener('click', cancelNavigation, true);
  });

  beforeEach(() => {
    DOMUtils.clearCache();
    buildFixture();
  });

  it('renders one card per project', () => {
    initShowcase({ projects: [project('a'), project('b')], onOpenProject: vi.fn() });

    expect(cards()).toHaveLength(2);
    expect(cards().map(card => card.dataset.projectId)).toEqual(['a', 'b']);
  });

  it('makes each card an activatable control with an accessible name', () => {
    initShowcase({ projects: [project('a')], onOpenProject: vi.fn() });

    const card = cards()[0];
    expect(card?.tagName).toBe('ARTICLE');
    expect(card?.getAttribute('role')).toBe('button');
    expect(card?.getAttribute('tabindex')).toBe('0');
    expect(card?.getAttribute('aria-label')).toBe('View project: Project a');
  });

  it('renders the preview as an <img> with the project title in its alt text', () => {
    initShowcase({ projects: [project('a')], onOpenProject: vi.fn() });

    const image = document.querySelector<HTMLImageElement>('.showcase-media');
    expect(image?.getAttribute('src')).toBe('/images/a.png');
    expect(image?.getAttribute('alt')).toBe('Project a project preview');
    expect(image?.getAttribute('decoding')).toBe('async');
  });

  it('loads the first three previews eagerly and the rest lazily', () => {
    const projects = ['a', 'b', 'c', 'd'].map(id => project(id));

    initShowcase({ projects, onOpenProject: vi.fn() });

    const images = Array.from(document.querySelectorAll<HTMLImageElement>('.showcase-media'));
    expect(images.map(image => image.getAttribute('loading'))).toEqual([
      'eager',
      'eager',
      'eager',
      'lazy',
    ]);
    expect(images.map(image => image.getAttribute('fetchpriority'))).toEqual([
      'high',
      'high',
      'high',
      'auto',
    ]);
  });

  it('omits the <img> for a project with no background image', () => {
    initShowcase({ projects: [project('a', { backgroundImage: '' })], onOpenProject: vi.fn() });

    expect(document.querySelectorAll('.showcase-media')).toHaveLength(0);
    // The overlay and index markers stay, so the card still has its frame.
    expect(document.querySelectorAll('.showcase-overlay')).toHaveLength(1);
  });

  it('renders a badge per technology', () => {
    initShowcase({
      projects: [project('a', { technologies: ['TypeScript', 'Vite'] })],
      onOpenProject: vi.fn(),
    });

    const badges = Array.from(document.querySelectorAll('.tech-badge'));
    expect(badges.map(badge => badge.textContent)).toEqual(['TypeScript', 'Vite']);
  });

  it('omits the tech stack when the list is absent or empty', () => {
    initShowcase({
      projects: [project('a'), project('b', { technologies: [] })],
      onOpenProject: vi.fn(),
    });

    expect(document.querySelectorAll('.tech-stack')).toHaveLength(0);
  });

  it('links the title to the project page with an encoded id', () => {
    initShowcase({ projects: [project('a b/c')], onOpenProject: vi.fn() });

    const link = document.querySelector<HTMLAnchorElement>('.showcase-title a');
    expect(link?.getAttribute('href')).toBe('/projects/a%20b%2Fc/');
    expect(link?.textContent).toBe('Project a b/c');
  });

  it('opens the project when a card is clicked', () => {
    const onOpenProject = vi.fn();
    const projects = [project('a'), project('b')];

    initShowcase({ projects, onOpenProject });
    cards()[1]?.click();

    expect(onOpenProject).toHaveBeenCalledTimes(1);
    expect(onOpenProject).toHaveBeenCalledWith(projects[1]);
  });

  it('opens the project from the keyboard with Enter and Space', () => {
    const onOpenProject = vi.fn();
    const projects = [project('a')];

    initShowcase({ projects, onOpenProject });

    const card = cards()[0];
    ['Enter', ' '].forEach(key => {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      card?.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    });

    expect(onOpenProject).toHaveBeenCalledTimes(2);
  });

  it('ignores an unrelated key', () => {
    const onOpenProject = vi.fn();

    initShowcase({ projects: [project('a')], onOpenProject });
    cards()[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));

    expect(onOpenProject).not.toHaveBeenCalled();
  });

  it('lets the title link navigate instead of opening the dialog', () => {
    const onOpenProject = vi.fn();

    initShowcase({ projects: [project('a')], onOpenProject });
    document.querySelector<HTMLAnchorElement>('.showcase-title a')?.click();

    expect(onOpenProject).not.toHaveBeenCalled();
  });

  it('lets a keyboard activation of the title link through as well', () => {
    const onOpenProject = vi.fn();

    initShowcase({ projects: [project('a')], onOpenProject });
    document
      .querySelector<HTMLAnchorElement>('.showcase-title a')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(onOpenProject).not.toHaveBeenCalled();
  });

  it('renders an empty grid for an empty project list', () => {
    initShowcase({ projects: [], onOpenProject: vi.fn() });

    expect(cards()).toHaveLength(0);
    expect(document.getElementById('showcase-grid')?.innerHTML).toBe('');
  });

  it('returns early when the grid is missing', () => {
    document.body.innerHTML = '';
    DOMUtils.clearCache();

    expect(() => initShowcase({ projects: [project('a')], onOpenProject: vi.fn() })).not.toThrow();
  });

  it('escapes a project title that contains markup', () => {
    initShowcase({
      projects: [project('a', { title: '<img src=x onerror=1>' })],
      onOpenProject: vi.fn(),
    });

    const card = cards()[0];
    expect(card?.querySelectorAll('img')).toHaveLength(1); // only the preview
    expect(card?.getAttribute('aria-label')).toBe('View project: <img src=x onerror=1>');
    expect(document.querySelector('.showcase-title a')?.textContent).toBe('<img src=x onerror=1>');
  });
});
