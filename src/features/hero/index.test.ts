import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DOMUtils } from '../../lib/dom';
import { initHero, initTypedIntro } from './index';
import type { Config } from '../../types';

/** The hero slice of index.html, plus the brand marks that repeat its copy. */
function buildFixture(): void {
  document.body.innerHTML = `
    <header class="nav-container">
      <a class="nav-brand" href="#hero-section">
        <span class="brand-text"></span>
      </a>
    </header>
    <section class="hero-section" id="hero-section">
      <p class="eyebrow hero-handle"><span class="hero-handle-text"></span></p>
      <h1 class="hero-title"></h1>
      <div class="hero-role">
        <p class="hero-role-title"></p>
        <p class="hero-role-sub"></p>
      </div>
      <p class="terminal-line">
        <span class="typed-text" id="typed-text"></span>
      </p>
      <p class="hero-lead"></p>
      <button class="scroll-arrow" type="button" aria-label="Scroll to timeline">scroll</button>
    </section>
    <section class="content-section shell" id="timeline-section"></section>
    <div class="loading-screen" id="loading-screen">
      <p class="loading-logo"></p>
    </div>
  `;
}

const baseConfig: Config = {
  name: 'marcuscjh',
  title: 'Software Engineer',
  subtitle: 'Cloud & platform',
  typedMessages: [],
};

/**
 * `matchMedia` is a writable stand-in installed by src/test/setup.ts, so a
 * test can swap in one that reports a different preference and put the
 * original back afterwards.
 */
function stubReducedMotion(matches: boolean): void {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });
}

describe('hero', () => {
  beforeEach(() => {
    DOMUtils.clearCache();
    buildFixture();
  });

  afterEach(() => {
    // Back to the suite-wide default: no motion preference expressed.
    stubReducedMotion(false);
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('initTypedIntro', () => {
    it('writes only the first message when reduced motion is requested', () => {
      stubReducedMotion(true);

      initTypedIntro(['first message', 'second message']);

      expect(document.getElementById('typed-text')?.textContent).toBe('first message');
    });

    it('does not start a typing loop under reduced motion', () => {
      stubReducedMotion(true);
      vi.useFakeTimers();

      initTypedIntro(['first message']);
      // A running TypedText would keep rewriting the element on every tick.
      vi.advanceTimersByTime(5000);

      expect(document.getElementById('typed-text')?.textContent).toBe('first message');
    });

    it('does not throw under reduced motion when the slot is missing', () => {
      stubReducedMotion(true);
      document.body.innerHTML = '';
      DOMUtils.clearCache();

      expect(() => initTypedIntro(['first message'])).not.toThrow();
    });

    it('types the message out one character at a time otherwise', () => {
      stubReducedMotion(false);
      vi.useFakeTimers();

      initTypedIntro(['hey']);

      const typed = document.getElementById('typed-text');
      expect(typed?.textContent).toBe('h');
      vi.advanceTimersByTime(100);
      expect(typed?.textContent).toBe('he');
      vi.advanceTimersByTime(100);
      expect(typed?.textContent).toBe('hey');
    });

    it('does nothing when there are no messages', () => {
      stubReducedMotion(false);
      vi.useFakeTimers();

      initTypedIntro([]);
      initTypedIntro();
      vi.advanceTimersByTime(1000);

      expect(document.getElementById('typed-text')?.textContent).toBe('');
    });
  });

  describe('initHero', () => {
    it('writes the handle into every brand mark', () => {
      initHero(baseConfig);

      expect(document.querySelector('.brand-text')?.textContent).toBe('marcuscjh');
      expect(document.querySelector('.loading-logo')?.textContent).toBe('marcuscjh');
      expect(document.querySelector('.hero-handle-text')?.textContent).toBe('marcuscjh');
    });

    it('prefers the real name for the hero title', () => {
      initHero({ ...baseConfig, real_name: 'Marcus Chan' });

      expect(document.querySelector('.hero-title')?.textContent).toBe('Marcus Chan');
      // The handle still drives the brand marks.
      expect(document.querySelector('.brand-text')?.textContent).toBe('marcuscjh');
    });

    it('falls back to the handle for the hero title', () => {
      initHero(baseConfig);

      expect(document.querySelector('.hero-title')?.textContent).toBe('marcuscjh');
    });

    it('writes the role, sub-role and lead paragraph', () => {
      initHero({ ...baseConfig, summary: 'I build things.' });

      expect(document.querySelector('.hero-role-title')?.textContent).toBe('Software Engineer');
      expect(document.querySelector('.hero-role-sub')?.textContent).toBe('Cloud & platform');
      expect(document.querySelector('.hero-lead')?.textContent).toBe('I build things.');
    });

    it('leaves the lead empty when no summary is configured', () => {
      initHero(baseConfig);

      expect(document.querySelector('.hero-lead')?.textContent).toBe('');
    });

    it('scrolls to the timeline when the scroll cue is clicked', () => {
      const scrollIntoView = vi.fn();
      const timeline = document.getElementById('timeline-section');
      expect(timeline).not.toBeNull();
      timeline!.scrollIntoView = scrollIntoView;

      initHero(baseConfig);
      document.querySelector<HTMLElement>('.scroll-arrow')?.click();

      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('does not throw when the scroll target is gone', () => {
      initHero(baseConfig);
      document.getElementById('timeline-section')?.remove();

      expect(() => document.querySelector<HTMLElement>('.scroll-arrow')?.click()).not.toThrow();
    });

    it('does not throw when the hero markup is absent', () => {
      document.body.innerHTML = '';

      expect(() => initHero(baseConfig)).not.toThrow();
    });
  });
});
