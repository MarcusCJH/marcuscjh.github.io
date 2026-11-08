import { DOMUtils } from '../../lib/dom';
import { setHtml, unsafeHtml } from '../../lib/html';
import { icon } from '../../lib/icons';

/**
 * Fill the inline-SVG slots in the static markup. Keeping the icons out of
 * index.html means one source of truth for the icon set.
 */
export function initStaticIcons(): void {
  const slots: [string, string][] = [['.timeline-search', 'search']];

  slots.forEach(([selector, name]) => {
    const host = document.querySelector(selector);
    // Guard so a second init pass cannot stack a duplicate glyph.
    if (host && !host.querySelector(':scope > svg')) {
      host.insertAdjacentHTML('afterbegin', icon(name));
    }
  });

  const closeButton = DOMUtils.getElement('modal-close');
  if (closeButton) {
    setHtml(closeButton, unsafeHtml(icon('times')));
  }
}
