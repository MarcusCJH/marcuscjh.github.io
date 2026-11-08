import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { CSS_CLASSES, DEFAULT_TEXT } from '../../lib/constants';
import { DOMUtils } from '../../lib/dom';
import { closeModal, initModal, openModal, openResumeModal } from './index';
import type { Config, ShowcaseProject, TimelineItem } from '../../types';

/**
 * The dialog markup of index.html. `#opener` stands in for the showcase card
 * or timeline entry that opens the dialog, so focus has somewhere to return.
 */
function buildFixture(): void {
  document.body.innerHTML = `
    <button id="opener" type="button">open</button>
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-container" id="modal-container" role="dialog" aria-modal="true"
           aria-labelledby="modal-title">
        <div class="modal-header">
          <h3 class="modal-title" id="modal-title"></h3>
          <button class="modal-close" id="modal-close" type="button" aria-label="Close dialog"></button>
        </div>
        <div class="modal-content" id="modal-content">
          <!-- Modal content is rendered at open time -->
        </div>
      </div>
    </div>
  `;
}

const timelineItem: TimelineItem = {
  company: 'Accenture',
  title: 'Software Engineer',
  startDate: '2021',
  endDate: 'Present',
  category: 'work',
  order: 1,
  modalContent: { title: 'Accenture', description: 'Built things.' },
};

const bareItem: TimelineItem = {
  company: 'SMU',
  title: 'Bachelor of Science',
  startDate: '2016',
  category: 'education',
  order: 2,
};

/** A project whose dialog has two links, so the focus ring has three stops. */
const linkedProject: ShowcaseProject = {
  id: 'datav',
  title: 'DataV',
  backgroundImage: '',
  modalContent: {
    title: 'DataV',
    description: 'A dashboard.',
    links: [
      { text: 'Source Code', url: 'https://github.com/x' },
      { text: 'View Live', url: 'https://example.com' },
    ],
  },
};

const baseConfig: Config = {
  name: 'marcuscjh',
  title: 'Engineer',
  subtitle: 'Cloud',
  typedMessages: [],
};

function overlay(): HTMLElement {
  const element = document.getElementById('modal-overlay');
  if (!element) {
    throw new Error('fixture is missing the overlay');
  }
  return element;
}

function container(): HTMLElement {
  const element = document.getElementById('modal-container');
  if (!element) {
    throw new Error('fixture is missing the container');
  }
  return element;
}

function closeButton(): HTMLElement {
  const element = document.getElementById('modal-close');
  if (!element) {
    throw new Error('fixture is missing the close button');
  }
  return element;
}

function isOpen(): boolean {
  return overlay().classList.contains(CSS_CLASSES.ACTIVE);
}

function focusables(): HTMLElement[] {
  return Array.from(
    container().querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), iframe, video, input, [tabindex]:not([tabindex="-1"])'
    )
  );
}

function pressKey(key: string, shiftKey = false): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true });
  document.dispatchEvent(event);
  return event;
}

/**
 * The dialog waits for its open transition before taking focus, and falls
 * back to a timeout. jsdom runs no transitions, so a test says which path it
 * is exercising.
 */
function finishOpenTransition(): void {
  overlay().dispatchEvent(new Event('transitionend'));
}

describe('modal dialog', () => {
  // `initModal` registers a document-level keydown listener, so it is wired
  // once for the whole suite and each test resets the dialog's state instead
  // of rebuilding the markup. A second wiring would run the focus trap twice
  // per Tab and wrap the focus ring back to where it started.
  beforeAll(() => {
    DOMUtils.clearCache();
    buildFixture();
    initModal();
  });

  beforeEach(() => {
    vi.useFakeTimers();
    overlay().classList.remove(CSS_CLASSES.ACTIVE);
    container().classList.remove('resume-modal');
    document.getElementById('modal-content')?.replaceChildren();
    document.getElementById('modal-title')?.replaceChildren();
    document.body.style.overflow = '';
    document.getElementById('opener')?.focus();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('openModal', () => {
    it('writes the title and renders the content', () => {
      openModal('Accenture', timelineItem);

      expect(document.getElementById('modal-title')?.textContent).toBe('Accenture');
      expect(document.querySelector('#modal-content .modal-description')?.textContent).toBe(
        'Built things.'
      );
    });

    it('falls back to a placeholder for an entry with no modal content', () => {
      openModal('SMU', bareItem);

      expect(document.querySelector('#modal-content .modal-description')?.textContent).toBe(
        'No additional information available.'
      );
    });

    it('opens the dialog and locks the page behind it', () => {
      openModal('Accenture', timelineItem);

      expect(isOpen()).toBe(true);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('clears the resume layout left over from a previous open', () => {
      openResumeModal({ ...baseConfig, resumeUrl: 'https://example.com/cv' });
      expect(container().classList.contains('resume-modal')).toBe(true);

      openModal('Accenture', timelineItem);

      expect(container().classList.contains('resume-modal')).toBe(false);
    });

    it('replaces the previous entry rather than appending to it', () => {
      openModal('Accenture', timelineItem);
      openModal('SMU', bareItem);

      expect(document.querySelectorAll('#modal-content .modal-description')).toHaveLength(1);
      expect(document.getElementById('modal-title')?.textContent).toBe('SMU');
    });
  });

  describe('focus on open', () => {
    it('moves focus into the dialog once the open transition finishes', () => {
      openModal('Accenture', timelineItem);
      expect(document.activeElement).toBe(document.getElementById('opener'));

      finishOpenTransition();

      expect(document.activeElement).toBe(closeButton());
    });

    it('falls back to a timeout when no transition runs', () => {
      openModal('Accenture', timelineItem);

      vi.advanceTimersByTime(400);

      expect(document.activeElement).toBe(closeButton());
    });

    it('does not take focus twice when both paths fire', () => {
      openModal('Accenture', timelineItem);
      finishOpenTransition();
      const focusSpy = vi.spyOn(closeButton(), 'focus');

      vi.advanceTimersByTime(400);

      expect(focusSpy).not.toHaveBeenCalled();
      focusSpy.mockRestore();
    });

    it('does not steal focus if the dialog was closed again first', () => {
      openModal('Accenture', timelineItem);
      closeModal();

      vi.advanceTimersByTime(400);

      expect(document.activeElement).not.toBe(closeButton());
    });
  });

  describe('dismissal', () => {
    it('closes on the close button', () => {
      openModal('Accenture', timelineItem);
      finishOpenTransition();

      closeButton().click();

      expect(isOpen()).toBe(false);
    });

    it('closes on a click on the backdrop', () => {
      openModal('Accenture', timelineItem);

      overlay().dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(isOpen()).toBe(false);
    });

    it('stays open on a click inside the dialog', () => {
      openModal('Accenture', timelineItem);

      container().dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(isOpen()).toBe(true);
    });

    it('closes on Escape', () => {
      openModal('Accenture', timelineItem);

      pressKey('Escape');

      expect(isOpen()).toBe(false);
    });

    it('restores page scrolling on close', () => {
      openModal('Accenture', timelineItem);
      expect(document.body.style.overflow).toBe('hidden');

      closeModal();

      expect(document.body.style.overflow).toBe('auto');
    });

    it('returns focus to the element that opened it', () => {
      const opener = document.getElementById('opener');
      opener?.focus();

      openModal('Accenture', timelineItem);
      finishOpenTransition();
      expect(document.activeElement).toBe(closeButton());

      closeModal();

      expect(document.activeElement).toBe(opener);
    });

    it('ignores Escape when the dialog is already closed', () => {
      const opener = document.getElementById('opener');
      opener?.focus();

      pressKey('Escape');

      // Nothing to undo: focus stays put and the page is not unlocked.
      expect(document.activeElement).toBe(opener);
      expect(document.body.style.overflow).toBe('');
    });

    it('drops the resume layout on close', () => {
      openResumeModal({ ...baseConfig, resumeUrl: 'https://example.com/cv' });
      expect(container().classList.contains('resume-modal')).toBe(true);

      closeModal();

      expect(container().classList.contains('resume-modal')).toBe(false);
    });
  });

  describe('focus trap', () => {
    beforeEach(() => {
      openModal('DataV', linkedProject);
      finishOpenTransition();
    });

    it('has the close button first and the last link last in the ring', () => {
      const ring = focusables();
      expect(ring[0]).toBe(closeButton());
      expect(ring).toHaveLength(3);
      expect(ring[2]?.getAttribute('href')).toBe('https://example.com');
    });

    it('wraps Tab from the last stop back to the first', () => {
      const ring = focusables();
      ring[ring.length - 1]?.focus();

      const event = pressKey('Tab');

      expect(event.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(ring[0]);
    });

    it('wraps Shift+Tab from the first stop back to the last', () => {
      const ring = focusables();
      ring[0]?.focus();

      const event = pressKey('Tab', true);

      expect(event.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(ring[ring.length - 1]);
    });

    it('leaves a Tab in the middle of the ring to the browser', () => {
      const ring = focusables();
      ring[1]?.focus();

      const event = pressKey('Tab');

      expect(event.defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(ring[1]);
    });

    it('pulls focus back in when it is outside the dialog', () => {
      document.getElementById('opener')?.focus();

      const event = pressKey('Tab');

      expect(event.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(focusables()[0]);
    });

    it('pulls focus to the last stop on Shift+Tab from outside the dialog', () => {
      document.getElementById('opener')?.focus();

      const event = pressKey('Tab', true);

      expect(event.defaultPrevented).toBe(true);
      const ring = focusables();
      expect(document.activeElement).toBe(ring[ring.length - 1]);
    });

    it('leaves other keys alone', () => {
      const ring = focusables();
      ring[1]?.focus();

      const event = pressKey('ArrowDown');

      expect(event.defaultPrevented).toBe(false);
      expect(isOpen()).toBe(true);
      expect(document.activeElement).toBe(ring[1]);
    });
  });

  describe('focus trap with a single stop', () => {
    it('keeps Tab on the only focusable element', () => {
      openModal('SMU', bareItem);
      finishOpenTransition();
      expect(focusables()).toEqual([closeButton()]);

      const event = pressKey('Tab');

      expect(event.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(closeButton());
    });
  });

  describe('openResumeModal', () => {
    it('embeds the configured resume url and marks the dialog full width', () => {
      openResumeModal({ ...baseConfig, resumeUrl: 'https://example.com/cv' });

      expect(isOpen()).toBe(true);
      expect(container().classList.contains('resume-modal')).toBe(true);
      expect(document.querySelector('.modal-iframe')?.getAttribute('src')).toBe(
        'https://example.com/cv'
      );
    });

    it('builds a Drive preview url from the drive id', () => {
      openResumeModal({ ...baseConfig, cvDriveId: 'abc123' });

      expect(document.querySelector('.modal-iframe')?.getAttribute('src')).toBe(
        'https://drive.google.com/file/d/abc123/preview'
      );
    });

    it('prefers an explicit resume url over the drive id', () => {
      openResumeModal({
        ...baseConfig,
        resumeUrl: 'https://example.com/cv',
        cvDriveId: 'abc123',
      });

      expect(document.querySelector('.modal-iframe')?.getAttribute('src')).toBe(
        'https://example.com/cv'
      );
    });

    it('uses the default resume title when none is configured', () => {
      openResumeModal({ ...baseConfig, resumeUrl: 'https://example.com/cv' });

      expect(document.getElementById('modal-title')?.textContent).toBe(DEFAULT_TEXT.resumeTitle);
      expect(document.querySelector('.modal-iframe')?.getAttribute('title')).toBe(
        DEFAULT_TEXT.resumeTitle
      );
    });

    it('uses the configured resume title', () => {
      openResumeModal({
        ...baseConfig,
        resumeUrl: 'https://example.com/cv',
        resumeTitle: 'Curriculum Vitae',
      });

      expect(document.getElementById('modal-title')?.textContent).toBe('Curriculum Vitae');
    });

    it('does nothing when neither a url nor a drive id is configured', () => {
      openResumeModal(baseConfig);

      expect(isOpen()).toBe(false);
      expect(container().classList.contains('resume-modal')).toBe(false);
      expect(document.body.style.overflow).toBe('');
    });
  });
});

/**
 * Declared last on purpose: it empties the document, and `initModal` would
 * add a second document-level keydown listener for every test that follows.
 */
describe('modal with the dialog markup absent', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    DOMUtils.clearCache();
  });

  it('wires nothing and throws nothing', () => {
    expect(() => initModal()).not.toThrow();
    expect(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }).not.toThrow();
  });

  it('openModal returns without locking the page', () => {
    openModal('Accenture', timelineItem);

    expect(document.body.style.overflow).toBe('');
  });

  it('openResumeModal returns without locking the page', () => {
    openResumeModal({ ...baseConfig, resumeUrl: 'https://example.com/cv' });

    expect(document.body.style.overflow).toBe('');
  });

  it('closeModal still unlocks the page', () => {
    expect(() => closeModal()).not.toThrow();

    expect(document.body.style.overflow).toBe('auto');
  });
});
