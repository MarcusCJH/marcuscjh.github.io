import { DOMUtils } from '../../lib/dom';
import { markup, setHtml } from '../../lib/html';
import type { Config } from '../../types';

export function initFooter(config: Config): void {
  const brand = DOMUtils.getElement('footer-brand');
  const meta = DOMUtils.getElement('footer-meta');

  if (brand) {
    brand.textContent = `${config.real_name || config.name} — ${new Date().getFullYear()}`;
  }

  if (meta && config.email) {
    setHtml(meta, markup`<a href="mailto:${config.email}">${config.email}</a>`);
  }
}
