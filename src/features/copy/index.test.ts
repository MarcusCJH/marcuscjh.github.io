import { describe, it, expect, beforeEach } from 'vitest';
import { applyCopy } from './index';
import type { Config } from '../../types';

/**
 * Minimal slice of index.html: the section headers whose copy `applyCopy`
 * overwrites, plus the scroll cue, the drag hint and the search field.
 */
function buildFixture(): void {
  document.body.innerHTML = `
    <section id="timeline-section">
      <header class="section-header">
        <h2 class="section-title">timeline</h2>
        <p class="section-note">work · education · certification</p>
      </header>
      <div class="timeline-search">
        <input type="search" id="timeline-search" aria-label="Search timeline entries"
               placeholder="Search entries — e.g. Accenture, AWS" />
      </div>
      <p class="timeline-hint" aria-hidden="true">drag · scroll →</p>
    </section>
    <section id="showcase-section">
      <header class="section-header">
        <h2 class="section-title">projects</h2>
        <p class="section-note">selected work</p>
      </header>
    </section>
    <button class="scroll-arrow" type="button" aria-label="Scroll to timeline">scroll</button>
  `;
}

const baseConfig: Config = {
  name: 'marcuscjh',
  title: 'Engineer',
  subtitle: 'Cloud',
  typedMessages: [],
};

function text(selector: string): string | null {
  return document.querySelector(selector)?.textContent ?? null;
}

describe('applyCopy', () => {
  beforeEach(() => {
    buildFixture();
  });

  it('overwrites the title and note of each configured section', () => {
    applyCopy({
      ...baseConfig,
      sections: {
        timeline: { title: 'history', note: 'where I have been' },
        showcase: { title: 'work', note: 'things I built' },
      },
    });

    expect(text('#timeline-section .section-title')).toBe('history');
    expect(text('#timeline-section .section-note')).toBe('where I have been');
    expect(text('#showcase-section .section-title')).toBe('work');
    expect(text('#showcase-section .section-note')).toBe('things I built');
  });

  it('leaves the markup default in place for a field the config omits', () => {
    applyCopy({
      ...baseConfig,
      sections: { timeline: { title: 'history' } },
    });

    expect(text('#timeline-section .section-title')).toBe('history');
    // `note` was not supplied, so index.html's own copy must survive.
    expect(text('#timeline-section .section-note')).toBe('work · education · certification');
  });

  it('ignores a section id that has no matching element', () => {
    expect(() => {
      applyCopy({
        ...baseConfig,
        sections: { nonexistent: { title: 'nope', note: 'nope' } },
      });
    }).not.toThrow();

    expect(text('#timeline-section .section-title')).toBe('timeline');
  });

  it('leaves everything untouched when no sections are configured', () => {
    applyCopy(baseConfig);

    expect(text('#timeline-section .section-title')).toBe('timeline');
    expect(text('.scroll-arrow')).toBe('scroll');
  });

  it('writes the scroll cue and the drag hint', () => {
    applyCopy({ ...baseConfig, scrollCue: 'down', dragHint: 'pull me' });

    expect(text('.scroll-arrow')).toBe('down');
    expect(text('.timeline-hint')).toBe('pull me');
  });

  it('writes the search placeholder and accessible label as attributes', () => {
    applyCopy({
      ...baseConfig,
      searchPlaceholder: 'Find an entry',
      searchLabel: 'Search the timeline',
    });

    const search = document.querySelector('#timeline-search');
    expect(search?.getAttribute('placeholder')).toBe('Find an entry');
    expect(search?.getAttribute('aria-label')).toBe('Search the timeline');
  });

  it('keeps the existing attributes when the labels are absent', () => {
    applyCopy(baseConfig);

    const search = document.querySelector('#timeline-search');
    expect(search?.getAttribute('placeholder')).toBe('Search entries — e.g. Accenture, AWS');
    expect(search?.getAttribute('aria-label')).toBe('Search timeline entries');
  });

  it('treats an empty string as "not supplied" and keeps the default', () => {
    applyCopy({ ...baseConfig, scrollCue: '', searchPlaceholder: '' });

    expect(text('.scroll-arrow')).toBe('scroll');
    expect(document.querySelector('#timeline-search')?.getAttribute('placeholder')).toBe(
      'Search entries — e.g. Accenture, AWS'
    );
  });

  it('does not throw when the whole fixture is missing', () => {
    document.body.innerHTML = '';

    expect(() => {
      applyCopy({
        ...baseConfig,
        sections: { timeline: { title: 'history' } },
        scrollCue: 'down',
        searchPlaceholder: 'Find',
      });
    }).not.toThrow();
  });
});
