import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from 'vitest';
import { APP_CONFIG, CSS_CLASSES } from '../../lib/constants';
import { initScrollAnimations, startEntranceAnimations } from './index';

/**
 * src/test/setup.ts installs an `IntersectionObserver` stand-in built from an
 * arrow function, which cannot be used with `new` — constructing it throws
 * "is not a constructor". This feature constructs one, so the suite needs a
 * real class here. It records what was observed so the registered callback
 * can be driven by hand.
 */
interface ObserverRecord {
  callback: IntersectionObserverCallback;
  options: IntersectionObserverInit | undefined;
  observed: Element[];
  unobserved: Element[];
}

const records: ObserverRecord[] = [];

class RecordingIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string;
  readonly scrollMargin: string = '0px';
  readonly thresholds: readonly number[];
  private readonly record: ObserverRecord;

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.rootMargin = options?.rootMargin ?? '0px';
    const threshold = options?.threshold ?? 0;
    this.thresholds = typeof threshold === 'number' ? [threshold] : [...threshold];
    this.record = { callback, options, observed: [], unobserved: [] };
    records.push(this.record);
  }

  observe(target: Element): void {
    this.record.observed.push(target);
  }

  unobserve(target: Element): void {
    this.record.unobserved.push(target);
  }

  disconnect(): void {
    this.record.observed.length = 0;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

function latestRecord(): ObserverRecord {
  const record = records[records.length - 1];
  if (!record) {
    throw new Error('IntersectionObserver was never constructed');
  }
  return record;
}

function entryFor(target: Element, isIntersecting: boolean): IntersectionObserverEntry {
  const rect = target.getBoundingClientRect();
  return {
    target,
    isIntersecting,
    intersectionRatio: isIntersecting ? 1 : 0,
    boundingClientRect: rect,
    intersectionRect: rect,
    rootBounds: null,
    time: 0,
  };
}

/** The timeline rail slice of index.html, with cards already rendered. */
function buildFixture(count: number): void {
  const items = Array.from(
    { length: count },
    (_unused, index) =>
      `<div class="timeline-item" role="button" tabindex="0" data-index="${index}"></div>`
  ).join('');

  document.body.innerHTML = `
    <div class="timeline-wrapper" id="timeline-wrapper">
      <div class="timeline-track">
        <div class="timeline-items" id="timeline-items">${items}</div>
      </div>
    </div>
  `;
}

describe('initScrollAnimations', () => {
  const originalObserver = globalThis.IntersectionObserver;

  beforeAll(() => {
    globalThis.IntersectionObserver = RecordingIntersectionObserver;
  });

  afterAll(() => {
    globalThis.IntersectionObserver = originalObserver;
  });

  beforeEach(() => {
    records.length = 0;
    buildFixture(3);
  });

  it('observes every timeline card', () => {
    initScrollAnimations();

    expect(latestRecord().observed).toEqual(
      Array.from(document.querySelectorAll('.timeline-item'))
    );
  });

  it('observes with a small threshold and a bottom root margin', () => {
    initScrollAnimations();

    expect(latestRecord().options).toEqual({
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px',
    });
  });

  it('reveals a card once it intersects', () => {
    initScrollAnimations();
    const card = document.querySelector('.timeline-item');
    expect(card).not.toBeNull();
    expect(card!.classList.contains(CSS_CLASSES.VISIBLE)).toBe(false);

    const record = latestRecord();
    record.callback([entryFor(card!, true)], new RecordingIntersectionObserver(record.callback));

    expect(card!.classList.contains(CSS_CLASSES.VISIBLE)).toBe(true);
  });

  it('stops observing a card it has revealed', () => {
    initScrollAnimations();
    const card = document.querySelector('.timeline-item');

    const record = latestRecord();
    record.callback([entryFor(card!, true)], new RecordingIntersectionObserver(record.callback));

    expect(record.unobserved).toEqual([card]);
  });

  it('leaves a card that is not intersecting alone', () => {
    initScrollAnimations();
    const card = document.querySelector('.timeline-item');

    const record = latestRecord();
    record.callback([entryFor(card!, false)], new RecordingIntersectionObserver(record.callback));

    expect(card!.classList.contains(CSS_CLASSES.VISIBLE)).toBe(false);
    expect(record.unobserved).toEqual([]);
  });

  it('handles a batch of entries in one callback', () => {
    initScrollAnimations();
    const cards = Array.from(document.querySelectorAll('.timeline-item'));

    const record = latestRecord();
    record.callback(
      [entryFor(cards[0]!, true), entryFor(cards[1]!, false), entryFor(cards[2]!, true)],
      new RecordingIntersectionObserver(record.callback)
    );

    expect(cards.map(card => card.classList.contains(CSS_CLASSES.VISIBLE))).toEqual([
      true,
      false,
      true,
    ]);
    expect(record.unobserved).toEqual([cards[0], cards[2]]);
  });

  it('still constructs an observer when there is nothing to observe', () => {
    document.body.innerHTML = '';

    initScrollAnimations();

    expect(latestRecord().observed).toHaveLength(0);
  });
});

describe('startEntranceAnimations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <div class="social-links fade-in-up"></div>
      <div class="fade-in-up"></div>
      <div class="not-animated"></div>
    `;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reveals the marked elements in a stagger, one delay step apart', () => {
    const [first, second] = Array.from(document.querySelectorAll<HTMLElement>('.fade-in-up'));

    startEntranceAnimations();
    expect(first?.style.opacity).toBe('');

    // Index 0 fires on a zero-delay timeout, index 1 one step later.
    vi.advanceTimersByTime(0);
    expect(first?.style.opacity).toBe('1');
    expect(second?.style.opacity).toBe('');

    vi.advanceTimersByTime(APP_CONFIG.ANIMATION_DELAY);
    expect(second?.style.opacity).toBe('1');
  });

  it('writes an inline style only on the marked elements', () => {
    startEntranceAnimations();
    vi.runAllTimers();

    expect(document.querySelector('.not-animated')?.getAttribute('style')).toBeNull();
    Array.from(document.querySelectorAll('.fade-in-up')).forEach(element => {
      expect(element.getAttribute('style')).toContain('opacity: 1');
    });
  });

  it('does nothing when nothing is marked', () => {
    document.body.innerHTML = '<div class="not-animated"></div>';

    expect(() => {
      startEntranceAnimations();
      vi.runAllTimers();
    }).not.toThrow();
    expect(document.querySelector('.not-animated')?.getAttribute('style')).toBeNull();
  });
});
