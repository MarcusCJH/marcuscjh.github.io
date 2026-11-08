import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LoadingService } from './loadingService';
import { DOMUtils } from '@/lib/dom';
import { APP_CONFIG, DEFAULT_TEXT } from '@/lib/constants';

/* Counterpart to loadingService.test.ts, which stubs the DOM entirely. These
   tests run the service against real elements so the visible effects (bar
   width, counter, message, hidden/visible classes) are what is asserted. */

const FIXTURE = `
  <div id="loading-screen">
    <div class="loading-text"></div>
    <div class="loading-counter"></div>
    <div role="progressbar" aria-valuenow="0"><div id="loading-progress"></div></div>
  </div>
  <div class="main-container"></div>
`;

describe('LoadingService against a real DOM', () => {
  let service: LoadingService;

  const bar = (): HTMLElement => document.getElementById('loading-progress')!;
  const text = (): HTMLElement => document.querySelector<HTMLElement>('.loading-text')!;
  const counter = (): HTMLElement => document.querySelector<HTMLElement>('.loading-counter')!;
  const main = (): HTMLElement => document.querySelector<HTMLElement>('.main-container')!;

  beforeEach(() => {
    vi.useFakeTimers();
    DOMUtils.clearCache();
    document.body.innerHTML = FIXTURE;
    service = LoadingService.getInstance();
    service.setMessages(['one', 'two', 'three', 'four', 'five'], DEFAULT_TEXT.loadingReady);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    document.body.innerHTML = '';
    DOMUtils.clearCache();
  });

  describe('setMessages', () => {
    it('replaces the messages and shows the first at startLoading', () => {
      service.setMessages(['alpha', 'beta']);
      service.startLoading();
      expect(text().textContent).toBe('alpha');
      expect(service.getState().messages).toEqual(['alpha', 'beta']);
    });

    it('ignores an empty array and an undefined list', () => {
      service.setMessages([]);
      service.setMessages(undefined);
      expect(service.getState().messages).toEqual(['one', 'two', 'three', 'four', 'five']);
    });

    it('copies the array rather than aliasing it', () => {
      const messages = ['x', 'y'];
      service.setMessages(messages);
      messages.push('z');
      expect(service.getState().messages).toEqual(['x', 'y']);
    });

    it('replaces the ready message only when one is given', () => {
      service.setMessages(undefined, 'All set');
      service.completeLoading();
      expect(text().textContent).toBe('All set');

      service.setMessages(['one']);
      service.completeLoading();
      expect(text().textContent).toBe('All set');
    });
  });

  describe('hideMainContent', () => {
    it('hides the main container with a transition', () => {
      service.hideMainContent();
      expect(main().style.opacity).toBe('0');
      expect(main().style.visibility).toBe('hidden');
      expect(main().style.transition).toContain('opacity');
    });

    it('is a no-op when there is no main container', () => {
      document.body.innerHTML = '';
      expect(() => service.hideMainContent()).not.toThrow();
    });
  });

  describe('startLoading', () => {
    it('resets the counter and aria state, then ticks on the update interval', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      service.startLoading();
      expect(counter().textContent).toBe('00%');
      expect(service.getState().progress).toBe(0);

      vi.advanceTimersByTime(APP_CONFIG.LOADING_UPDATE_INTERVAL);
      // random 0 -> the minimum 8% increment
      expect(service.getState().progress).toBe(8);
      expect(bar().style.width).toBe('8%');
      expect(bar().parentElement?.getAttribute('aria-valuenow')).toBe('8');
      expect(counter().textContent).toBe('08%');
    });

    it('does nothing without a progress bar', () => {
      document.body.innerHTML = '<div class="loading-text"></div>';
      DOMUtils.clearCache();
      service.startLoading();
      expect(vi.getTimerCount()).toBe(0);
    });

    it('works without the text and counter elements', () => {
      document.body.innerHTML = '<div><div id="loading-progress"></div></div>';
      DOMUtils.clearCache();
      service.startLoading();
      expect(() => vi.advanceTimersByTime(APP_CONFIG.LOADING_UPDATE_INTERVAL)).not.toThrow();
      expect(bar().style.width).not.toBe('');
    });

    it('starts from a blank message when the list is empty', () => {
      const internals = service as unknown as { state: { messages: string[] } };
      internals.state.messages = [];
      service.startLoading();
      expect(text().textContent).toBe('');
      vi.advanceTimersByTime(500);
      expect(text().textContent).toBe('');
    });

    it('advances through the messages as progress grows', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.999);
      service.startLoading();
      const seen = new Set<string>();
      for (let tick = 0; tick < 10; tick += 1) {
        vi.advanceTimersByTime(APP_CONFIG.LOADING_UPDATE_INTERVAL);
        seen.add(text().textContent ?? '');
      }
      expect(seen.has('one')).toBe(false);
      expect(text().textContent).toBe('five');
    });

    it('caps at 95% and stops its own interval', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.999);
      service.startLoading();
      vi.advanceTimersByTime(APP_CONFIG.LOADING_UPDATE_INTERVAL * 20);
      expect(service.getState().progress).toBe(95);
      expect(bar().style.width).toBe('95%');
      expect(counter().textContent).toBe('95%');
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('completeLoading', () => {
    it('fills the bar and counter, shows the ready message and reveals the page in two beats', () => {
      service.hideMainContent();
      service.completeLoading();

      expect(service.getState().progress).toBe(100);
      expect(bar().style.width).toBe('100%');
      expect(bar().parentElement?.getAttribute('aria-valuenow')).toBe('100');
      expect(counter().textContent).toBe('100%');
      expect(text().textContent).toBe(DEFAULT_TEXT.loadingReady);

      const screen = document.getElementById('loading-screen')!;
      expect(screen.classList.contains('hidden')).toBe(false);
      vi.advanceTimersByTime(180);
      expect(screen.classList.contains('hidden')).toBe(true);
      expect(main().style.opacity).toBe('0');
      vi.advanceTimersByTime(160);
      expect(main().style.opacity).toBe('1');
      expect(main().style.visibility).toBe('visible');
    });

    it('tolerates a page with none of the loading elements', () => {
      document.body.innerHTML = '';
      DOMUtils.clearCache();
      expect(() => {
        service.completeLoading();
        vi.advanceTimersByTime(1000);
      }).not.toThrow();
      expect(service.getState().progress).toBe(100);
    });

    it('still reveals the main container when the loading screen is absent', () => {
      document.getElementById('loading-screen')?.remove();
      DOMUtils.clearCache();
      document.body.insertAdjacentHTML('beforeend', '<div id="loading-progress"></div>');
      service.completeLoading();
      vi.advanceTimersByTime(340);
      expect(main().style.opacity).toBe('1');
    });
  });

  describe('getState', () => {
    it('returns a snapshot, so mutating it does not change the service', () => {
      const snapshot = service.getState();
      snapshot.progress = 55;
      expect(service.getState().progress).not.toBe(55);
    });
  });
});
