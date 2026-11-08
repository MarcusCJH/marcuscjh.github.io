import { describe, it, expect, beforeEach } from 'vitest';
import { hideDisabledSections } from './sections';
import type { NavigationItem } from '../../types';

function navItem(id: string, enabled: boolean): NavigationItem {
  return { id, title: id, icon: '', enabled };
}

/** The <main> sections of index.html, by id. */
function buildFixture(): void {
  document.body.innerHTML = `
    <main id="main">
      <section class="hero-section" id="hero-section"></section>
      <section class="content-section shell" id="timeline-section"></section>
      <section class="content-section shell" id="showcase-section"></section>
    </main>
  `;
}

function hidden(id: string): boolean | 'until-found' | undefined {
  return document.querySelector<HTMLElement>(`#${id}`)?.hidden;
}

describe('hideDisabledSections', () => {
  beforeEach(() => {
    buildFixture();
  });

  it('hides a section whose nav entry is disabled', () => {
    hideDisabledSections([navItem('timeline', false), navItem('showcase', true)]);

    expect(hidden('timeline-section')).toBe(true);
    expect(hidden('showcase-section')).toBe(false);
  });

  it('reveals a section that had been hidden once its nav entry is enabled', () => {
    hideDisabledSections([navItem('timeline', false)]);
    expect(hidden('timeline-section')).toBe(true);

    hideDisabledSections([navItem('timeline', true)]);

    expect(hidden('timeline-section')).toBe(false);
  });

  it('never touches the hero, which has no section of its own to hide', () => {
    hideDisabledSections([navItem('home', false)]);

    expect(hidden('hero-section')).toBe(false);
  });

  it('ignores a nav entry with no matching section', () => {
    expect(() => hideDisabledSections([navItem('contact', false)])).not.toThrow();

    expect(document.querySelector('#contact-section')).toBeNull();
    expect(hidden('timeline-section')).toBe(false);
  });

  it('does nothing for an empty navigation list', () => {
    hideDisabledSections([]);

    expect(hidden('timeline-section')).toBe(false);
    expect(hidden('showcase-section')).toBe(false);
  });
});
