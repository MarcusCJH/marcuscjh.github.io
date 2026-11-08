import { describe, expect, it } from 'vitest';
import { renderStaticContent } from './static-content.ts';
import { createSiteData } from '../test-fixtures.ts';

const TEMPLATE = [
  '<span class="brand-text"></span>',
  '<h1 class="hero-title"></h1>',
  '<p class="hero-role-title"></p>',
  '<p class="hero-role-sub"></p>',
  '<p class="hero-lead"></p>',
  '<!-- Navigation items are loaded from data.json -->',
  '<!-- Social links are loaded from data.json -->',
  '<!-- Timeline items are loaded from data.json -->',
  '<!-- Projects are loaded from data.json -->',
  '<span id="footer-brand"></span>',
  '<span id="footer-meta"></span>',
].join('\n');

describe('renderStaticContent', () => {
  const html = renderStaticContent(TEMPLATE, createSiteData());

  it('fills the hero and brand placeholders with escaped content', () => {
    expect(html).toContain('<span class="brand-text">tester</span>');
    expect(html).toContain('<h1 class="hero-title">Ada &quot;A&amp;B&quot; O&#39;Hara</h1>');
    expect(html).toContain('<p class="hero-role-title">Engineer &amp; Architect</p>');
    expect(html).toContain('<p class="hero-role-sub">Builds &lt;things&gt;</p>');
  });

  it('renders only enabled navigation items and maps home to the hero section', () => {
    expect(html).toContain('<a class="nav-item" href="#hero-section"><span>home</span></a>');
    expect(html).toContain(
      '<a class="nav-item" href="#timeline-section"><span>timeline</span></a>'
    );
    expect(html).not.toContain('href="#hidden-section"');
    expect(html.match(/class="nav-item"/g)).toHaveLength(2);
  });

  it('opens web social links in a new tab but not mailto links', () => {
    expect(html).toContain(
      '<a href="https://linkedin.example.com/in/ada" target="_blank" rel="noopener noreferrer" class="social-link">'
    );
    expect(html).toContain('<a href="mailto:ada@example.com" class="social-link">');
  });

  it('sorts timeline entries newest first and tags each category', () => {
    const order = [...html.matchAll(/<h3>([^<]+)<\/h3>/g)].map(match => match[1]);
    expect(order).toEqual(['Current Employer', 'Cert Issuer', 'Old Employer', 'Polytechnic']);
    expect(html).toContain('<div class="timeline-tag">certification</div>');
  });

  it('links each showcase card to its project page and eagerly loads early images', () => {
    expect(html).toContain('<a href="/projects/alpha/">Alpha &amp; Co</a>');
    expect(html).toContain('loading="eager"');
    expect(html).toContain('<span class="tech-badge">TypeScript</span>');
  });

  it('fills the footer brand and email', () => {
    expect(html).toContain('<span id="footer-brand">Ada &quot;A&amp;B&quot; O&#39;Hara</span>');
    expect(html).toContain('<a href="mailto:ada@example.com">ada@example.com</a>');
  });
});
