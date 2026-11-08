import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BREAKPOINTS } from '../../lib/constants';
import { DOMUtils } from '../../lib/dom';
import { updateTimelineProgress } from './progress';

/** The scroller and its progress indicator, as index.html nests them. */
function buildFixture(): void {
  document.body.innerHTML = `
    <div class="timeline-wrapper" id="timeline-wrapper">
      <div class="timeline-track">
        <div class="timeline-line" aria-hidden="true"></div>
        <div class="timeline-progress" id="timeline-progress" aria-hidden="true"></div>
        <div class="timeline-items" id="timeline-items"></div>
      </div>
    </div>
  `;
}

function setViewport(width: number, height = 800): void {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true });
}

/** Describe the rail as a horizontal scroller of a given extent. */
function setRailMetrics(scrollWidth: number, clientWidth: number, scrollLeft: number): void {
  const wrapper = document.getElementById('timeline-wrapper');
  if (!wrapper) {
    throw new Error('fixture is missing the timeline wrapper');
  }
  Object.defineProperty(wrapper, 'scrollWidth', { value: scrollWidth, configurable: true });
  Object.defineProperty(wrapper, 'clientWidth', { value: clientWidth, configurable: true });
  Object.defineProperty(wrapper, 'scrollLeft', { value: scrollLeft, configurable: true });
}

/** Describe the rail's box for the vertical (mobile) reading. */
function setRailBox(top: number, height: number): void {
  const wrapper = document.getElementById('timeline-wrapper');
  if (!wrapper) {
    throw new Error('fixture is missing the timeline wrapper');
  }
  wrapper.getBoundingClientRect = () => ({
    top,
    bottom: top + height,
    left: 0,
    right: 400,
    width: 400,
    height,
    x: 0,
    y: top,
    toJSON: () => ({}),
  });
}

function publishedProgress(): string {
  const bar = document.getElementById('timeline-progress');
  return bar?.style.getPropertyValue('--timeline-progress') ?? '';
}

describe('updateTimelineProgress', () => {
  const originalWidth = window.innerWidth;
  const originalHeight = window.innerHeight;

  beforeEach(() => {
    DOMUtils.clearCache();
    buildFixture();
  });

  afterEach(() => {
    setViewport(originalWidth, originalHeight);
  });

  describe('on a wide viewport, from horizontal scroll', () => {
    beforeEach(() => {
      setViewport(BREAKPOINTS.MOBILE + 1);
    });

    it('publishes the scrolled fraction of the rail', () => {
      setRailMetrics(2000, 1000, 500);

      updateTimelineProgress();

      expect(publishedProgress()).toBe('50%');
    });

    it('publishes 0% at the start of the rail', () => {
      setRailMetrics(2000, 1000, 0);

      updateTimelineProgress();

      expect(publishedProgress()).toBe('0%');
    });

    it('publishes 100% at the end of the rail', () => {
      setRailMetrics(2000, 1000, 1000);

      updateTimelineProgress();

      expect(publishedProgress()).toBe('100%');
    });

    it('publishes 0% when the rail does not overflow', () => {
      setRailMetrics(1000, 1000, 0);

      updateTimelineProgress();

      expect(publishedProgress()).toBe('0%');
    });

    it('clamps an over-scrolled rail to 100%', () => {
      setRailMetrics(2000, 1000, 4000);

      updateTimelineProgress();

      expect(publishedProgress()).toBe('100%');
    });
  });

  describe('on a narrow viewport, from the rail passing the viewport centre', () => {
    beforeEach(() => {
      setViewport(BREAKPOINTS.MOBILE, 800);
    });

    it('publishes 0% while the rail starts at the viewport centre', () => {
      setRailBox(400, 1000);

      updateTimelineProgress();

      expect(publishedProgress()).toBe('0%');
    });

    it('publishes the fraction of the rail that has passed the centre', () => {
      // Centre line is 400; the rail's top is 100 above it, of 1000 tall.
      setRailBox(300, 1000);

      updateTimelineProgress();

      expect(publishedProgress()).toBe('10%');
    });

    it('clamps to 0% while the rail is still below the centre', () => {
      setRailBox(900, 1000);

      updateTimelineProgress();

      expect(publishedProgress()).toBe('0%');
    });

    it('clamps to 100% once the rail has scrolled well past', () => {
      setRailBox(-2000, 1000);

      updateTimelineProgress();

      expect(publishedProgress()).toBe('100%');
    });

    it('publishes 0% for a rail with no height', () => {
      setRailBox(0, 0);

      updateTimelineProgress();

      expect(publishedProgress()).toBe('0%');
    });
  });

  it('does nothing when the progress bar is missing', () => {
    document.getElementById('timeline-progress')?.remove();
    DOMUtils.clearCache();

    expect(() => updateTimelineProgress()).not.toThrow();
  });

  it('does nothing when the rail is missing', () => {
    document.body.innerHTML = '<div class="timeline-progress" id="timeline-progress"></div>';
    DOMUtils.clearCache();

    updateTimelineProgress();

    expect(publishedProgress()).toBe('');
  });
});
