import { describe, expect, it } from 'vitest';
import { renderProjectPage } from './project-page.ts';
import { createSiteData, parseJson } from '../test-fixtures.ts';
import type { ProjectPageSchema } from '../types.ts';

const MODIFIED = '2026-11-08T12:34:56.000Z';

function render(projectIndex: number): string {
  const data = createSiteData();
  return renderProjectPage({
    data,
    project: data.showcase[projectIndex]!,
    projectIndex,
    cssHref: '/assets/index-abc123.css',
    dataModifiedIso: MODIFIED,
  });
}

describe('renderProjectPage', () => {
  const html = render(0);

  it('renders a complete, canonical HTML document', () => {
    expect(html.startsWith('<!doctype html>\n<html lang="en-SG">')).toBe(true);
    expect(html.trimEnd().endsWith('</html>')).toBe(true);
    expect(html).toContain('<link rel="canonical" href="https://example.com/projects/alpha/">');
    expect(html).toContain('<link rel="stylesheet" href="/assets/index-abc123.css">');
  });

  it('escapes content interpolated into text and attributes', () => {
    expect(html).toContain('<title>Alpha &amp; Co | Ada &quot;A&amp;B&quot; O&#39;Hara Project');
    expect(html).toContain('<h1>Alpha &amp; Co</h1>');
  });

  it('shows the modal title as a subtitle and the technologies as a list', () => {
    expect(html).toContain('<p class="case-study-subtitle">Alpha: the long title</p>');
    expect(html).toContain('<li>TypeScript</li><li>Vite</li>');
  });

  it('stamps the data.json modification date', () => {
    expect(html).toContain('<time datetime="2026-11-08">2026-11-08</time>');
  });

  it('embeds a JSON-LD graph with breadcrumbs and the project entity', () => {
    const match = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
    expect(match).not.toBeNull();
    const graph = parseJson<ProjectPageSchema>(match![1]!.replace(/\\u003c/g, '<'));
    expect(graph['@graph'][0]['@type']).toBe('BreadcrumbList');
    expect(graph['@graph'][0].itemListElement[1]!.item).toBe('https://example.com/projects/alpha/');
    expect(graph['@graph'][1]).toMatchObject({
      '@type': 'SoftwareApplication',
      '@id': 'https://example.com/projects/alpha/#project',
      applicationCategory: 'WebApplication',
      keywords: ['TypeScript', 'Vite'],
      dateModified: MODIFIED,
      creator: { '@id': 'https://example.com/#person' },
    });
  });

  it('marks third-party links as external and internal ones as not', () => {
    expect(html).toContain(
      '<a class="case-study-link" href="https://alpha.example.com/" target="_blank" rel="noopener noreferrer">'
    );
    expect(html).toContain('<a class="case-study-link" href="https://example.com/alpha/">');
  });

  it('wraps pagination around the showcase list', () => {
    expect(html).toContain('<a href="/projects/datav-webinar/"><span>Previous project</span>');
    expect(html).toContain('<a href="/projects/datav-webinar/"><span>Next project</span>');
  });
});

describe('renderProjectPage for a creative work', () => {
  const html = render(1);

  it('types the entity as a CreativeWork', () => {
    const match = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
    const graph = parseJson<ProjectPageSchema>(match![1]!.replace(/\\u003c/g, '<'));
    expect(graph['@graph'][1]['@type']).toBe('CreativeWork');
    expect(graph['@graph'][1]).not.toHaveProperty('applicationCategory');
  });

  it('renders the video and falls back to the default social image as given', () => {
    expect(html).toContain('<source src="https://cdn.example.com/talk.mp4" type="video/mp4">');
    expect(html).toContain('<meta property="og:image" content="./showcase/hero&amp;main.png">');
    expect(html).not.toContain('<figure class="case-study-figure">');
  });

  it('notes the absence of public links', () => {
    expect(html).toContain(
      '<p class="case-study-link-note">This project does not currently have a public link.</p>'
    );
  });
});
