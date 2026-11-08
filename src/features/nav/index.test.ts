import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from 'vitest';
import { CSS_CLASSES } from '../../lib/constants';
import { DOMUtils } from '../../lib/dom';
import { initNav } from './index';
import type { NavigationItem } from '../../types';

/**
 * src/test/setup.ts installs a `ResizeObserver` stand-in built from an arrow
 * function, which cannot be used with `new`. `initNav` ends by starting the
 * scroll spy, which constructs one, so the suite needs a real class here.
 */
class InertResizeObserver implements ResizeObserver {
  observe(): void {
    // The scroll spy only needs the constructor to succeed.
  }
  unobserve(): void {
    // No bookkeeping to undo.
  }
  disconnect(): void {
    // Nothing to tear down.
  }
}

function navItem(id: string, title: string, enabled = true): NavigationItem {
  return { id, title, icon: '', enabled };
}

/** The nav bar and its scroll targets, as index.html lays them out. */
function buildFixture(): void {
  document.body.innerHTML = `
    <header class="nav-container">
      <div class="nav-inner">
        <a class="nav-brand" href="#hero-section">
          <span class="brand-mark" aria-hidden="true"></span>
          <span class="brand-text"></span><span class="brand-cursor" aria-hidden="true">_</span>
        </a>
        <nav class="nav-menu" id="nav-menu" aria-label="Sections"></nav>
        <button class="nav-toggle" id="nav-toggle" type="button"
                aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="nav-menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>
    <main id="main">
      <section class="hero-section" id="hero-section"></section>
      <section class="content-section shell" id="timeline-section"></section>
      <section class="content-section shell" id="showcase-section"></section>
    </main>
  `;
}

function navButtons(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('#nav-menu .nav-item'));
}

function stubScrollIntoView(id: string): ReturnType<typeof vi.fn> {
  const spy = vi.fn();
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`fixture is missing #${id}`);
  }
  element.scrollIntoView = spy;
  return spy;
}

const navigation = [
  navItem('home', 'home'),
  navItem('timeline', 'timeline'),
  navItem('showcase', 'projects'),
  navItem('resume', 'resume'),
  navItem('contact', 'contact', false),
];

describe('initNav', () => {
  const originalObserver = globalThis.ResizeObserver;
  let scrollTo = vi.fn();

  beforeAll(() => {
    globalThis.ResizeObserver = InertResizeObserver;
  });

  afterAll(() => {
    globalThis.ResizeObserver = originalObserver;
  });

  beforeEach(() => {
    DOMUtils.clearCache();
    buildFixture();
    // jsdom does not implement scrolling; the spy is restored in afterEach.
    scrollTo = vi.fn();
    vi.spyOn(window, 'scrollTo').mockImplementation(scrollTo);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders one button per enabled nav entry, in order', () => {
    initNav({ navigation, onResume: vi.fn() });

    expect(navButtons().map(button => button.dataset.navId)).toEqual([
      'home',
      'timeline',
      'showcase',
      'resume',
    ]);
    expect(navButtons().map(button => button.textContent?.trim())).toEqual([
      'home',
      'timeline',
      'projects',
      'resume',
    ]);
  });

  it('renders the buttons as real buttons, with no icon glyph', () => {
    initNav({ navigation, onResume: vi.fn() });

    navButtons().forEach(button => {
      expect(button.tagName).toBe('BUTTON');
      expect(button.getAttribute('type')).toBe('button');
      expect(button.querySelectorAll('svg')).toHaveLength(0);
    });
  });

  it('hides the section behind a disabled nav entry', () => {
    initNav({ navigation, onResume: vi.fn() });

    expect(document.querySelector<HTMLElement>('#timeline-section')?.hidden).toBe(false);
    // `contact` is disabled but has no section; `timeline` stays visible.
    expect(document.querySelector('#contact-section')).toBeNull();
  });

  it('hides a section whose nav entry is switched off', () => {
    initNav({
      navigation: [navItem('home', 'home'), navItem('timeline', 'timeline', false)],
      onResume: vi.fn(),
    });

    expect(document.querySelector<HTMLElement>('#timeline-section')?.hidden).toBe(true);
    expect(navButtons().map(button => button.dataset.navId)).toEqual(['home']);
  });

  it('opens and closes the mobile menu from the toggle', () => {
    initNav({ navigation, onResume: vi.fn() });

    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('nav-menu');

    toggle?.click();
    expect(menu?.classList.contains(CSS_CLASSES.ACTIVE)).toBe(true);
    expect(toggle?.classList.contains(CSS_CLASSES.ACTIVE)).toBe(true);
    expect(toggle?.getAttribute('aria-expanded')).toBe('true');

    toggle?.click();
    expect(menu?.classList.contains(CSS_CLASSES.ACTIVE)).toBe(false);
    expect(toggle?.classList.contains(CSS_CLASSES.ACTIVE)).toBe(false);
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
  });

  it('scrolls to the section a nav button names', () => {
    const scrollIntoView = stubScrollIntoView('timeline-section');

    initNav({ navigation, onResume: vi.fn() });
    navButtons()
      .find(button => button.dataset.navId === 'timeline')
      ?.click();

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('maps the home button onto the hero section', () => {
    const scrollIntoView = stubScrollIntoView('hero-section');

    initNav({ navigation, onResume: vi.fn() });
    navButtons()
      .find(button => button.dataset.navId === 'home')
      ?.click();

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('calls onResume for the resume entry instead of scrolling', () => {
    const onResume = vi.fn();
    const heroScroll = stubScrollIntoView('hero-section');
    const timelineScroll = stubScrollIntoView('timeline-section');

    initNav({ navigation, onResume });
    navButtons()
      .find(button => button.dataset.navId === 'resume')
      ?.click();

    expect(onResume).toHaveBeenCalledTimes(1);
    expect(heroScroll).not.toHaveBeenCalled();
    expect(timelineScroll).not.toHaveBeenCalled();
  });

  it('closes the mobile menu after a nav button is used', () => {
    stubScrollIntoView('timeline-section');
    initNav({ navigation, onResume: vi.fn() });

    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('nav-menu');
    toggle?.click();
    expect(menu?.classList.contains(CSS_CLASSES.ACTIVE)).toBe(true);

    navButtons()
      .find(button => button.dataset.navId === 'timeline')
      ?.click();

    expect(menu?.classList.contains(CSS_CLASSES.ACTIVE)).toBe(false);
    expect(toggle?.classList.contains(CSS_CLASSES.ACTIVE)).toBe(false);
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
  });

  it('scrolls to the top from the brand without leaving a hash in the url', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');

    initNav({ navigation, onResume: vi.fn() });

    const brand = document.querySelector<HTMLAnchorElement>('.nav-brand');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    brand?.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(replaceState).toHaveBeenCalledWith(
      null,
      '',
      window.location.pathname + window.location.search
    );
  });

  it('returns early when the nav menu is missing', () => {
    document.body.innerHTML = '<main id="main"><section id="timeline-section"></section></main>';
    DOMUtils.clearCache();

    initNav({
      navigation: [navItem('timeline', 'timeline', false)],
      onResume: vi.fn(),
    });

    // No render, and no sections hidden either.
    expect(document.querySelectorAll('.nav-item')).toHaveLength(0);
    expect(document.querySelector<HTMLElement>('#timeline-section')?.hidden).toBe(false);
  });

  it('renders nothing when every entry is disabled', () => {
    initNav({
      navigation: [navItem('timeline', 'timeline', false), navItem('showcase', 'projects', false)],
      onResume: vi.fn(),
    });

    expect(navButtons()).toHaveLength(0);
    expect(document.querySelector<HTMLElement>('#timeline-section')?.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>('#showcase-section')?.hidden).toBe(true);
  });

  it('works without a toggle button', () => {
    document.getElementById('nav-toggle')?.remove();
    DOMUtils.clearCache();
    const scrollIntoView = stubScrollIntoView('timeline-section');

    initNav({ navigation, onResume: vi.fn() });
    navButtons()
      .find(button => button.dataset.navId === 'timeline')
      ?.click();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('escapes a nav title that contains markup', () => {
    initNav({
      navigation: [navItem('home', '<em>home</em>')],
      onResume: vi.fn(),
    });

    const button = navButtons()[0];
    expect(button?.querySelectorAll('em')).toHaveLength(0);
    expect(button?.textContent?.trim()).toBe('<em>home</em>');
  });
});
