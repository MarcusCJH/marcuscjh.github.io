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
    it('reads a line with parentheses as a role heading', () => {
      render({ details: ['Software Engineer (2021 — Present)'] });

      const heading = document.querySelector('.modal-details h3.detail-heading');
      expect(heading?.textContent).toBe('Software Engineer (2021 — Present)');
    });

    it('reads a line ending in a colon as a subheading', () => {
      render({ details: ['Responsibilities:'] });

      expect(document.querySelector('.modal-details h4.detail-subheading')?.textContent).toBe(
        'Responsibilities:'
      );
    });

    it('reads any other top-level line as plain text', () => {
      render({ details: ['Shipped a thing'] });

      expect(document.querySelector('.modal-details .detail-text')?.textContent).toBe(
        'Shipped a thing'
      );
    });

    it('renders a blank line as a break', () => {
      render({ details: ['   '] });

      expect(document.querySelectorAll('.modal-details br')).toHaveLength(1);
      expect(document.querySelectorAll('.modal-details .detail-text')).toHaveLength(0);
    });

    it('indents a nested line by two spaces per level', () => {
      render({ details: ['  one level', '    two levels'] });

      const lines = Array.from(
        document.querySelectorAll<HTMLElement>('.modal-details .detail-line')
      );
      expect(lines.map(line => line.textContent)).toEqual(['one level', 'two levels']);
      expect(lines[0]?.style.marginLeft).toBe('1.5rem');
      expect(lines[1]?.style.marginLeft).toBe('3rem');
    });

    it('marks an indented bullet line as a bullet', () => {
      render({ details: ['  • a bullet'] });

      const bullet = document.querySelector<HTMLElement>('.modal-details .detail-bullet');
      expect(bullet?.textContent).toBe('• a bullet');
      expect(bullet?.style.marginLeft).toBe('1.5rem');
    });

    it('does not read an indented line as a heading', () => {
      render({ details: ['  Lead Engineer (2024)'] });

      expect(document.querySelector('.modal-details h3')).toBeNull();
      expect(document.querySelector('.modal-details .detail-line')?.textContent).toBe(
        'Lead Engineer (2024)'
      );
    });

    it('keeps the detail lines in source order', () => {
      render({ details: ['Role (2021)', 'Summary:', '  • did a thing', '', 'The end'] });

      const classes = Array.from(document.querySelector('.modal-details')?.children ?? []).map(
        child => `${child.tagName}.${child.className}`
      );
      expect(classes).toEqual([
        'H3.detail-heading',
        'H4.detail-subheading',
        'DIV.detail-bullet',
        'BR.',
        'DIV.detail-text',
      ]);
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
