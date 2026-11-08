import { APP_CONFIG, BREAKPOINTS, CSS_CLASSES } from '../../lib/constants';
import { DOMUtils, onActivate } from '../../lib/dom';
import { markup, setHtml } from '../../lib/html';
import { debounce } from '../../lib/utils';
import { DragRail } from '../../components/DragRail';
import type { TimelineFilter, TimelineItem, TimelineState } from '../../types';
import { updateTimelineProgress } from './progress';

export interface TimelineOptions {
  items: TimelineItem[];
  filters: TimelineFilter[];
  /** Shown when a filter or search matches nothing. */
  emptyMessage: string;
  onOpenItem: (item: TimelineItem) => void;
}

export function initTimeline({ items, filters, emptyMessage, onOpenItem }: TimelineOptions): void {
  const timelineContainer = DOMUtils.getElement('timeline-items');
  const searchInput = DOMUtils.getElement('timeline-search');
  const timelineWrapper = DOMUtils.getElement('timeline-wrapper');

  if (!items || !timelineContainer) {
    return;
  }

  const state: TimelineState = {
    currentFilter: 'all',
    currentSearch: '',
    filteredItems: [],
  };

  // One source for what a category is called, shared by the filter button
  // and the tag on each card.
  const tagFor = (category: string) => filters.find(f => f.id === category)?.tag ?? category;

  const filterHost = document.querySelector('.timeline-filters');
  if (filterHost) {
    setHtml(
      filterHost,
      filters.map(
        (f, i) => markup`
        <button class="filter-btn${i === 0 ? ' active' : ''}" type="button"
                aria-pressed="${i === 0}" data-filter="${f.id}">${f.label}</button>`
      )
    );
  }
  const filterButtons = DOMUtils.getElements('.filter-btn');

  const renderTimeline = (filter: string = 'all', search: string = ''): void => {
    const needle = search.trim().toLowerCase();
    state.currentFilter = filter;
    state.currentSearch = needle;

    state.filteredItems = items
      .filter(item => {
        const matchesFilter = filter === 'all' || item.category === filter;
        const haystack = `${item.company} ${item.title}`.toLowerCase();
        return matchesFilter && (needle === '' || haystack.includes(needle));
      })
      .sort((a, b) => b.order - a.order);

    if (state.filteredItems.length === 0) {
      setHtml(timelineContainer, markup`<p class="timeline-empty">${emptyMessage}</p>`);
      updateTimelineProgress();
      return;
    }

    setHtml(
      timelineContainer,
      state.filteredItems.map((item, index) => {
        const dates = markup`${item.startDate}${item.endDate ? markup` — ${item.endDate}` : ''}`;
        return markup`
        <div class="timeline-item visible" role="button" tabindex="0" aria-label="${item.company} — ${item.title}" data-category="${item.category}" data-index="${index}" data-timeline-item style="--item-index: ${index}">
          <div class="timeline-dot ${item.category}" aria-hidden="true"></div>
          <div class="timeline-content">
            <div class="timeline-date">${dates}</div>
            <h3>${item.company}</h3>
            <p>${item.title}</p>
            <div class="timeline-tag">${tagFor(item.category)}</div>
          </div>
        </div>
      `;
      })
    );

    timelineContainer.querySelectorAll('[data-timeline-item]').forEach(item => {
      onActivate(item, () => {
        const index = parseInt((item as HTMLElement).dataset.index || '0');
        const timelineItem = state.filteredItems[index];
        if (timelineItem) {
          onOpenItem(timelineItem);
        }
      });
    });

    updateTimelineProgress();
  };

  // Filter functionality
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filterValue = (btn as HTMLElement).dataset.filter || 'all';
      filterButtons.forEach(b => {
        b.classList.remove(CSS_CLASSES.ACTIVE);
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add(CSS_CLASSES.ACTIVE);
      btn.setAttribute('aria-pressed', 'true');
      renderTimeline(filterValue, state.currentSearch);
    });
  });

  // Search functionality
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      renderTimeline(state.currentFilter, (e.target as HTMLInputElement).value);
    });
  }

  // Scroll progress tracking
  if (timelineWrapper) {
    const debouncedTimelineScroll = debounce(() => {
      updateTimelineProgress();
    }, APP_CONFIG.THROTTLE_DELAY);

    // On mobile, listen to window scroll; on desktop, listen to wrapper scroll
    timelineWrapper.addEventListener('scroll', debouncedTimelineScroll, { passive: true });
    window.addEventListener('scroll', debouncedTimelineScroll, { passive: true });
    window.addEventListener('resize', debouncedTimelineScroll);

    // Pointer drag, flick momentum and hover-wheel live in DragRail;
    // touch is left to the browser, which already scrolls this element.
    new DragRail(timelineWrapper, {
      enabled: () => window.innerWidth > BREAKPOINTS.MOBILE,
      wheelScope: '.timeline-track',
    });
  }

  renderTimeline();
}
