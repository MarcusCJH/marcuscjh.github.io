import { APP_CONFIG, CSS_CLASSES, SELECTORS } from '../../lib/constants';
import { DOMUtils } from '../../lib/dom';
import { debounce } from '../../lib/utils';
import type { NavigationItem } from '../../types';

/**
 * Marks the nav item for the section currently in view, and toggles the
 * condensed state on the bar.
 *
 * This deliberately does not use an IntersectionObserver band centred on
 * the viewport. On a tall display — a 1440x2560 monitor in portrait, say —
 * three sections are on screen at once and the centre of the viewport sits
 * inside the second one, so the bar highlighted "timeline" while the
 * reader was still at the top of the page. Picking the last section whose
 * top has crossed the bar is correct at any viewport height.
 */
export function setupScrollSpy(navigation: NavigationItem[]): void {
  const navContainer = document.querySelector<HTMLElement>(SELECTORS.NAV_CONTAINER);

  const sections = navigation
    .filter(nav => nav.enabled)
    .map(nav => ({
      id: nav.id,
      element: document.getElementById(nav.id === 'home' ? 'hero-section' : `${nav.id}-section`),
    }))
    .filter((entry): entry is { id: string; element: HTMLElement } => Boolean(entry.element));

  let activeId = '';
  const setActive = (id: string) => {
    if (id === activeId) {
      return;
    }
    activeId = id;
    DOMUtils.getElements('.nav-item').forEach(item => {
      const element = item as HTMLElement;
      element.classList.toggle(CSS_CLASSES.ACTIVE, element.dataset.navId === id);
    });
  };

  const update = () => {
    navContainer?.classList.toggle(CSS_CLASSES.SCROLLED, window.scrollY > 24);

    const firstSection = sections[0];
    const lastSection = sections[sections.length - 1];
    if (!firstSection || !lastSection) {
      return;
    }

    // A little below the bar, so a section counts as current once its
    // heading has actually arrived rather than when its first pixel has.
    // The slack must exceed the CSS `scroll-padding-top` (bar + 24px):
    // with the two equal, a section scrolled to the top lands exactly on
    // the line and sub-pixel rounding decides whether it counts.
    const line = (navContainer?.offsetHeight ?? 0) + 32;
    let current = firstSection;

    for (const section of sections) {
      if (section.element.getBoundingClientRect().top <= line) {
        current = section;
      }
    }

    // At the very bottom the last section may never cross the line.
    const atBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    setActive(atBottom ? lastSection.id : current.id);
  };

  const debouncedScrollHandler = debounce(update, APP_CONFIG.DEBOUNCE_DELAY);
  window.addEventListener('scroll', debouncedScrollHandler, { passive: true });
  window.addEventListener('resize', debouncedScrollHandler);

  // This runs before the sections below it have been filled in, so the
  // first measurement sees them all stacked near the top and would mark
  // the last one current. Re-measure whenever the document's height
  // changes — section rendering, images arriving, the webfont swapping.
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(debouncedScrollHandler).observe(document.body);
  }
  window.addEventListener('load', debouncedScrollHandler);

  update();
}
