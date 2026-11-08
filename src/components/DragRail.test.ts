import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DragRail } from './DragRail';
import { APP_CONFIG } from '@/lib/constants';

function mouse(type: string, pageX: number): MouseEvent {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'pageX', { value: pageX });
  return event;
}

function wheel(target: Element, deltaX: number, deltaY: number): WheelEvent {
  const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaX, deltaY });
  target.dispatchEvent(event);
  return event;
}

describe('DragRail', () => {
  let rail: HTMLElement;
  let inner: HTMLElement;
  let outsideScope: HTMLElement;
  let instance: DragRail | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML =
      '<div id="rail"><div class="content"><span class="inner"></span></div><div class="pad"></div></div>';
    rail = document.getElementById('rail')!;
    inner = rail.querySelector<HTMLElement>('.inner')!;
    outsideScope = rail.querySelector<HTMLElement>('.pad')!;
    Object.defineProperty(rail, 'scrollWidth', { configurable: true, value: 1000 });
    Object.defineProperty(rail, 'clientWidth', { configurable: true, value: 200 });
  });

  afterEach(() => {
    instance?.destroy();
    instance = null;
    vi.restoreAllMocks();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  describe('dragging', () => {
    it('scrolls 1:1 with the pointer, suspends snap and shows a grabbing cursor', () => {
      instance = new DragRail(rail, { enabled: () => true });
      rail.scrollLeft = 100;
      rail.dispatchEvent(mouse('mousedown', 300));
      expect(rail.style.cursor).toBe('grabbing');
      expect(rail.style.scrollSnapType).toBe('none');

      const move = mouse('mousemove', 250);
      rail.dispatchEvent(move);
      expect(rail.scrollLeft).toBe(150);
      expect(move.defaultPrevented).toBe(true);
    });

    it('ignores movement without a prior press', () => {
      instance = new DragRail(rail, { enabled: () => true });
      rail.scrollLeft = 100;
      const move = mouse('mousemove', 50);
      rail.dispatchEvent(move);
      expect(rail.scrollLeft).toBe(100);
      expect(move.defaultPrevented).toBe(false);
    });

    it('does nothing on mousedown while disabled', () => {
      instance = new DragRail(rail, { enabled: () => false });
      rail.dispatchEvent(mouse('mousedown', 300));
      rail.dispatchEvent(mouse('mousemove', 100));
      expect(rail.style.cursor).toBe('');
      expect(rail.style.scrollSnapType).toBe('');
      expect(rail.scrollLeft).toBe(0);
    });

    it('re-evaluates enabled() per event', () => {
      let on = false;
      instance = new DragRail(rail, { enabled: () => on });
      rail.dispatchEvent(mouse('mousedown', 10));
      expect(rail.style.cursor).toBe('');
      on = true;
      rail.dispatchEvent(mouse('mousedown', 10));
      expect(rail.style.cursor).toBe('grabbing');
    });

    it('defaults enabled() to a window-width check against the mobile breakpoint', () => {
      const original = window.innerWidth;
      instance = new DragRail(rail);
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 });
      rail.dispatchEvent(mouse('mousedown', 10));
      expect(rail.style.cursor).toBe('');
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 });
      rail.dispatchEvent(mouse('mousedown', 10));
      expect(rail.style.cursor).toBe('grabbing');
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: original });
    });

    it('prevents native dragstart', () => {
      instance = new DragRail(rail, { enabled: () => true });
      const event = new Event('dragstart', { bubbles: true, cancelable: true });
      rail.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    });
  });

  describe('release and momentum', () => {
    function flick(): void {
      rail.dispatchEvent(mouse('mousedown', 300));
      vi.advanceTimersByTime(16);
      rail.dispatchEvent(mouse('mousemove', 260));
    }

    it('clears cursor on mouseup and coasts, then restores snap when it settles', () => {
      instance = new DragRail(rail, { enabled: () => true });
      flick();
      const afterMove = rail.scrollLeft;
      rail.dispatchEvent(mouse('mouseup', 260));
      expect(rail.style.cursor).toBe('');
      expect(rail.style.scrollSnapType).toBe('none');

      vi.advanceTimersByTime(32);
      expect(rail.scrollLeft).toBeGreaterThan(afterMove);

      vi.advanceTimersByTime(5000);
      expect(rail.style.scrollSnapType).toBe('');
      const settled = rail.scrollLeft;
      vi.advanceTimersByTime(1000);
      expect(rail.scrollLeft).toBe(settled);
    });

    it('ends the drag on mouseleave as well', () => {
      instance = new DragRail(rail, { enabled: () => true });
      flick();
      rail.dispatchEvent(mouse('mouseleave', 0));
      expect(rail.style.cursor).toBe('');
      const before = rail.scrollLeft;
      rail.dispatchEvent(mouse('mousemove', 0));
      expect(rail.scrollLeft).toBe(before);
    });

    it('treats a second release as a no-op', () => {
      instance = new DragRail(rail, { enabled: () => true });
      flick();
      rail.dispatchEvent(mouse('mouseup', 260));
      const spy = vi.spyOn(window, 'requestAnimationFrame');
      rail.dispatchEvent(mouse('mouseup', 260));
      expect(spy).not.toHaveBeenCalled();
    });

    it('caps a very fast flick at MAX_VELOCITY per frame', () => {
      instance = new DragRail(rail, { enabled: () => true });
      rail.dispatchEvent(mouse('mousedown', 300));
      vi.advanceTimersByTime(1);
      rail.dispatchEvent(mouse('mousemove', 0));
      const start = rail.scrollLeft;
      rail.dispatchEvent(mouse('mouseup', 0));
      vi.advanceTimersByTime(17);
      expect(rail.scrollLeft - start).toBeLessThanOrEqual(APP_CONFIG.DRAG.MAX_VELOCITY);
      expect(rail.scrollLeft - start).toBeGreaterThan(0);
    });

    it('a new press stops a coast in progress', () => {
      instance = new DragRail(rail, { enabled: () => true });
      flick();
      rail.dispatchEvent(mouse('mouseup', 260));
      vi.advanceTimersByTime(16);
      rail.dispatchEvent(mouse('mousedown', 100));
      const frozen = rail.scrollLeft;
      vi.advanceTimersByTime(500);
      expect(rail.scrollLeft).toBe(frozen);
    });
  });

  describe('wheel', () => {
    it('turns a vertical wheel into horizontal scroll and restores snap after the delay', () => {
      instance = new DragRail(rail, { enabled: () => true });
      const event = wheel(inner, 0, 50);
      expect(event.defaultPrevented).toBe(true);
      expect(rail.scrollLeft).toBe(50);
      expect(rail.style.scrollSnapType).toBe('none');

      vi.advanceTimersByTime(APP_CONFIG.DRAG.SNAP_DELAY - 1);
      expect(rail.style.scrollSnapType).toBe('none');
      vi.advanceTimersByTime(1);
      expect(rail.style.scrollSnapType).toBe('');
    });

    it('scrolls left for a negative delta when not at the start', () => {
      instance = new DragRail(rail, { enabled: () => true });
      rail.scrollLeft = 100;
      const event = wheel(inner, 0, -30);
      expect(event.defaultPrevented).toBe(true);
      expect(rail.scrollLeft).toBe(70);
    });

    it('hands scrolling back to the page at the start edge', () => {
      instance = new DragRail(rail, { enabled: () => true });
      const event = wheel(inner, 0, -30);
      expect(event.defaultPrevented).toBe(false);
      expect(rail.scrollLeft).toBe(0);
    });

    it('hands scrolling back to the page at the end edge', () => {
      instance = new DragRail(rail, { enabled: () => true });
      rail.scrollLeft = 800;
      const event = wheel(inner, 0, 30);
      expect(event.defaultPrevented).toBe(false);
      expect(rail.scrollLeft).toBe(800);
    });

    it('leaves predominantly horizontal wheel events alone', () => {
      instance = new DragRail(rail, { enabled: () => true });
      const event = wheel(inner, 40, 10);
      expect(event.defaultPrevented).toBe(false);
      expect(rail.scrollLeft).toBe(0);
    });

    it('leaves wheel events alone while disabled', () => {
      instance = new DragRail(rail, { enabled: () => false });
      const event = wheel(inner, 0, 50);
      expect(event.defaultPrevented).toBe(false);
    });

    it('restricts the takeover to wheelScope when given', () => {
      instance = new DragRail(rail, { enabled: () => true, wheelScope: '.content' });
      expect(wheel(outsideScope, 0, 50).defaultPrevented).toBe(false);
      expect(rail.scrollLeft).toBe(0);
      expect(wheel(inner, 0, 50).defaultPrevented).toBe(true);
      expect(rail.scrollLeft).toBe(50);
    });

    it('debounces the snap restore across consecutive wheel events', () => {
      instance = new DragRail(rail, { enabled: () => true });
      wheel(inner, 0, 10);
      vi.advanceTimersByTime(APP_CONFIG.DRAG.SNAP_DELAY - 10);
      wheel(inner, 0, 10);
      vi.advanceTimersByTime(APP_CONFIG.DRAG.SNAP_DELAY - 10);
      expect(rail.style.scrollSnapType).toBe('none');
      vi.advanceTimersByTime(10);
      expect(rail.style.scrollSnapType).toBe('');
    });
  });

  describe('destroy', () => {
    it('removes every listener', () => {
      instance = new DragRail(rail, { enabled: () => true });
      instance.destroy();
      rail.dispatchEvent(mouse('mousedown', 300));
      expect(rail.style.cursor).toBe('');
      expect(wheel(inner, 0, 50).defaultPrevented).toBe(false);
      const drag = new Event('dragstart', { cancelable: true });
      rail.dispatchEvent(drag);
      expect(drag.defaultPrevented).toBe(false);
    });

    it('cancels a pending snap restore', () => {
      instance = new DragRail(rail, { enabled: () => true });
      wheel(inner, 0, 50);
      instance.destroy();
      vi.advanceTimersByTime(APP_CONFIG.DRAG.SNAP_DELAY * 2);
      expect(rail.style.scrollSnapType).toBe('none');
    });

    it('is safe to call twice', () => {
      instance = new DragRail(rail, { enabled: () => true });
      instance.destroy();
      expect(() => instance?.destroy()).not.toThrow();
    });
  });
});
