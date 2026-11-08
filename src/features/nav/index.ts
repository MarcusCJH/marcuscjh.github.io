import { CSS_CLASSES } from '../../lib/constants';
import { DOMUtils } from '../../lib/dom';
import { markup, setHtml } from '../../lib/html';
import type { NavigationItem } from '../../types';
import { hideDisabledSections } from './sections';
import { setupScrollSpy } from './scroll-spy';

export interface NavOptions {
  navigation: NavigationItem[];
  /** The `resume` nav item opens a dialog instead of scrolling anywhere. */
  onResume: () => void;
}

function navigateToSection(section: string): void {
  const targetElement =
    section === 'home'
      ? document.getElementById('hero-section')
      : document.getElementById(`${section}-section`);

  targetElement?.scrollIntoView({ behavior: 'smooth' });
}

export function initNav({ navigation, onResume }: NavOptions): void {
  const navMenu = DOMUtils.getElement('nav-menu');
  const navToggle = DOMUtils.getElement('nav-toggle');

  if (!navigation || !navMenu) {
    return;
  }

  // Hide sections based on navigation enabled status
  hideDisabledSections(navigation);

  // Nav items carry a CSS-generated index instead of an icon — the counter
  // reads as wayfinding, and one fewer glyph per row keeps the bar quiet.
  setHtml(
    navMenu,
    navigation
      .filter(nav => nav.enabled)
      .map(
        nav => markup`
        <button class="nav-item" type="button" data-nav-id="${nav.id}">
          <span>${nav.title}</span>
        </button>
      `
      )
  );

  const navItems = DOMUtils.getElements('.nav-item');

  navToggle?.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle(CSS_CLASSES.ACTIVE);
    navToggle.classList.toggle(CSS_CLASSES.ACTIVE, isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navItems.forEach(item => {
    item.addEventListener('click', e => {
      const target = (e.currentTarget as HTMLElement).dataset.navId;
      if (target) {
        if (target === 'resume') {
          onResume();
        } else {
          navigateToSection(target);
        }
      }
      navToggle?.classList.remove(CSS_CLASSES.ACTIVE);
      navToggle?.setAttribute('aria-expanded', 'false');
      navMenu.classList.remove(CSS_CLASSES.ACTIVE);
    });
  });

  // The brand keeps its href so it still works without JavaScript, but a
  // plain anchor would leave "#hero-section" sitting in the address bar
  // after every click. Scroll it ourselves and keep the URL clean.
  document.querySelector<HTMLAnchorElement>('.nav-brand')?.addEventListener('click', e => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  });

  setupScrollSpy(navigation);
}
