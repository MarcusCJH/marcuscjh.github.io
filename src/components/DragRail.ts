// Pointer-driven horizontal scrolling for a rail that is already a native
// `overflow-x: auto` scroller.
//
// Touch is deliberately absent: a finger drag already scrolls the element,
// with the platform's own momentum and rubber-banding. Writing `scrollLeft`
// on top of that doubled every swipe on touch devices wide enough for the
// rail. This adds only what the browser does not give a mouse — press-and-
// drag, flick momentum, and vertical-wheel-to-horizontal while hovering.

import { APP_CONFIG, BREAKPOINTS } from '@/lib/constants';

export interface DragRailOptions {
  /** Only active while this returns true; re-evaluated per event so a resize across the breakpoint behaves. */
  enabled?: () => boolean;
  /** Restrict the wheel takeover to events over this descendant, so padding around the content still scrolls the page. */
  wheelScope?: string;
}

export class DragRail {
  private readonly el: HTMLElement;
  private readonly enabled: () => boolean;
  private readonly wheelScope?: string;
  private readonly cleanups: (() => void)[] = [];

  private dragging = false;
  private startX = 0;
  private startScrollLeft = 0;
  private lastX = 0;
  private lastMoveTime = 0;
  private velocity = 0;
  private momentumRaf = 0;
  private snapTimer = 0;

  constructor(element: HTMLElement, options: DragRailOptions = {}) {
    this.el = element;
    this.enabled = options.enabled ?? (() => window.innerWidth > BREAKPOINTS.MOBILE);
    this.wheelScope = options.wheelScope;
    this.bind();
  }

  // Scroll snap fights a gesture in progress, so it is suspended while the
  // rail is being driven and restored once it settles.
  private suspendSnap(): void {
    this.el.style.scrollSnapType = 'none';
  }

  private restoreSnap(): void {
    this.el.style.scrollSnapType = '';
  }

  private coast = (): void => {
    const { FRICTION, MIN_VELOCITY } = APP_CONFIG.DRAG;
    if (Math.abs(this.velocity) < MIN_VELOCITY) {
      this.velocity = 0;
      this.restoreSnap();
      return;
    }
    this.el.scrollLeft += this.velocity;
    this.velocity *= FRICTION;
    this.momentumRaf = window.requestAnimationFrame(this.coast);
  };

  private on<K extends keyof HTMLElementEventMap>(
    target: HTMLElement | Window,
    type: K,
    handler: (event: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions
  ): void {
    const listener = handler as EventListener;
    target.addEventListener(type, listener, options);
    this.cleanups.push(() => target.removeEventListener(type, listener, options));
  }

  private bind(): void {
    this.on(this.el, 'mousedown', e => {
      if (!this.enabled()) {
        return;
      }
      this.dragging = true;
      this.velocity = 0;
      window.cancelAnimationFrame(this.momentumRaf);
      this.suspendSnap();
      this.el.style.cursor = 'grabbing';
      this.startX = e.pageX - this.el.offsetLeft;
      this.startScrollLeft = this.el.scrollLeft;
      this.lastX = e.pageX;
      this.lastMoveTime = window.performance.now();
    });

    this.on(this.el, 'mousemove', e => {
      if (!this.dragging) {
        return;
      }
      e.preventDefault();

      // 1:1 with the pointer — no amplification.
      const x = e.pageX - this.el.offsetLeft;
      this.el.scrollLeft = this.startScrollLeft - (x - this.startX);

      // Smooth the per-event velocity; raw deltas are too noisy to flick on.
      const now = window.performance.now();
      const elapsed = now - this.lastMoveTime || 1;
      const raw = ((this.lastX - e.pageX) / elapsed) * APP_CONFIG.DRAG.VELOCITY_SCALE;
      const weight = APP_CONFIG.DRAG.SMOOTHING;
      this.velocity = this.velocity * (1 - weight) + raw * weight;
      this.lastX = e.pageX;
      this.lastMoveTime = now;
    });

    const endDrag = () => {
      if (!this.dragging) {
        return;
      }
      this.dragging = false;
      this.el.style.cursor = '';
      window.cancelAnimationFrame(this.momentumRaf);
      const cap = APP_CONFIG.DRAG.MAX_VELOCITY;
      this.velocity = Math.max(-cap, Math.min(cap, this.velocity));
      this.momentumRaf = window.requestAnimationFrame(this.coast);
    };

    this.on(this.el, 'mouseup', endDrag);
    this.on(this.el, 'mouseleave', endDrag);
    this.on(this.el, 'dragstart', e => e.preventDefault());

    // A vertical wheel over the rail moves through it. At either end the
    // event is left alone, handing scrolling back to the page rather than
    // trapping the reader in this section.
    this.on(
      this.el,
      'wheel',
      e => {
        const inScope = !this.wheelScope || Boolean((e.target as Element).closest(this.wheelScope));
        if (!this.enabled() || !inScope || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) {
          return;
        }
        const maxScrollLeft = this.el.scrollWidth - this.el.clientWidth;
        const canMoveLeft = e.deltaY < 0 && this.el.scrollLeft > 1;
        const canMoveRight = e.deltaY > 0 && this.el.scrollLeft < maxScrollLeft - 1;
        if (!canMoveLeft && !canMoveRight) {
          return;
        }

        e.preventDefault();
        window.cancelAnimationFrame(this.momentumRaf);
        this.suspendSnap();
        this.el.scrollLeft += e.deltaY;
        window.clearTimeout(this.snapTimer);
        this.snapTimer = window.setTimeout(() => this.restoreSnap(), APP_CONFIG.DRAG.SNAP_DELAY);
      },
      { passive: false }
    );
  }

  public destroy(): void {
    window.cancelAnimationFrame(this.momentumRaf);
    window.clearTimeout(this.snapTimer);
    this.cleanups.forEach(off => off());
    this.cleanups.length = 0;
  }
}
