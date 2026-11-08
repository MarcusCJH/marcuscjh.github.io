import { markup, setHtml, unsafeHtml } from '../../lib/html';
import { icon } from '../../lib/icons';
import { SELECTORS } from '../../lib/constants';
import type { SocialLink } from '../../types';

export function initSocials(socialLinks: SocialLink[]): void {
  const socialLinksContainers = document.querySelectorAll(SELECTORS.SOCIAL_LINKS);

  if (!socialLinks || socialLinksContainers.length === 0) {
    return;
  }

  // Named text links rather than a row of brand circles: the label is the
  // accessible name, it needs no brand glyph, and it reads as editorial.
  const socialHtml = socialLinks.map(social => {
    const label = social.platform || social.name || social.url;
    return markup`
        <a href="${social.url}" target="_blank" rel="noopener noreferrer" class="social-link">
          <span>${label}</span>${unsafeHtml(icon('arrow-up-right'))}
        </a>
      `;
  });

  socialLinksContainers.forEach(container => {
    setHtml(container, socialHtml);
  });
}
