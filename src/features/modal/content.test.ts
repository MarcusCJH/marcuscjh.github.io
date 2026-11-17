import { describe, it, expect, beforeEach } from 'vitest';
import { setHtml } from '../../lib/html';
import { renderModalContent } from './content';
import type { ModalContent } from '../../types';

/** Renders into the dialog's content slot, as `openModal` does. */
function render(content: ModalContent): HTMLElement {
  const host = document.getElementById('modal-content');
  if (!host) {
    throw new Error('fixture is missing the modal content slot');
  }
  setHtml(host, renderModalContent(content));
  return host;
}

function body(): HTMLElement | null {
  return document.querySelector<HTMLElement>('#modal-content .modal-body');
}

describe('renderModalContent', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="modal-content" id="modal-content">
        <!-- Modal content is rendered at open time -->
      </div>
    `;
  });

  describe('column layout', () => {
    it('splits into two columns when there is both media and text', () => {
      render({ image: '/a.png', description: 'About this project.' });

      expect(body()?.classList.contains('modal-body--split')).toBe(true);
      expect(body()?.querySelector('.modal-figure')).not.toBeNull();
      expect(body()?.querySelector('.modal-text')).not.toBeNull();
    });

    it('stays single-column for media with no text beside it', () => {
      render({ image: '/a.png' });

      expect(body()?.classList.contains('modal-body--split')).toBe(false);
      expect(body()?.querySelector('.modal-figure')).not.toBeNull();
      expect(body()?.querySelector('.modal-text')).toBeNull();
    });

    it('stays single-column for text with no media', () => {
      render({ description: 'Just words.' });

      expect(body()?.classList.contains('modal-body--split')).toBe(false);
      expect(body()?.querySelector('.modal-figure')).toBeNull();
      expect(body()?.querySelector('.modal-text')).not.toBeNull();
    });

    it('keeps an embedded document full width even with text beside it', () => {
      render({ iframe: 'https://example.com/cv', description: 'My CV.' });

      expect(body()?.classList.contains('modal-body--split')).toBe(false);
      expect(body()?.querySelector('.modal-iframe')).not.toBeNull();
      expect(body()?.querySelector('.modal-text')).not.toBeNull();
    });

    it('renders an empty body for empty content', () => {
      render({});

      expect(body()).not.toBeNull();
      expect(body()?.querySelector('.modal-figure')).toBeNull();
      expect(body()?.querySelector('.modal-text')).toBeNull();
    });
  });

  describe('media', () => {
    it('renders a lazy image titled by the content title', () => {
      render({ title: 'DataV', image: '/datav.png' });

      const image = document.querySelector<HTMLImageElement>('.modal-media');
      expect(image?.tagName).toBe('IMG');
      expect(image?.getAttribute('src')).toBe('/datav.png');
      expect(image?.getAttribute('alt')).toBe('DataV');
      expect(image?.getAttribute('loading')).toBe('lazy');
      expect(image?.getAttribute('decoding')).toBe('async');
    });

    it('renders an empty alt when the content has no title', () => {
      render({ image: '/datav.png' });

      expect(document.querySelector('.modal-media')?.getAttribute('alt')).toBe('');
    });

    it('renders a video with its source and type, and a text fallback', () => {
      render({ video: { src: 'https://cdn.example.com/demo.mp4', type: 'video/mp4' } });

      const video = document.querySelector<HTMLVideoElement>('video.modal-media');
      expect(video).not.toBeNull();
      expect(video?.hasAttribute('controls')).toBe(true);
      expect(video?.getAttribute('preload')).toBe('metadata');
      const source = video?.querySelector('source');
      expect(source?.getAttribute('src')).toBe('https://cdn.example.com/demo.mp4');
      expect(source?.getAttribute('type')).toBe('video/mp4');
      expect(video?.textContent).toContain('does not support the video tag');
    });

    it('renders an iframe titled by the content title', () => {
      render({ title: 'Resume / CV', iframe: 'https://example.com/cv' });

      const iframe = document.querySelector<HTMLIFrameElement>('.modal-iframe');
      expect(iframe?.getAttribute('src')).toBe('https://example.com/cv');
      expect(iframe?.getAttribute('title')).toBe('Resume / CV');
      expect(iframe?.getAttribute('loading')).toBe('lazy');
    });

    it('stacks several media in the figure column, in source order', () => {
      render({
        image: '/a.png',
        video: { src: '/a.mp4', type: 'video/mp4' },
        iframe: 'https://example.com',
      });

      const figure = document.querySelector('.modal-figure');
      expect(Array.from(figure?.children ?? []).map(child => child.tagName)).toEqual([
        'IMG',
        'VIDEO',
        'IFRAME',
      ]);
    });
  });

  describe('text column', () => {
    it('renders the subtitle, location and description', () => {
      render({ subtitle: 'Accenture', location: 'Singapore', description: 'Built things.' });

      expect(document.querySelector('.modal-subtitle')?.textContent).toBe('Accenture');
      expect(document.querySelector('.modal-location span')?.textContent).toBe('Singapore');
      expect(document.querySelector('.modal-description')?.textContent).toBe('Built things.');
    });

    it('marks the location pin as decorative', () => {
      render({ location: 'Singapore' });

      expect(document.querySelector('.modal-location svg')?.getAttribute('aria-hidden')).toBe(
        'true'
      );
    });

    it('omits a text block that was not supplied', () => {
      render({ description: 'Only this.' });

      expect(document.querySelector('.modal-subtitle')).toBeNull();
      expect(document.querySelector('.modal-location')).toBeNull();
      expect(document.querySelector('.modal-details')).toBeNull();
      expect(document.querySelector('.modal-awards')).toBeNull();
      expect(document.querySelector('.modal-links')).toBeNull();
    });

    it('omits the detail, award and link blocks for empty arrays', () => {
      render({ details: [], awards: [], links: [] });

      expect(document.querySelector('.modal-details')).toBeNull();
      expect(document.querySelector('.modal-awards')).toBeNull();
      expect(document.querySelector('.modal-links')).toBeNull();
      expect(document.querySelector('.modal-text')).toBeNull();
    });

    it('escapes text that contains markup', () => {
      render({ description: '<script>alert(1)</script>' });

      expect(document.querySelectorAll('#modal-content script')).toHaveLength(0);
      expect(document.querySelector('.modal-description')?.textContent).toBe(
        '<script>alert(1)</script>'
      );
    });
  });

  describe('detail lines, whose shape carries their meaning', () => {
    function itemTexts(): (string | null)[] {
      return Array.from(document.querySelectorAll('.modal-details .detail-list > li')).map(item => {
        const nested = item.querySelector('.detail-list');
        nested?.remove();
        return item.textContent;
      });
    }

    it('renders a plain line as a bullet, with no glyph in the data', () => {
      render({ details: ['Shipped a thing'] });

      expect(itemTexts()).toEqual(['Shipped a thing']);
    });

    it('strips a hand-typed bullet so the marker is not doubled', () => {
      render({ details: ['• Shipped a thing', '  • And another'] });

      expect(itemTexts()).toEqual(['Shipped a thing', 'And another']);
    });

    it('collects consecutive lines into one list', () => {
      render({ details: ['One', 'Two', 'Three'] });

      expect(document.querySelectorAll('.modal-details .detail-list')).toHaveLength(1);
      expect(itemTexts()).toEqual(['One', 'Two', 'Three']);
    });

    it('keeps a group written entirely at one indent flat', () => {
      render({ details: ['  • one', '  • two'] });

      expect(itemTexts()).toEqual(['one', 'two']);
      expect(document.querySelectorAll('.modal-details .detail-list')).toHaveLength(1);
    });

    it('nests a deeper line inside the item above it', () => {
      render({ details: ['A role (2024)', '  • top', '    • nested'] });

      const outer = document.querySelector('.modal-details > .detail-list');
      const nested = outer?.querySelector('li > .detail-list');
      expect(Array.from(nested?.children ?? []).map(child => child.textContent)).toEqual([
        'nested',
      ]);
      expect(outer?.children).toHaveLength(1);
    });

    it('reads a line ending in a parenthesised date range as a role heading', () => {
      render({ details: ['Software Engineer - Aviation (2021 - Present)'] });

      expect(document.querySelector('.modal-details h3.detail-heading')?.textContent).toBe(
        'Software Engineer - Aviation (2021 - Present)'
      );
    });

    it('does not read parentheses in the middle of a line as a heading', () => {
      render({ details: ['Used Adobe Creative Suite (Premiere Pro, After Effects) daily'] });

      expect(document.querySelector('.modal-details h3')).toBeNull();
      expect(itemTexts()).toEqual([
        'Used Adobe Creative Suite (Premiere Pro, After Effects) daily',
      ]);
    });

    it('reads a line ending in a colon as a group label', () => {
      render({ details: ['Responsibilities:', 'Shipped a thing'] });

      expect(document.querySelector('.modal-details h4.detail-subheading')?.textContent).toBe(
        'Responsibilities:'
      );
      expect(itemTexts()).toEqual(['Shipped a thing']);
    });

    it('reads a line with indented lines under it as a group label', () => {
      render({ details: ['Yokohama Research Lab', '  • built a thing'] });

      expect(document.querySelector('.modal-details h4.detail-subheading')?.textContent).toBe(
        'Yokohama Research Lab'
      );
      expect(itemTexts()).toEqual(['built a thing']);
    });

    it('does not read an indented line as a heading', () => {
      render({ details: ['  Lead Engineer (2024)'] });

      expect(document.querySelector('.modal-details h3')).toBeNull();
      expect(itemTexts()).toEqual(['Lead Engineer (2024)']);
    });

    it('closes the open list on a blank line, without leaving a stray break', () => {
      render({ details: ['one', '   ', 'two'] });

      expect(document.querySelectorAll('.modal-details br')).toHaveLength(0);
      const lists = Array.from(document.querySelectorAll('.modal-details > .detail-list'));
      expect(lists.map(list => list.textContent)).toEqual(['one', 'two']);
    });

    it('keeps the detail blocks in source order', () => {
      render({
        details: ['Role (2021)', '  • did a thing', '', 'Summary:', 'The end'],
      });

      const blocks = Array.from(document.querySelector('.modal-details')?.children ?? []).map(
        child => `${child.tagName}.${child.className}`
      );
      expect(blocks).toEqual([
        'H3.detail-heading',
        'UL.detail-list',
        'H4.detail-subheading',
        'UL.detail-list',
      ]);
    });

    it('escapes a detail line that contains markup', () => {
      render({ details: ['<img src=x onerror=alert(1)>'] });

      expect(document.querySelectorAll('.modal-details img')).toHaveLength(0);
      expect(itemTexts()).toEqual(['<img src=x onerror=alert(1)>']);
    });
  });

  describe('awards', () => {
    it('joins the title, date and issuer into one line', () => {
      render({
        awards: [{ title: 'Best Project', date: '2023', issuer: 'SMU' }],
      });

      expect(document.querySelector('.modal-awards-list li')?.textContent).toBe(
        'Best Project · 2023 · SMU'
      );
    });

    it('omits the parts that were not supplied', () => {
      render({ awards: [{ title: 'Best Project' }, { title: 'Runner Up', issuer: 'SMU' }] });

      const lines = Array.from(document.querySelectorAll('.modal-awards-list li')).map(
        item => item.textContent
      );
      expect(lines).toEqual(['Best Project', 'Runner Up · SMU']);
    });

    it('appends a description as its own span', () => {
      render({ awards: [{ title: 'Best Project', description: 'Top of the cohort' }] });

      expect(document.querySelector('.award-description')?.textContent).toBe('— Top of the cohort');
    });

    it('heads the block with a decorative trophy and a visible label', () => {
      render({ awards: [{ title: 'Best Project' }] });

      const heading = document.querySelector('.modal-awards-title');
      expect(heading?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
      expect(heading?.querySelector('span')?.textContent).toBe('Awards');
    });
  });

  describe('links', () => {
    it('opens each link in a new tab with a safe rel', () => {
      render({ links: [{ text: 'Source', url: 'https://github.com/x' }] });

      const link = document.querySelector<HTMLAnchorElement>('.modal-link');
      expect(link?.getAttribute('href')).toBe('https://github.com/x');
      expect(link?.getAttribute('target')).toBe('_blank');
      expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
      expect(link?.querySelector('span')?.textContent).toBe('Source');
    });

    it('uses the external-link glyph for a "live" or "view" link and the code glyph otherwise', () => {
      render({
        links: [
          { text: 'View Live', url: 'https://example.com' },
          { text: 'view it', url: 'https://example.com' },
          { text: 'Source Code', url: 'https://github.com/x' },
        ],
      });

      // The two glyphs differ in their path count, which is how the set
      // distinguishes them without reaching into the raw markup.
      const glyphPathCounts = Array.from(document.querySelectorAll('.modal-link svg')).map(
        svg => svg.querySelectorAll('path').length
      );
      expect(glyphPathCounts[0]).toBe(glyphPathCounts[1]);
      expect(glyphPathCounts[2]).not.toBe(glyphPathCounts[0]);
    });

    it('renders one link per entry', () => {
      render({
        links: [
          { text: 'Source', url: 'https://github.com/x' },
          { text: 'Demo', url: 'https://example.com' },
        ],
      });

      expect(document.querySelectorAll('.modal-links .modal-link')).toHaveLength(2);
    });
  });
});
