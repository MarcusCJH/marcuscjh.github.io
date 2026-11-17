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
 * meaning.
 *
 * Anything that is not a heading is an item, and the stylesheet draws its
 * marker — a line is a bullet whether or not whoever wrote it remembered to
 * type a glyph. Half the entries in data.json were written without one, so
 * reading the glyph as the bullet left those modals as a wall of unmarked
 * lines. A leading bullet character is now stripped rather than relied on.
 *
 * What the remaining shapes mean:
 * - two spaces of leading indent nest an item under the one above it;
 * - a blank line closes the open list and starts a new group;
 * - a top-level line ending in a parenthesised date range is a role heading;
 * - a top-level line ending in a colon, or one that has indented lines under
 *   it, labels the group that follows rather than being an item in it.
 */

/** A line that ends in `(...)` naming a year or `Present` — a role's dates. */
const ROLE_DATES = /\([^()]*\b(?:\d{4}|present)\b[^()]*\)$/i;

/** A hand-typed marker at the head of a line, with any space after it. */
const BULLET = /^[•◦‣]\s*/;

interface DetailItem {
  depth: number;
  text: string;
}

function renderDetails(details: string[]): SafeHtml {
  const blocks: SafeHtml[] = [];
  let items: DetailItem[] = [];

  /** Closes the list being accumulated, if any, so a heading can follow it. */
  const flush = (): void => {
    if (items.length > 0) {
      blocks.push(renderDetailList(items));
      items = [];
    }
  };

  details.forEach((detail, index) => {
    const text = detail.trim();
    const indent = detail.length - detail.trimStart().length;

    if (text === '') {
      flush();
      return;
    }

    // A line someone did mark as a bullet is an item, whatever its shape:
    // only an unmarked line is a candidate for a heading.
    if (indent === 0 && !BULLET.test(text)) {
      const nextIndent = nextIndentOf(details, index);

      if (ROLE_DATES.test(text)) {
        flush();
        blocks.push(markup`<h3 class="detail-heading">${text}</h3>`);
        return;
      }

      if (text.endsWith(':') || nextIndent > indent) {
        flush();
        blocks.push(markup`<h4 class="detail-subheading">${text}</h4>`);
        return;
      }
    }

    items.push({ depth: Math.floor(indent / 2), text: stripBullet(text) });
  });

  flush();

  return markup`<div class="modal-details">${blocks}</div>`;
}

/** The indent of the next line with content, or -1 when there is none. */
function nextIndentOf(details: string[], index: number): number {
  for (let next = index + 1; next < details.length; next += 1) {
    const line = details[next] ?? '';
    if (line.trim() !== '') {
      return line.length - line.trimStart().length;
    }
  }
  return -1;
}

/** Drops a hand-typed marker, now that the stylesheet draws one. */
function stripBullet(text: string): string {
  return text.replace(BULLET, '');
}

/**
 * Builds one `<ul>`, nesting any run of deeper items inside the item they
 * follow. Depth is read relative to each run, so a group written entirely at
 * one indent is a flat list however deep that indent is.
 */
function renderDetailList(items: DetailItem[]): SafeHtml {
  const entries: SafeHtml[] = [];
  let index = 0;

  while (index < items.length) {
    const item = items[index];
    if (!item) {
      break;
    }

    let end = index + 1;
    while (end < items.length && (items[end]?.depth ?? 0) > item.depth) {
      end += 1;
    }

    const children = items.slice(index + 1, end);
    const nested = children.length > 0 ? renderDetailList(children) : '';
    entries.push(markup`<li>${item.text}${nested}</li>`);
    index = end;
  }

  return markup`<ul class="detail-list">${entries}</ul>`;
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
