import { escapeHtml } from '../lib/escape.ts';
import type { SiteData } from '../types.ts';

/** Human label shown on a timeline card for each data.json category. */
const CATEGORY_LABELS: Record<string, string> = {
  work: 'work',
  education: 'education',
  certification: 'certification',
};

function renderNavigation(data: SiteData): string {
  return data.navigation
    .filter(item => item.enabled)
    .map(item => {
      const target = item.id === 'home' ? 'hero-section' : `${item.id}-section`;
      return `<a class="nav-item" href="#${escapeHtml(target)}"><span>${escapeHtml(item.title)}</span></a>`;
    })
    .join('\n');
}

function renderSocialLinks(data: SiteData): string {
  return data.social
    .map(item => {
      const label = item.platform || item.name || item.url;
      const external = item.url.startsWith('mailto:')
        ? ''
        : ' target="_blank" rel="noopener noreferrer"';
      return `<a href="${escapeHtml(item.url)}"${external} class="social-link"><span>${escapeHtml(label)}</span></a>`;
    })
    .join('\n');
}

function renderTimeline(data: SiteData): string {
  return [...data.timeline]
    .sort((a, b) => b.order - a.order)
    .map((item, index) => {
      const dates = `${escapeHtml(item.startDate)}${item.endDate ? ` — ${escapeHtml(item.endDate)}` : ''}`;
      return `<article class="timeline-item visible" data-category="${escapeHtml(item.category)}" style="--item-index: ${index}">
        <div class="timeline-dot ${escapeHtml(item.category)}" aria-hidden="true"></div>
        <div class="timeline-content">
          <div class="timeline-date">${dates}</div>
          <h3>${escapeHtml(item.company)}</h3>
          <p>${escapeHtml(item.title)}</p>
          <div class="timeline-tag">${escapeHtml(CATEGORY_LABELS[item.category] || item.category)}</div>
        </div>
      </article>`;
    })
    .join('\n');
}

function renderShowcase(data: SiteData): string {
  return data.showcase
    .map((project, index) => {
      const description = project.modalContent?.description || '';
      const title = `<a href="/projects/${encodeURIComponent(project.id)}/">${escapeHtml(project.title)}</a>`;
      const media = project.backgroundImage
        ? `<img class="showcase-media" src="${escapeHtml(project.backgroundImage)}" alt="${escapeHtml(project.title)} project preview" loading="${index < 3 ? 'eager' : 'lazy'}" decoding="async">`
        : '';
      const tech = project.technologies?.length
        ? `<div class="tech-stack">${project.technologies.map(item => `<span class="tech-badge">${escapeHtml(item)}</span>`).join('')}</div>`
        : '';
      return `<article class="showcase-card">
        <div class="showcase-image">${media}<div class="showcase-overlay" aria-hidden="true"></div><span class="showcase-index" aria-hidden="true"></span></div>
        <div class="showcase-content">
          <h3 class="showcase-title"><span>${title}</span></h3>
          ${description ? `<p class="showcase-description">${escapeHtml(description)}</p>` : ''}
          ${tech}
        </div>
      </article>`;
    })
    .join('\n');
}

/**
 * Fill the empty placeholders in `index.html` with the content from data.json
 * so the home page is meaningful before any JavaScript runs.
 */
export function renderStaticContent(html: string, data: SiteData): string {
  const { config } = data;
  const name = config.real_name || config.name;

  const textReplacements = new Map([
    [
      '<span class="brand-text"></span>',
      `<span class="brand-text">${escapeHtml(config.name)}</span>`,
    ],
    ['<p class="loading-logo"></p>', `<p class="loading-logo">${escapeHtml(config.name)}</p>`],
    [
      '<span class="hero-handle-text"></span>',
      `<span class="hero-handle-text">${escapeHtml(config.name)}</span>`,
    ],
    ['<h1 class="hero-title"></h1>', `<h1 class="hero-title">${escapeHtml(name)}</h1>`],
    [
      '<p class="hero-role-title"></p>',
      `<p class="hero-role-title">${escapeHtml(config.title)}</p>`,
    ],
    [
      '<p class="hero-role-sub"></p>',
      `<p class="hero-role-sub">${escapeHtml(config.subtitle)}</p>`,
    ],
    ['<p class="hero-lead"></p>', `<p class="hero-lead">${escapeHtml(config.summary || '')}</p>`],
  ]);
  for (const [placeholder, content] of textReplacements) {
    html = html.replace(placeholder, content);
  }

  html = html.replace(
    '<!-- Navigation items are loaded from data.json -->',
    renderNavigation(data)
  );
  html = html.replace('<!-- Social links are loaded from data.json -->', renderSocialLinks(data));
  html = html.replace('<!-- Timeline items are loaded from data.json -->', renderTimeline(data));
  html = html.replace('<!-- Projects are loaded from data.json -->', renderShowcase(data));

  html = html.replace(
    '<span id="footer-brand"></span>',
    `<span id="footer-brand">${escapeHtml(name)}</span>`
  );
  if (config.email) {
    html = html.replace(
      '<span id="footer-meta"></span>',
      `<span id="footer-meta"><a href="mailto:${escapeHtml(config.email)}">${escapeHtml(config.email)}</a></span>`
    );
  }

  return html;
}
