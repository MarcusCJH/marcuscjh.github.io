import { CSS_CLASSES, DEFAULT_TEXT } from '../../lib/constants';
import { DOMUtils } from '../../lib/dom';
import { markup, setHtml } from '../../lib/html';
import type { Config, ModalContent, ShowcaseProject, TimelineItem } from '../../types';
import { renderModalContent } from './content';

/** Where focus goes back to when the dialog closes. */
let lastFocusedElement: HTMLElement | null = null;

/* The document-level keydown listener below is anonymous and never removed,
   so a second initModal() would run the focus trap twice per Tab: the second
   pass undoes the first and the trap silently stops holding focus. The app
   boots once, so this guard is belt and braces rather than a live fix. */
let initialised = false;

/**
 * Wire the dialog's dismissal paths: the close button, a click on the
 * backdrop, Escape, and Tab (which is kept inside the dialog).
 */
export function initModal(): void {
  if (initialised) {
    return;
  }
  initialised = true;

  const modalClose = DOMUtils.getElement('modal-close');
  const modalOverlay = DOMUtils.getElement('modal-overlay');

  modalClose?.addEventListener('click', () => closeModal());

  modalOverlay?.addEventListener('click', e => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  // Modal keyboard handling: Escape closes, Tab is trapped inside the dialog
  document.addEventListener('keydown', e => {
    const modal = DOMUtils.getElement('modal-overlay');
    if (!modal?.classList.contains(CSS_CLASSES.ACTIVE)) {
      return;
    }

    if (e.key === 'Escape') {
      closeModal();
      return;
    }

    if (e.key === 'Tab') {
      trapModalFocus(e);
    }
  });
}

export function openModal(title: string, data: TimelineItem | ShowcaseProject): void {
  const modal = DOMUtils.getElement('modal-overlay');
  const modalContainer = DOMUtils.getElement('modal-container');
  const modalTitle = DOMUtils.getElement('modal-title');
  const modalContent = DOMUtils.getElement('modal-content');

  if (!modal || !modalContainer || !modalTitle || !modalContent) {
    return;
  }

  modalContainer.classList.remove('resume-modal');
  modalTitle.textContent = title;
  setHtml(
    modalContent,
    data.modalContent
      ? renderModalContent(data.modalContent)
      : markup`<p class="modal-description">No additional information available.</p>`
  );
  modalContent.scrollTop = 0;

  lastFocusedElement = document.activeElement as HTMLElement | null;
  modal.classList.add(CSS_CLASSES.ACTIVE);
  document.body.style.overflow = 'hidden';
  focusModalClose(modal);
}

/** The `resume` nav item: the CV, embedded as a full-width document. */
export function openResumeModal(config: Config): void {
  const resumeUrl =
    config.resumeUrl ||
    (config.cvDriveId ? `https://drive.google.com/file/d/${config.cvDriveId}/preview` : '');
  if (!resumeUrl) {
    return;
  }
  const title = config.resumeTitle ?? DEFAULT_TEXT.resumeTitle;
  const resume: ShowcaseProject = {
    id: 'resume',
    title,
    backgroundImage: '',
    modalContent: { title, iframe: resumeUrl } satisfies ModalContent,
  };

  openModal(title, resume);
  DOMUtils.getElement('modal-container')?.classList.add('resume-modal');
}

export function closeModal(): void {
  DOMUtils.getElement('modal-overlay')?.classList.remove(CSS_CLASSES.ACTIVE);
  DOMUtils.getElement('modal-container')?.classList.remove('resume-modal');
  document.body.style.overflow = 'auto';
  lastFocusedElement?.focus();
  lastFocusedElement = null;
}

/**
 * Move focus to the modal's close button once the open transition finishes.
 * The overlay delays its `visibility` change until the fade-out completes,
 * so until the open transition fires the button can still compute as hidden
 * and be unfocusable. The timeout is the fallback if no transition runs.
 */
function focusModalClose(modal: HTMLElement): void {
  const closeButton = DOMUtils.getElement('modal-close');
  if (!closeButton) {
    return;
  }

  let focused = false;
  const tryFocus = () => {
    if (focused || !modal.classList.contains(CSS_CLASSES.ACTIVE)) {
      return;
    }
    focused = true;
    closeButton.focus();
  };

  modal.addEventListener('transitionend', tryFocus, { once: true });
  window.setTimeout(tryFocus, 400);
}

function trapModalFocus(e: KeyboardEvent): void {
  const container = DOMUtils.getElement('modal-container');
  if (!container) {
    return;
  }

  const focusable = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), iframe, video, input, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last) {
    return;
  }

  const active = document.activeElement;

  if (e.shiftKey && (active === first || !container.contains(active))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (active === last || !container.contains(active))) {
    e.preventDefault();
    first.focus();
  }
}
