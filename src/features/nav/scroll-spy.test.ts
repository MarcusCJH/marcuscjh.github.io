import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from 'vitest';
import { APP_CONFIG, CSS_CLASSES, SELECTORS } from '../../lib/constants';
import { setupScrollSpy } from './scroll-spy';
import type { NavigationItem } from '../../types';

/**
 * src/test/setup.ts installs a `ResizeObserver` stand-in built from an arrow
 * function, which cannot be used with `new`. The scroll spy constructs one, so
 * the suite needs a real class here; it records its targets so the test can
 * check that the document is being re-measured.
 */
const resizeTargets: Element[] = [];

class RecordingResizeObserver implements ResizeObserver {
  private readonly callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element): void {
    resizeTargets.push(target);
  }

  unobserve(): void {
    // Nothing to undo: the test only records targets.
  }

  disconnect(): void {
    resizeTargets.length = 0;
  }

  /** Re-runs the callback as a real observer would when the page grows. */
  trigger(): void {
    this.callback([], this);
  }
}

function navItem(id: string, enabled = true): NavigationItem {
  return { id, title: id, icon: '', enabled };
}

/** Nav bar plus the three scroll targets of index.html. */
function buildFixture(ids: string[]): void {
  const items = ids
    .map(
      id => `<button class="nav-item" type="button" data-nav-id="${id}"><span>${id}</span></button>`
    )
    .join('');

  document.body.innerHTML = `
    <header class="nav-container">
      <div class="nav-inner">
        <nav class="nav-menu" id="nav-menu" aria-label="Sections">${items}</nav>
      </div>
    </header>
    <main id="main">
      <section class="hero-section" id="hero-section"></section>
      <section class="content-section shell" id="timeline-section"></section>
      <section class="content-section shell" id="showcase-section"></section>
    </main>
  `;

  // jsdom does no layout, so the bar's height has to be declared.
  const navContainer = document.querySelector<HTMLElement>(SELECTORS.NAV_CONTAINER);
  Object.defineProperty(navContainer, 'offsetHeight', { value: 64, configurable: true });
}

function rectWithTop(top: number): DOMRect {
  return {
    top,
    bottom: top + 600,
    left: 0,
    right: 1024,
    width: 1024,
    height: 600,
    x: 0,
    y: top,
    toJSON: () => ({}),
  };
}

/** Pretend the page is scrolled so that each section's top sits at `top`. */
function setSectionTops(tops: Record<string, number>): void {
  Object.entries(tops).forEach(([id, top]) => {
    const element = document.getElementById(id);
    if (element) {
      element.getBoundingClientRect = () => rectWithTop(top);
    }
  });
}

function setScroll(scrollY: number, scrollHeight = 5000): void {
  Object.defineProperty(window, 'scrollY', { value: scrollY, configurable: true });
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    value: scrollHeight,
    configurable: true,
  });
}

function activeNavIds(): string[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.nav-item'))
    .filter(item => item.classList.contains(CSS_CLASSES.ACTIVE))
    .map(item => item.dataset.navId ?? '');
}

function navContainerScrolled(): boolean {
  return (
    document.querySelector(SELECTORS.NAV_CONTAINER)?.classList.contains(CSS_CLASSES.SCROLLED) ??
    false
  );
}

const allSections = ['home', 'timeline', 'showcase'];

describe('setupScrollSpy', () => {
  const originalObserver = globalThis.ResizeObserver;

  beforeAll(() => {
    globalThis.ResizeObserver = RecordingResizeObserver;
  });

  afterAll(() => {
    globalThis.ResizeObserver = originalObserver;
  });

  beforeEach(() => {
    vi.useFakeTimers();
    resizeTargets.length = 0;
    buildFixture(allSections);
    // Everything below the bar: nothing has crossed the line yet.
    setSectionTops({ 'hero-section': 0, 'timeline-section': 900, 'showcase-section': 1800 });
    setScroll(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('marks the first section active on its initial measurement', () => {
    setupScrollSpy(allSections.map(id => navItem(id)));

    expect(activeNavIds()).toEqual(['home']);
  });

  it('maps the home entry onto the hero section', () => {
    // Only the hero has crossed the line, so `home` must be the match.
    setupScrollSpy([navItem('home')]);

    expect(activeNavIds()).toEqual(['home']);
  });

  it('picks the last section whose top has crossed the line under the bar', () => {
    // The line sits at 64 + 32 = 96. Timeline is above it, showcase is not.
    setSectionTops({ 'hero-section': -900, 'timeline-section': 40, 'showcase-section': 700 });
    setScroll(940);

    setupScrollSpy(allSections.map(id => navItem(id)));

    expect(activeNavIds()).toEqual(['timeline']);
  });

  it('does not promote a section that is only just below the line', () => {
    setSectionTops({ 'hero-section': -800, 'timeline-section': 97, 'showcase-section': 900 });
    setScroll(800);

    setupScrollSpy(allSections.map(id => navItem(id)));

    expect(activeNavIds()).toEqual(['home']);
  });

  it('marks the last section active at the very bottom of the page', () => {
    // Showcase never crosses the line, but the page cannot scroll further.
    setSectionTops({ 'hero-section': -4000, 'timeline-section': -3000, 'showcase-section': 400 });
    setScroll(4200, 5000);
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });

    setupScrollSpy(allSections.map(id => navItem(id)));

    expect(activeNavIds()).toEqual(['showcase']);
  });

  it('condenses the bar once the page has scrolled past the threshold', () => {
    setScroll(25);

    setupScrollSpy(allSections.map(id => navItem(id)));

    expect(navContainerScrolled()).toBe(true);
  });

  it('leaves the bar un-condensed at the top of the page', () => {
    setScroll(24);

    setupScrollSpy(allSections.map(id => navItem(id)));

    expect(navContainerScrolled()).toBe(false);
  });

  it('re-measures on a scroll event, after the debounce delay', () => {
    setupScrollSpy(allSections.map(id => navItem(id)));
    expect(activeNavIds()).toEqual(['home']);

    setSectionTops({ 'hero-section': -900, 'timeline-section': 40, 'showcase-section': 700 });
    setScroll(940);
    window.dispatchEvent(new Event('scroll'));

    // Nothing happens until the debounce window closes.
    expect(activeNavIds()).toEqual(['home']);
    vi.advanceTimersByTime(APP_CONFIG.DEBOUNCE_DELAY);
    expect(activeNavIds()).toEqual(['timeline']);
  });

  it('re-measures on resize and on load', () => {
    setupScrollSpy(allSections.map(id => navItem(id)));

    setScroll(500);
    window.dispatchEvent(new Event('resize'));
    vi.advanceTimersByTime(APP_CONFIG.DEBOUNCE_DELAY);
    expect(navContainerScrolled()).toBe(true);

    setScroll(0);
    window.dispatchEvent(new Event('load'));
    vi.advanceTimersByTime(APP_CONFIG.DEBOUNCE_DELAY);
    expect(navContainerScrolled()).toBe(false);
  });

  it('watches the document for height changes', () => {
    setupScrollSpy(allSections.map(id => navItem(id)));

    expect(resizeTargets).toEqual([document.body]);
  });

  it('skips a disabled nav entry entirely', () => {
    buildFixture(['home', 'showcase']);
    setSectionTops({ 'hero-section': -4000, 'timeline-section': -2000, 'showcase-section': 40 });
    setScroll(4100);

    setupScrollSpy([navItem('home'), navItem('timeline', false), navItem('showcase')]);

    expect(activeNavIds()).toEqual(['showcase']);
  });

  it('still condenses the bar when no section element resolves', () => {
    document.body.innerHTML = `
      <header class="nav-container"><div class="nav-inner"></div></header>
    `;
    setScroll(200);

    expect(() => setupScrollSpy([navItem('contact')])).not.toThrow();

    expect(navContainerScrolled()).toBe(true);
    expect(activeNavIds()).toEqual([]);
  });

  it('does not throw when the nav bar itself is missing', () => {
    document.body.innerHTML = '<main id="main"><section id="hero-section"></section></main>';
    setSectionTops({ 'hero-section': 0 });
    setScroll(0);

    expect(() => setupScrollSpy([navItem('home')])).not.toThrow();
  });
});
