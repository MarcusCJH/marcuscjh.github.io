import { markup, unsafeHtml, type SafeHtml } from '../../lib/html';
import { icon } from '../../lib/icons';
import type { ModalContent, ModalContentAward } from '../../types';

/**
 * Splits a project into a media column and a text column.
 *
 * Stacked in one narrow scroller, a tall screenshot pushed everything that
 * explains it below the fold, so opening a project showed a picture and
 * little else. Side by side on a wide screen the whole thing is readable
 * at once, and on a narrow one it falls back to a single column inside a
 * full-height sheet. An embedded document (the CV) stays full width —
 * there is no text beside it to pair with.
 */
export function renderModalContent(content: ModalContent): SafeHtml {
  const media: SafeHtml[] = [];
  const text: SafeHtml[] = [];

  if (content.image) {
    media.push(
      markup`<img class="modal-media" src="${content.image}" alt="${content.title ?? ''}" loading="lazy" decoding="async">`
    );
  }

  if (content.video) {
    media.push(markup`
        <video class="modal-media" controls preload="metadata">
          <source src="${content.video.src}" type="${content.video.type}">
          Your browser does not support the video tag.
        </video>
      `);
  }

  if (content.iframe) {
    media.push(
      markup`<iframe class="modal-iframe" src="${content.iframe}" title="${content.title ?? ''}" loading="lazy"></iframe>`
    );
  }

  if (content.subtitle) {
    text.push(markup`<h2 class="modal-subtitle">${content.subtitle}</h2>`);
  }

  if (content.location) {
    text.push(
      markup`<p class="modal-location">${unsafeHtml(icon('map-marker-alt'))}<span>${content.location}</span></p>`
    );
  }

  if (content.description) {
    text.push(markup`<p class="modal-description">${content.description}</p>`);
  }

  if (content.details && content.details.length > 0) {
    text.push(renderDetails(content.details));
  }

  if (content.awards && content.awards.length > 0) {
    text.push(renderAwards(content.awards));
  }

  if (content.links && content.links.length > 0) {
    text.push(renderLinks(content.links));
  }

  const splittable = media.length > 0 && text.length > 0 && !content.iframe;
  const classes = `modal-body${splittable ? ' modal-body--split' : ''}`;

  return markup`<div class="${classes}">
      ${media.length ? markup`<div class="modal-figure">${media}</div>` : ''}
      ${text.length ? markup`<div class="modal-text">${text}</div>` : ''}
    </div>`;
}

/**
 * Detail lines are plain strings in data.json whose shape carries their
 * meaning: two spaces of leading indent nest a line, a trailing colon is a
 * subheading, and parentheses mark a role heading.
 */
function renderDetails(details: string[]): SafeHtml {
  const lines: SafeHtml[] = [];

  details.forEach(detail => {
    const trimmedDetail = detail.trim();
    const leadingSpaces = detail.length - detail.trimStart().length;

    if (trimmedDetail === '') {
      lines.push(markup`<br>`);
    } else if (leadingSpaces > 0) {
      const indentLevel = Math.floor(leadingSpaces / 2);
      const indentStyle = `margin-left: ${indentLevel * 1.5}rem;`;
      const lineClass = trimmedDetail.startsWith('•') ? 'detail-bullet' : 'detail-line';
      lines.push(markup`<div class="${lineClass}" style="${indentStyle}">${trimmedDetail}</div>`);
    } else {
      if (trimmedDetail.includes('(') && trimmedDetail.includes(')')) {
        lines.push(markup`<h3 class="detail-heading">${trimmedDetail}</h3>`);
      } else if (trimmedDetail.endsWith(':')) {
        lines.push(markup`<h4 class="detail-subheading">${trimmedDetail}</h4>`);
      } else {
        lines.push(markup`<div class="detail-text">${trimmedDetail}</div>`);
      }
    }
  });

  return markup`<div class="modal-details">${lines}</div>`;
}

function renderAwards(awards: ModalContentAward[]): SafeHtml {
  const items = awards.map(award => {
    const parts: string[] = [award.title];
    if (award.date) {
      parts.push(award.date);
    }
    if (award.issuer) {
      parts.push(award.issuer);
    }
    const line = parts.join(' · ');
    const desc = award.description
      ? markup` <span class="award-description">— ${award.description}</span>`
      : '';
    return markup`<li>${line}${desc}</li>`;
  });

  return markup`<div class="modal-awards"><h3 class="modal-awards-title">${unsafeHtml(
    icon('trophy')
  )}<span>Awards</span></h3><ul class="modal-awards-list">${items}</ul></div>`;
}

function renderLinks(links: { text: string; url: string }[]): SafeHtml {
  const items = links.map(link => {
    const isLive =
      link.text.toLowerCase().includes('live') || link.text.toLowerCase().includes('view');
    return markup`<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="modal-link">${unsafeHtml(
      icon(isLive ? 'external-link-alt' : 'code')
    )}<span>${link.text}</span></a>`;
  });

  return markup`<div class="modal-links">${items}</div>`;
}
