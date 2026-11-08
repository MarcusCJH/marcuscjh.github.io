import { DOMUtils } from '../../lib/dom';
import { TypedText } from '../../components/TypedText';
import type { Config } from '../../types';

/**
 * The terminal line under the hero title. With reduced motion requested the
 * first message is written out once instead of being typed on a loop.
 */
export function initTypedIntro(messages?: string[]): void {
  if (!messages?.length) {
    return;
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const typedElement = DOMUtils.getElement('typed-text');
    if (typedElement) {
      typedElement.textContent = messages[0] ?? '';
    }
    return;
  }

  new TypedText(messages);
}

/** Hero copy, the brand marks that repeat it, and the scroll cue. */
export function initHero(config: Config): void {
  const setText = (selector: string, value?: string) => {
    const element = document.querySelector<HTMLElement>(selector);
    if (element && value) {
      element.textContent = value;
    }
  };

  const displayName = config.real_name || config.name;

  setText('.brand-text', config.name);
  setText('.loading-logo', config.name);
  setText('.hero-handle-text', config.name);
  setText('.hero-title', displayName);
  setText('.hero-role-title', config.title);
  setText('.hero-role-sub', config.subtitle);
  setText('.hero-lead', config.summary);

  // Scroll cue at the foot of the hero.
  document.querySelector<HTMLElement>('.scroll-arrow')?.addEventListener('click', () => {
    document.getElementById('timeline-section')?.scrollIntoView({ behavior: 'smooth' });
  });
}
