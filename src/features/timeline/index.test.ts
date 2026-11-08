import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { APP_CONFIG, CSS_CLASSES, DEFAULT_TEXT } from '../../lib/constants';
import { DOMUtils } from '../../lib/dom';
import { initTimeline } from './index';
import type { TimelineFilter, TimelineItem } from '../../types';

/** The timeline section of index.html, with every slot the feature writes to. */
function buildFixture(): void {
  document.body.innerHTML = `
    <section class="content-section shell" id="timeline-section">
      <div class="timeline-container">
        <div class="timeline-search">
          <input type="search" id="timeline-search" aria-label="Search timeline entries"
                 placeholder="Search entries — e.g. Accenture, AWS" />
        </div>
        <div class="timeline-controls">
          <div class="timeline-filters" role="group" aria-label="Filter timeline by category">
            <!-- Filter buttons are generated from data.json -->
          </div>
          <p class="timeline-hint" aria-hidden="true">drag · scroll →</p>
        </div>
        <div class="timeline-wrapper" id="timeline-wrapper">
          <div class="timeline-track">
            <div class="timeline-line" aria-hidden="true"></div>
            <div class="timeline-progress" id="timeline-progress" aria-hidden="true"></div>
            <div class="timeline-items" id="timeline-items">
              <!-- Timeline items are loaded from data.json -->
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

const filters: TimelineFilter[] = [...DEFAULT_TEXT.filters];

const items: TimelineItem[] = [
  {
    company: 'Accenture',
    title: 'Software Engineer',
    startDate: '2021',
    endDate: 'Present',
    category: 'work',
    order: 3,
  },
  {
    company: 'SMU',
    title: 'Bachelor of Science',
    startDate: '2016',
    endDate: '2020',
    category: 'education',
    order: 1,
  },
  {
    company: 'AWS',
    title: 'Cloud Practitioner',
    startDate: '2022',
    category: 'certification',
    order: 2,
  },
];

function run(overrides: Partial<Parameters<typeof initTimeline>[0]> = {}): {
  onOpenItem: ReturnType<typeof vi.fn>;
} {
  const onOpenItem = vi.fn();
  initTimeline({
    items,
    filters,
    emptyMessage: DEFAULT_TEXT.emptyMessage,
    onOpenItem,
    ...overrides,
  });
  return { onOpenItem };
}

function cards(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('#timeline-items [data-timeline-item]'));
}

function companies(): (string | null | undefined)[] {
  return cards().map(card => card.querySelector('h3')?.textContent);
}

function filterButtons(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.timeline-filters .filter-btn'));
}

function clickFilter(id: string): void {
  filterButtons()
    .find(button => button.dataset.filter === id)
    ?.click();
}

function search(value: string): void {
  const input = document.querySelector<HTMLInputElement>('#timeline-search');
  if (!input) {
    throw new Error('fixture is missing the search input');
  }
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('initTimeline', () => {
  beforeEach(() => {
    DOMUtils.clearCache();
    buildFixture();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('filter bar', () => {
    it('renders one button per configured filter, labelled from the config', () => {
      run();

      expect(filterButtons().map(button => button.dataset.filter)).toEqual([
        'all',
        'work',
        'education',
        'certification',
      ]);
      expect(filterButtons().map(button => button.textContent)).toEqual([
        'All',
        'Work',
        'Education',
        'Certs',
      ]);
    });

    it('starts with only the first filter pressed', () => {
      run();

      expect(filterButtons().map(button => button.classList.contains(CSS_CLASSES.ACTIVE))).toEqual([
        true,
        false,
        false,
        false,
      ]);
      expect(filterButtons().map(button => button.getAttribute('aria-pressed'))).toEqual([
        'true',
        'false',
        'false',
        'false',
      ]);
    });

    it('moves the pressed state to the filter that was clicked', () => {
      run();

      clickFilter('work');

      expect(filterButtons().map(button => button.getAttribute('aria-pressed'))).toEqual([
        'false',
        'true',
        'false',
        'false',
      ]);
      expect(filterButtons().map(button => button.classList.contains(CSS_CLASSES.ACTIVE))).toEqual([
        false,
        true,
        false,
        false,
      ]);
    });

    it('still renders the cards when there is no filter bar in the markup', () => {
      document.querySelector('.timeline-filters')?.remove();

      run();

      expect(filterButtons()).toHaveLength(0);
      expect(cards()).toHaveLength(3);
    });
  });

  describe('rendering', () => {
    it('renders every item, newest order first', () => {
      run();

      expect(companies()).toEqual(['Accenture', 'AWS', 'SMU']);
    });

    it('describes each card for assistive technology and keyboard use', () => {
      run();

      const first = cards()[0];
      expect(first?.getAttribute('role')).toBe('button');
      expect(first?.getAttribute('tabindex')).toBe('0');
      expect(first?.getAttribute('aria-label')).toBe('Accenture — Software Engineer');
      expect(first?.dataset.category).toBe('work');
      expect(first?.dataset.index).toBe('0');
    });

    it('renders the date range, and only the start date when there is no end', () => {
      run();

      const dates = cards().map(card => card.querySelector('.timeline-date')?.textContent);
      expect(dates).toEqual(['2021 — Present', '2022', '2016 — 2020']);
    });

    it('takes the card tag from the matching filter, falling back to the category', () => {
      run();

      const tags = cards().map(card => card.querySelector('.timeline-tag')?.textContent);
      expect(tags).toEqual(['work', 'certification', 'education']);
    });

    it('falls back to the raw category when no filter declares a tag', () => {
      run({ filters: [{ id: 'all', label: 'All' }] });

      const tags = cards().map(card => card.querySelector('.timeline-tag')?.textContent);
      expect(tags).toEqual(['work', 'certification', 'education']);
    });

    it('marks the cards visible and stamps the stagger index', () => {
      run();

      cards().forEach((card, index) => {
        expect(card.classList.contains(CSS_CLASSES.VISIBLE)).toBe(true);
        expect(card.getAttribute('style')).toContain(`--item-index: ${index}`);
      });
    });

    it('publishes the rail progress after rendering', () => {
      const wrapper = document.getElementById('timeline-wrapper');
      Object.defineProperty(wrapper, 'scrollWidth', { value: 2000, configurable: true });
      Object.defineProperty(wrapper, 'clientWidth', { value: 1000, configurable: true });
      Object.defineProperty(wrapper, 'scrollLeft', { value: 500, configurable: true });

      run();

      expect(
        document.getElementById('timeline-progress')?.style.getPropertyValue('--timeline-progress')
      ).toBe('50%');
    });

    it('escapes an item whose text contains markup', () => {
      run({
        items: [{ ...items[0]!, company: '<em>Accenture</em>' }],
      });

      const card = cards()[0];
      expect(card?.querySelectorAll('em')).toHaveLength(0);
      expect(card?.querySelector('h3')?.textContent).toBe('<em>Accenture</em>');
    });
  });

  describe('filtering', () => {
    it('narrows the cards to the chosen category', () => {
      run();

      clickFilter('education');

      expect(companies()).toEqual(['SMU']);
    });

    it('restores every card when "all" is chosen again', () => {
      run();

      clickFilter('work');
      clickFilter('all');

      expect(companies()).toEqual(['Accenture', 'AWS', 'SMU']);
    });

    it('shows the empty message when a filter matches nothing', () => {
      run({ items: [items[0]!] });

      clickFilter('education');

      expect(cards()).toHaveLength(0);
      expect(document.querySelector('.timeline-empty')?.textContent).toBe(
        DEFAULT_TEXT.emptyMessage
      );
    });

    it('uses the configured empty message', () => {
      run({ items: [], emptyMessage: 'Nothing here yet.' });

      expect(document.querySelector('.timeline-empty')?.textContent).toBe('Nothing here yet.');
    });
  });

  describe('searching', () => {
    it('matches on company name, case-insensitively', () => {
      run();

      search('accenture');

      expect(companies()).toEqual(['Accenture']);
    });

    it('matches on job title', () => {
      run();

      search('practitioner');

      expect(companies()).toEqual(['AWS']);
    });

    it('ignores surrounding whitespace', () => {
      run();

      search('   smu   ');

      expect(companies()).toEqual(['SMU']);
    });

    it('shows the empty message when the search matches nothing', () => {
      run();

      search('nonexistent');

      expect(cards()).toHaveLength(0);
      expect(document.querySelector('.timeline-empty')).not.toBeNull();
    });

    it('restores every card when the search is cleared', () => {
      run();

      search('accenture');
      search('');

      expect(companies()).toEqual(['Accenture', 'AWS', 'SMU']);
    });

    it('combines the active filter with the search term', () => {
      run();

      clickFilter('work');
      search('accenture');
      expect(companies()).toEqual(['Accenture']);

      clickFilter('education');
      expect(cards()).toHaveLength(0);
    });

    it('keeps the search term when a filter is clicked', () => {
      run();

      search('a');
      clickFilter('all');

      // "Accenture", "AWS" and "Bachelor" all contain an "a".
      expect(companies()).toEqual(['Accenture', 'AWS', 'SMU']);

      clickFilter('work');
      expect(companies()).toEqual(['Accenture']);
    });

    it('renders without a search input present', () => {
      document.querySelector('#timeline-search')?.remove();
      DOMUtils.clearCache();

      run();

      expect(cards()).toHaveLength(3);
    });
  });

  describe('opening an entry', () => {
    it('passes the clicked item to the callback', () => {
      const { onOpenItem } = run();

      cards()[1]?.click();

      expect(onOpenItem).toHaveBeenCalledTimes(1);
      expect(onOpenItem).toHaveBeenCalledWith(items[2]);
    });

    it('opens from the keyboard with Enter and Space', () => {
      const { onOpenItem } = run();

      ['Enter', ' '].forEach(key => {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        cards()[0]?.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
      });

      expect(onOpenItem).toHaveBeenCalledTimes(2);
      expect(onOpenItem).toHaveBeenLastCalledWith(items[0]);
    });

    it('resolves the card against the filtered list, not the full one', () => {
      const { onOpenItem } = run();

      clickFilter('education');
      cards()[0]?.click();

      expect(onOpenItem).toHaveBeenCalledWith(items[1]);
    });

    it('does not fire for an unrelated key', () => {
      const { onOpenItem } = run();

      cards()[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true }));

      expect(onOpenItem).not.toHaveBeenCalled();
    });
  });

  describe('progress tracking', () => {
    it('re-publishes progress after the rail is scrolled, once debounced', () => {
      vi.useFakeTimers();
      run();

      const wrapper = document.getElementById('timeline-wrapper');
      Object.defineProperty(wrapper, 'scrollWidth', { value: 2000, configurable: true });
      Object.defineProperty(wrapper, 'clientWidth', { value: 1000, configurable: true });
      Object.defineProperty(wrapper, 'scrollLeft', { value: 1000, configurable: true });

      wrapper?.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(APP_CONFIG.THROTTLE_DELAY);

      expect(
        document.getElementById('timeline-progress')?.style.getPropertyValue('--timeline-progress')
      ).toBe('100%');
    });

    it('also re-publishes on window scroll and resize', () => {
      vi.useFakeTimers();
      run();

      const wrapper = document.getElementById('timeline-wrapper');
      Object.defineProperty(wrapper, 'scrollWidth', { value: 2000, configurable: true });
      Object.defineProperty(wrapper, 'clientWidth', { value: 1000, configurable: true });
      Object.defineProperty(wrapper, 'scrollLeft', { value: 250, configurable: true });

      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(APP_CONFIG.THROTTLE_DELAY);
      expect(
        document.getElementById('timeline-progress')?.style.getPropertyValue('--timeline-progress')
      ).toBe('25%');

      Object.defineProperty(wrapper, 'scrollLeft', { value: 750, configurable: true });
      window.dispatchEvent(new Event('resize'));
      vi.advanceTimersByTime(APP_CONFIG.THROTTLE_DELAY);
      expect(
        document.getElementById('timeline-progress')?.style.getPropertyValue('--timeline-progress')
      ).toBe('75%');
    });

    it('renders without a rail wrapper present', () => {
      document.getElementById('timeline-wrapper')?.remove();
      document.body.insertAdjacentHTML(
        'beforeend',
        '<div class="timeline-items" id="timeline-items"></div>'
      );
      DOMUtils.clearCache();

      run();

      expect(cards()).toHaveLength(3);
    });
  });

  it('returns early when the items container is missing', () => {
    document.body.innerHTML = '';
    DOMUtils.clearCache();

    const { onOpenItem } = run();

    expect(cards()).toHaveLength(0);
    expect(onOpenItem).not.toHaveBeenCalled();
  });

  it('renders the empty message for an empty item list', () => {
    run({ items: [] });

    expect(cards()).toHaveLength(0);
    expect(document.querySelector('.timeline-empty')).not.toBeNull();
  });
});
