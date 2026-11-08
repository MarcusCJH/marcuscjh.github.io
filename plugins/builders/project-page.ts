import { escapeHtml, safeJsonLd } from '../lib/escape.ts';
import { truncateDescription } from '../lib/text.ts';
import { absoluteUrl, normalizeBaseUrl, rootAssetPath } from '../lib/urls.ts';
import { isCreativeWork } from './schema.ts';
import type {
  ProjectEntitySchema,
  ProjectPageSchema,
  ProjectSchemaType,
  ShowcaseProject,
  SiteData,
} from '../types.ts';

export interface ProjectPageOptions {
  /** Full site data (needed for author details and adjacent-project links). */
  data: SiteData;
  /** The project this page describes. */
  project: ShowcaseProject;
  /** Index of the project inside `data.showcase`. */
  projectIndex: number;
  /** Href of the stylesheet to link (hashed asset in build, source file in dev). */
  cssHref: string;
  /** ISO timestamp of the last data.json change. */
  dataModifiedIso: string;
}

interface ProjectSchemaOptions {
  project: ShowcaseProject;
  authorName: string;
  baseUrl: string;
  canonicalUrl: string;
  fullTitle: string;
  description: string;
  imageUrl: string;
  schemaType: ProjectSchemaType;
  dataModifiedIso: string;
}

/** JSON-LD `@graph` (breadcrumbs + the project entity) for one project page. */
export function buildProjectPageSchema(options: ProjectSchemaOptions): ProjectPageSchema {
  const { project, authorName, baseUrl, canonicalUrl, schemaType } = options;
  const entity: ProjectEntitySchema = {
    '@type': schemaType,
    '@id': `${canonicalUrl}#project`,
    name: options.fullTitle,
    description: options.description,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    ...(options.imageUrl ? { image: options.imageUrl } : {}),
    ...(project.technologies?.length ? { keywords: project.technologies } : {}),
    ...(schemaType === 'SoftwareApplication'
      ? { applicationCategory: 'WebApplication', operatingSystem: 'Web' }
      : {}),
    dateModified: options.dataModifiedIso,
    creator: {
      '@type': 'Person',
      '@id': `${baseUrl}/#person`,
      name: authorName,
    },
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: `${authorName} portfolio`,
            item: `${baseUrl}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: project.title,
            item: canonicalUrl,
          },
        ],
      },
      entity,
    ],
  };
}

/** Render the standalone, prerendered case-study page for one project. */
export function renderProjectPage(options: ProjectPageOptions): string {
  const { data, project, projectIndex, cssHref, dataModifiedIso } = options;
  const { config, seo, showcase } = data;
  const authorName = config.real_name || config.name;
  const baseUrl = normalizeBaseUrl(seo.defaults?.url || config.website || '');
  const canonicalUrl = `${baseUrl}/projects/${encodeURIComponent(project.id)}/`;
  const fullTitle = project.modalContent?.title || project.title;
  const description = project.modalContent?.description || `${project.title} by ${authorName}.`;
  const metaDescription = truncateDescription(description);
  const imagePath = project.modalContent?.image || project.backgroundImage || '';
  const imageUrl = imagePath ? absoluteUrl(imagePath, baseUrl) : seo.defaults?.image || '';
  const modifiedDate = dataModifiedIso.split('T')[0];
  const schemaType: ProjectSchemaType = isCreativeWork(project.id)
    ? 'CreativeWork'
    : 'SoftwareApplication';
  const projectSchema = buildProjectPageSchema({
    project,
    authorName,
    baseUrl,
    canonicalUrl,
    fullTitle,
    description,
    imageUrl,
    schemaType,
    dataModifiedIso,
  });

  const subtitle =
    fullTitle !== project.title
      ? `<p class="case-study-subtitle">${escapeHtml(fullTitle)}</p>`
      : '';
  const technologyMarkup = project.technologies?.length
    ? `<ul class="case-study-tech" aria-label="Technologies used">${project.technologies
        .map(technology => `<li>${escapeHtml(technology)}</li>`)
        .join('')}</ul>`
    : '';
  const linksMarkup = project.modalContent?.links?.length
    ? project.modalContent.links
        .map(link => {
          const isExternal = /^https?:\/\//i.test(link.url) && !link.url.startsWith(baseUrl);
          const externalAttrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
          return `<a class="case-study-link" href="${escapeHtml(link.url)}"${externalAttrs}><span>${escapeHtml(project.title)}: ${escapeHtml(link.text)}</span><span aria-hidden="true">${isExternal ? 'External' : 'Open'}</span></a>`;
        })
        .join('')
    : '<p class="case-study-link-note">This project does not currently have a public link.</p>';
  const mediaMarkup = imagePath
    ? `<figure class="case-study-figure">
        <img src="${escapeHtml(rootAssetPath(imagePath))}" alt="${escapeHtml(project.title)} project interface" decoding="async" fetchpriority="high">
        <figcaption>${escapeHtml(project.title)} project preview</figcaption>
      </figure>`
    : '';
  const videoMarkup = project.modalContent?.video
    ? `<div class="case-study-video-wrap">
        <video class="case-study-video" controls preload="metadata">
          <source src="${escapeHtml(project.modalContent.video.src)}" type="${escapeHtml(project.modalContent.video.type)}">
          Your browser does not support embedded video.
        </video>
      </div>`
    : '';
  // `projectIndex` is `project`'s own position in `showcase`, so both
  // wrap-around indexes are in range; with a single project they are it.
  const previous = showcase[(projectIndex - 1 + showcase.length) % showcase.length] ?? project;
  const next = showcase[(projectIndex + 1) % showcase.length] ?? project;

  return `<!doctype html>
<html lang="en-SG">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(project.title)} | ${escapeHtml(authorName)} Project</title>
    <meta name="description" content="${escapeHtml(metaDescription)}">
    <meta name="author" content="${escapeHtml(authorName)}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta name="theme-color" content="${escapeHtml(seo.meta?.themeColor || '#c6f24e')}">
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=JetBrains+Mono:wght@300..700&display=swap">
    <link rel="stylesheet" href="${escapeHtml(cssHref)}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
    <meta property="og:title" content="${escapeHtml(`${project.title} | ${authorName} Project`)}">
    <meta property="og:description" content="${escapeHtml(metaDescription)}">
    <meta property="og:site_name" content="${escapeHtml(authorName)} | Portfolio">
    <meta property="og:locale" content="en_SG">
    ${imageUrl ? `<meta property="og:image" content="${escapeHtml(imageUrl)}"><meta property="og:image:alt" content="${escapeHtml(project.title)} project preview">` : ''}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(`${project.title} | ${authorName} Project`)}">
    <meta name="twitter:description" content="${escapeHtml(metaDescription)}">
    ${imageUrl ? `<meta name="twitter:image" content="${escapeHtml(imageUrl)}"><meta name="twitter:image:alt" content="${escapeHtml(project.title)} project preview">` : ''}
    <script type="application/ld+json">${safeJsonLd(projectSchema)}</script>
  </head>
  <body class="case-study-page">
    <div class="field" aria-hidden="true"></div>
    <a class="skip-link" href="#main">Skip to project</a>
    <header class="case-study-nav">
      <a class="case-study-brand" href="/" aria-label="${escapeHtml(authorName)} portfolio home"><span aria-hidden="true"></span>${escapeHtml(config.name)}</a>
      <a class="case-study-back" href="/#showcase-section">All projects</a>
    </header>
    <main id="main" class="case-study-main">
      <article>
        <header class="case-study-hero shell">
          <p class="case-study-eyebrow">Project case study <span>${String(projectIndex + 1).padStart(2, '0')} / ${String(showcase.length).padStart(2, '0')}</span></p>
          <h1>${escapeHtml(project.title)}</h1>
          ${subtitle}
          <p class="case-study-lead">${escapeHtml(description)}</p>
          ${technologyMarkup}
          <p class="case-study-updated">Updated <time datetime="${modifiedDate}">${modifiedDate}</time></p>
        </header>
        <div class="case-study-media shell">
          ${mediaMarkup}
          ${videoMarkup}
        </div>
        <section class="case-study-details shell" aria-labelledby="project-links-title">
          <div>
            <p class="case-study-label">Built by</p>
            <p>${escapeHtml(authorName)}</p>
            <p class="case-study-role">${escapeHtml(config.title)}</p>
          </div>
          <div>
            <h2 id="project-links-title">Explore the project</h2>
            <div class="case-study-links">${linksMarkup}</div>
          </div>
        </section>
        <nav class="case-study-pagination shell" aria-label="Adjacent projects">
          <a href="/projects/${encodeURIComponent(previous.id)}/"><span>Previous project</span><strong>${escapeHtml(previous.title)}</strong></a>
          <a href="/projects/${encodeURIComponent(next.id)}/"><span>Next project</span><strong>${escapeHtml(next.title)}</strong></a>
        </nav>
      </article>
    </main>
    <footer class="case-study-footer shell"><span>${escapeHtml(authorName)}</span><a href="mailto:${escapeHtml(config.email || '')}">${escapeHtml(config.email || '')}</a></footer>
  </body>
</html>`;
}
