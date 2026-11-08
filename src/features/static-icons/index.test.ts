import { describe, it, expect, beforeEach } from 'vitest';
import { DOMUtils } from '../../lib/dom';
import { initStaticIcons } from './index';

/** The two inline-SVG slots in index.html: the search field and the dialog's close button. */
function buildFixture(): void {
  document.body.innerHTML = `
    <div class="timeline-search">
      <input type="search" id="timeline-search" aria-label="Search timeline entries" />
    </div>
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-container" id="modal-container" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h3 class="modal-title" id="modal-title"></h3>
          <button class="modal-close" id="modal-close" type="button" aria-label="Close dialog"></button>
        </div>
      </div>
    </div>
  `;
}

describe('initStaticIcons', () => {
  beforeEach(() => {
    DOMUtils.clearCache();
    buildFixture();
  });

  it('inserts the search glyph as the first child of the search slot', () => {
    initStaticIcons();

    const host = document.querySelector('.timeline-search');
    const svg = host?.querySelector(':scope > svg');
    expect(svg).not.toBeNull();
    expect(host?.firstElementChild).toBe(svg);
    // The glyph sits before the input, which keeps the frozen markup order.
    expect(host?.children[1]?.id).toBe('timeline-search');
  });

  it('does not stack a duplicate glyph on a second init pass', () => {
    initStaticIcons();
    initStaticIcons();

    expect(document.querySelectorAll('.timeline-search > svg')).toHaveLength(1);
  });

  it('fills the close button with the times glyph', () => {
    initStaticIcons();

    const closeButton = document.getElementById('modal-close');
    expect(closeButton?.querySelectorAll('svg')).toHaveLength(1);
    // The close button is replaced rather than appended to, so repeated
    // passes cannot double up either.
    initStaticIcons();
    expect(closeButton?.querySelectorAll('svg')).toHaveLength(1);
  });

  it('keeps the accessible name on the close button', () => {
    initStaticIcons();

    const closeButton = document.getElementById('modal-close');
    expect(closeButton?.getAttribute('aria-label')).toBe('Close dialog');
    // The glyph itself must not be announced.
    expect(closeButton?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('does not throw when neither slot is present', () => {
    document.body.innerHTML = '';
    DOMUtils.clearCache();

    expect(() => initStaticIcons()).not.toThrow();
  });

  it('fills the search slot even when the close button is missing', () => {
    document.getElementById('modal-close')?.remove();
    DOMUtils.clearCache();

    initStaticIcons();

    expect(document.querySelectorAll('.timeline-search > svg')).toHaveLength(1);
  });
});
