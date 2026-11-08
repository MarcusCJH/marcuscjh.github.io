import type { Config } from '../../types';

/**
 * Writes the labels from `config` over whatever index.html already
 * contains. The markup keeps meaningful defaults so the page reads
 * correctly before the fetch resolves and for crawlers that do not run
 * scripts; this only overrides what is actually supplied.
 */
export function applyCopy(config: Config): void {
  const setText = (selector: string, value?: string) => {
    const el = document.querySelector<HTMLElement>(selector);
    if (el && value) {
      el.textContent = value;
    }
  };
  const setAttr = (selector: string, attr: string, value?: string) => {
    const el = document.querySelector(selector);
    if (el && value) {
      el.setAttribute(attr, value);
    }
  };

  Object.entries(config.sections ?? {}).forEach(([id, text]) => {
    setText(`#${id}-section .section-title`, text.title);
    setText(`#${id}-section .section-note`, text.note);
  });

  setText('.scroll-arrow', config.scrollCue);
  setText('.timeline-hint', config.dragHint);
  setAttr('#timeline-search', 'placeholder', config.searchPlaceholder);
  setAttr('#timeline-search', 'aria-label', config.searchLabel);
}
