import { CSS_CLASSES, APP_CONFIG } from '../../lib/constants';
import { DOMUtils } from '../../lib/dom';

/**
 * Where scroll-driven CSS animation is available the reveals are handled
 * entirely in the stylesheet; this observer only backs up the timeline,
 * whose stagger index comes from the render pass.
 */
export function initScrollAnimations(): void {
  const observerOptions: IntersectionObserverInit = {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px',
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add(CSS_CLASSES.VISIBLE);
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  DOMUtils.getElements('.timeline-item').forEach(element => observer.observe(element));
}

/** Staggered entrance for the elements marked `.fade-in-up` in the markup. */
export function startEntranceAnimations(): void {
  DOMUtils.getElements('.fade-in-up').forEach((element, index) => {
    setTimeout(() => {
      (element as HTMLElement).style.opacity = '1';
      (element as HTMLElement).style.translate = '0 0';
    }, index * APP_CONFIG.ANIMATION_DELAY);
  });
}
