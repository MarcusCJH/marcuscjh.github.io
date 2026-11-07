import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin, HtmlTagDescriptor } from 'vite';

const dataPath = path.resolve(import.meta.dirname, 'public/data.json');

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeHtml(str: string): string {
  return escapeXml(str).replace(/'/g, '&#39;');
}

function absoluteUrl(value: string, baseUrl: string): string {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `${baseUrl}/${value.replace(/^\.\//, '').replace(/^\//, '')}`;
}

function buildManifest(data: any): object {
  return {
    name: data.seo?.defaults?.title || `${data.config?.real_name} | ${data.config?.title}`,
    short_name: data.config?.name || '',
    description: data.seo?.meta?.description || data.seo?.defaults?.description || '',
    start_url: '/',
    display: 'standalone',
    background_color: data.seo?.meta?.backgroundColor || '#0a0a0a',
    theme_color: data.seo?.meta?.themeColor || '#00ff88',
    icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
  };
}

function buildSitemap(data: any): string {
  const baseUrl = (data.seo?.defaults?.url || '').replace(/\/$/, '');
  const lastModified = fs.statSync(dataPath).mtime.toISOString().split('T')[0];
  const mainImage = data.seo?.defaults?.image
    ? `\n        <image:image>\n            <image:loc>${escapeXml(absoluteUrl(data.seo.defaults.image, baseUrl))}</image:loc>\n        </image:image>`
    : '';
  const projectEntries = (data.showcase || [])
    .map((project: any) => {
      const projectUrl = `${baseUrl}/projects/${encodeURIComponent(project.id)}/`;
      const image = project.backgroundImage
        ? `\n        <image:image>\n            <image:loc>${escapeXml(absoluteUrl(project.backgroundImage, baseUrl))}</image:loc>\n        </image:image>`
        : '';
      return `    <url>
        <loc>${escapeXml(projectUrl)}</loc>
        <lastmod>${lastModified}</lastmod>${image}
    </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    <url>
        <loc>${escapeXml(baseUrl)}/</loc>
        <lastmod>${lastModified}</lastmod>${mainImage}
    </url>
${projectEntries}
</urlset>`;
}

function buildPersonSchema(data: any): object {
  const { config, social = [], timeline = [], skills = {}, seo = {} } = data;
  const name = config.real_name || config.name;
  const baseUrl = (seo.defaults?.url || config.website || '').replace(/\/$/, '');
  const currentWork = [...timeline]
    .filter((item: any) => item.category === 'work')
    .sort((a: any, b: any) => b.order - a.order)[0];

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${baseUrl}/#person`,
    name,
    alternateName: config.name,
    url: `${baseUrl}/`,
    ...(config.email ? { email: config.email } : {}),
    ...(config.title ? { jobTitle: config.title } : {}),
    ...(config.summary ? { description: config.summary } : {}),
    ...(currentWork ? { worksFor: { '@type': 'Organization', name: currentWork.company } } : {}),
    alumniOf: timeline
      .filter((item: any) => item.category === 'education')
      .map((item: any) => ({ '@type': 'EducationalOrganization', name: item.company })),
    hasCredential: timeline
      .filter((item: any) => item.category === 'certification')
      .map((item: any) => ({
        '@type': 'EducationalOccupationalCredential',
        name: item.title,
        credentialCategory: 'Professional Certification',
        recognizedBy: { '@type': 'Organization', name: item.company },
      })),
    knowsAbout: [...new Set(Object.values(skills).flat())],
    sameAs: social
      .filter((item: any) => item.url && !item.url.startsWith('mailto:'))
      .map((item: any) => item.url),
  };
}

function buildProjectsSchema(data: any): object {
  const baseUrl = (data.seo?.defaults?.url || data.config.website || '').replace(/\/$/, '');
  const name = data.config.real_name || data.config.name;

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${baseUrl}/#projects`,
    name: `${name}'s software projects`,
    description: `Selected software projects and applications developed by ${name}`,
    itemListElement: (data.showcase || []).map((project: any, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': project.id === 'datav-webinar' ? 'CreativeWork' : 'SoftwareApplication',
        name: project.modalContent?.title || project.title,
        ...(project.modalContent?.description
          ? { description: project.modalContent.description }
          : {}),
        ...(project.id !== 'datav-webinar'
          ? { applicationCategory: 'WebApplication', operatingSystem: 'Web' }
          : {}),
        ...(project.technologies?.length ? { keywords: project.technologies.join(', ') } : {}),
        url: `${baseUrl}/projects/${encodeURIComponent(project.id)}/`,
        mainEntityOfPage: `${baseUrl}/projects/${encodeURIComponent(project.id)}/`,
        ...(project.backgroundImage
          ? { image: absoluteUrl(project.backgroundImage, baseUrl) }
          : {}),
        author: { '@id': `${baseUrl}/#person` },
      },
    })),
  };
}

function renderStaticContent(html: string, data: any): string {
  const { config, navigation = [], social = [], timeline = [], showcase = [] } = data;
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

  const navMarkup = navigation
    .filter((item: any) => item.enabled)
    .map((item: any) => {
      const target = item.id === 'home' ? 'hero-section' : `${item.id}-section`;
      return `<a class="nav-item" href="#${escapeHtml(target)}"><span>${escapeHtml(item.title)}</span></a>`;
    })
    .join('\n');
  html = html.replace('<!-- Navigation items are loaded from data.json -->', navMarkup);

  const socialMarkup = social
    .map((item: any) => {
      const label = item.platform || item.name || item.url;
      const external = item.url.startsWith('mailto:')
        ? ''
        : ' target="_blank" rel="noopener noreferrer"';
      return `<a href="${escapeHtml(item.url)}"${external} class="social-link"><span>${escapeHtml(label)}</span></a>`;
    })
    .join('\n');
  html = html.replace('<!-- Social links are loaded from data.json -->', socialMarkup);

  const categoryLabels: Record<string, string> = {
    work: 'work',
    education: 'education',
    certification: 'certification',
  };
  const timelineMarkup = [...timeline]
    .sort((a: any, b: any) => b.order - a.order)
    .map((item: any, index: number) => {
      const dates = `${escapeHtml(item.startDate)}${item.endDate ? ` — ${escapeHtml(item.endDate)}` : ''}`;
      return `<article class="timeline-item visible" data-category="${escapeHtml(item.category)}" style="--item-index: ${index}">
        <div class="timeline-dot ${escapeHtml(item.category)}" aria-hidden="true"></div>
        <div class="timeline-content">
          <div class="timeline-date">${dates}</div>
          <h3>${escapeHtml(item.company)}</h3>
          <p>${escapeHtml(item.title)}</p>
          <div class="timeline-tag">${escapeHtml(categoryLabels[item.category] || item.category)}</div>
        </div>
      </article>`;
    })
    .join('\n');
  html = html.replace('<!-- Timeline items are loaded from data.json -->', timelineMarkup);

  const showcaseMarkup = showcase
    .map((project: any, index: number) => {
      const description = project.modalContent?.description || '';
      const title = `<a href="/projects/${encodeURIComponent(project.id)}/">${escapeHtml(project.title)}</a>`;
      const media = project.backgroundImage
        ? `<img class="showcase-media" src="${escapeHtml(project.backgroundImage)}" alt="${escapeHtml(project.title)} project preview" loading="${index < 3 ? 'eager' : 'lazy'}" decoding="async">`
        : '';
      const tech = project.technologies?.length
        ? `<div class="tech-stack">${project.technologies.map((item: string) => `<span class="tech-badge">${escapeHtml(item)}</span>`).join('')}</div>`
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
  html = html.replace('<!-- Projects are loaded from data.json -->', showcaseMarkup);

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

function truncateDescription(value: string, maxLength = 158): string {
  if (value.length <= maxLength) return value;
  const shortened = value.slice(0, maxLength + 1);
  const lastSpace = shortened.lastIndexOf(' ');
  return `${shortened.slice(0, lastSpace > 100 ? lastSpace : maxLength).trim()}…`;
}

function rootAssetPath(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `/${value.replace(/^\.\//, '').replace(/^\//, '')}`;
}

function safeJsonLd(value: object): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function renderProjectPage(data: any, project: any, projectIndex: number, cssHref: string): string {
  const { config, seo, showcase } = data;
  const authorName = config.real_name || config.name;
  const baseUrl = (seo?.defaults?.url || config.website || '').replace(/\/$/, '');
  const canonicalUrl = `${baseUrl}/projects/${encodeURIComponent(project.id)}/`;
  const fullTitle = project.modalContent?.title || project.title;
  const description = project.modalContent?.description || `${project.title} by ${authorName}.`;
  const metaDescription = truncateDescription(description);
  const imagePath = project.modalContent?.image || project.backgroundImage || '';
  const imageUrl = imagePath ? absoluteUrl(imagePath, baseUrl) : seo?.defaults?.image || '';
  const modifiedIso = fs.statSync(dataPath).mtime.toISOString();
  const modifiedDate = modifiedIso.split('T')[0];
  const schemaType = project.id === 'datav-webinar' ? 'CreativeWork' : 'SoftwareApplication';
  const projectSchema = {
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
      {
        '@type': schemaType,
        '@id': `${canonicalUrl}#project`,
        name: fullTitle,
        description,
        url: canonicalUrl,
        mainEntityOfPage: canonicalUrl,
        ...(imageUrl ? { image: imageUrl } : {}),
        ...(project.technologies?.length ? { keywords: project.technologies } : {}),
        ...(schemaType === 'SoftwareApplication'
          ? { applicationCategory: 'WebApplication', operatingSystem: 'Web' }
          : {}),
        dateModified: modifiedIso,
        creator: {
          '@type': 'Person',
          '@id': `${baseUrl}/#person`,
          name: authorName,
        },
      },
    ],
  };

  const subtitle =
    fullTitle !== project.title
      ? `<p class="case-study-subtitle">${escapeHtml(fullTitle)}</p>`
      : '';
  const technologyMarkup = project.technologies?.length
    ? `<ul class="case-study-tech" aria-label="Technologies used">${project.technologies
        .map((technology: string) => `<li>${escapeHtml(technology)}</li>`)
        .join('')}</ul>`
    : '';
  const linksMarkup = project.modalContent?.links?.length
    ? project.modalContent.links
        .map((link: { text: string; url: string }) => {
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
  const previous = showcase[(projectIndex - 1 + showcase.length) % showcase.length];
  const next = showcase[(projectIndex + 1) % showcase.length];

  return `<!doctype html>
<html lang="en-SG">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(project.title)} | ${escapeHtml(authorName)} Project</title>
    <meta name="description" content="${escapeHtml(metaDescription)}">
    <meta name="author" content="${escapeHtml(authorName)}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta name="theme-color" content="${escapeHtml(seo?.meta?.themeColor || '#c6f24e')}">
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

function seoInjectPlugin(): Plugin {
  return {
    name: 'seo-inject',

    configureServer(server) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      server.middlewares.use((req, res, next) => {
        const match = req.url?.match(/^\/projects\/([^/?#]+)\/?(?:\?.*)?$/);
        if (!match) {
          next();
          return;
        }
        const projectId = decodeURIComponent(match[1]);
        const projectIndex = data.showcase.findIndex((project: any) => project.id === projectId);
        if (projectIndex < 0) {
          next();
          return;
        }
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(
          renderProjectPage(
            data,
            data.showcase[projectIndex],
            projectIndex,
            '/src/styles/style.css'
          )
        );
      });
      server.middlewares.use('/manifest.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(buildManifest(data), null, 4));
      });
      server.middlewares.use('/sitemap.xml', (_req, res) => {
        res.setHeader('Content-Type', 'application/xml');
        res.end(buildSitemap(data));
      });
    },

    generateBundle(_options, bundle) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      const cssAsset = Object.values(bundle).find(
        item => item.type === 'asset' && item.fileName.endsWith('.css')
      );
      if (!cssAsset) {
        this.error('Unable to generate project pages: the production CSS asset was not found.');
        return;
      }
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: JSON.stringify(buildManifest(data), null, 4),
      });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: buildSitemap(data) });
      data.showcase.forEach((project: any, projectIndex: number) => {
        this.emitFile({
          type: 'asset',
          fileName: `projects/${project.id}/index.html`,
          source: renderProjectPage(data, project, projectIndex, `/${cssAsset.fileName}`),
        });
      });
    },

    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        const { seo, config } = data;
        const defaults = seo.defaults || {};
        const meta = seo.meta || {};
        const og = seo.openGraph || {};
        const tw = seo.twitter || {};

        const title = meta.title || defaults.title || '';
        const description = meta.description || defaults.description || '';
        const image = og.image || defaults.image || '';
        const url = og.url || defaults.url || '';
        const author = defaults.author || '';
        const robots = meta.robots || defaults.robots || '';
        const canonicalUrl = seo.canonical || url;
        const imageAlt = `${config.real_name || ''} - ${config.title || ''} Portfolio`;

        const tags: HtmlTagDescriptor[] = [
          { tag: 'title', children: title, injectTo: 'head-prepend' },
          ...(meta.themeColor
            ? [
                {
                  tag: 'meta' as const,
                  attrs: { name: 'theme-color', content: meta.themeColor },
                  injectTo: 'head' as const,
                },
              ]
            : []),
          { tag: 'meta', attrs: { name: 'title', content: title }, injectTo: 'head' },
          { tag: 'meta', attrs: { name: 'description', content: description }, injectTo: 'head' },
          ...(author
            ? [
                {
                  tag: 'meta' as const,
                  attrs: { name: 'author', content: author },
                  injectTo: 'head' as const,
                },
              ]
            : []),
          ...(robots
            ? [
                {
                  tag: 'meta' as const,
                  attrs: { name: 'robots', content: robots },
                  injectTo: 'head' as const,
                },
              ]
            : []),
          ...(meta.googlebot
            ? [
                {
                  tag: 'meta' as const,
                  attrs: { name: 'googlebot', content: meta.googlebot },
                  injectTo: 'head' as const,
                },
              ]
            : []),
          ...(meta.bingbot
            ? [
                {
                  tag: 'meta' as const,
                  attrs: { name: 'bingbot', content: meta.bingbot },
                  injectTo: 'head' as const,
                },
              ]
            : []),
          {
            tag: 'meta',
            attrs: {
              property: 'og:type',
              content: og.type || defaults.openGraph?.type || 'website',
            },
            injectTo: 'head',
          },
          { tag: 'meta', attrs: { property: 'og:url', content: url }, injectTo: 'head' },
          {
            tag: 'meta',
            attrs: { property: 'og:title', content: og.title || title },
            injectTo: 'head',
          },
          {
            tag: 'meta',
            attrs: { property: 'og:description', content: og.description || description },
            injectTo: 'head',
          },
          ...(og.site_name
            ? [
                {
                  tag: 'meta' as const,
                  attrs: { property: 'og:site_name', content: og.site_name },
                  injectTo: 'head' as const,
                },
              ]
            : []),
          ...(og.locale
            ? [
                {
                  tag: 'meta' as const,
                  attrs: { property: 'og:locale', content: og.locale },
                  injectTo: 'head' as const,
                },
              ]
            : []),
          ...(image
            ? [
                {
                  tag: 'meta' as const,
                  attrs: { property: 'og:image', content: image },
                  injectTo: 'head' as const,
                },
                {
                  tag: 'meta' as const,
                  attrs: { property: 'og:image:alt', content: imageAlt },
                  injectTo: 'head' as const,
                },
                ...(og.imageWidth
                  ? [
                      {
                        tag: 'meta' as const,
                        attrs: { property: 'og:image:width', content: og.imageWidth },
                        injectTo: 'head' as const,
                      },
                    ]
                  : []),
                ...(og.imageHeight
                  ? [
                      {
                        tag: 'meta' as const,
                        attrs: { property: 'og:image:height', content: og.imageHeight },
                        injectTo: 'head' as const,
                      },
                    ]
                  : []),
                ...(og.imageType
                  ? [
                      {
                        tag: 'meta' as const,
                        attrs: { property: 'og:image:type', content: og.imageType },
                        injectTo: 'head' as const,
                      },
                    ]
                  : []),
              ]
            : []),
          {
            tag: 'meta',
            attrs: {
              name: 'twitter:card',
              content: tw.card || defaults.twitter?.card || 'summary_large_image',
            },
            injectTo: 'head',
          },
          { tag: 'meta', attrs: { name: 'twitter:url', content: tw.url || url }, injectTo: 'head' },
          {
            tag: 'meta',
            attrs: { name: 'twitter:title', content: tw.title || title },
            injectTo: 'head',
          },
          {
            tag: 'meta',
            attrs: { name: 'twitter:description', content: tw.description || description },
            injectTo: 'head',
          },
          ...(image
            ? [
                {
                  tag: 'meta' as const,
                  attrs: { name: 'twitter:image', content: tw.image || image },
                  injectTo: 'head' as const,
                },
                {
                  tag: 'meta' as const,
                  attrs: { name: 'twitter:image:alt', content: imageAlt },
                  injectTo: 'head' as const,
                },
              ]
            : []),
          ...(tw.creator
            ? [
                {
                  tag: 'meta' as const,
                  attrs: { name: 'twitter:creator', content: tw.creator },
                  injectTo: 'head' as const,
                },
              ]
            : []),
          ...(tw.site
            ? [
                {
                  tag: 'meta' as const,
                  attrs: { name: 'twitter:site', content: tw.site },
                  injectTo: 'head' as const,
                },
              ]
            : []),
          ...(canonicalUrl
            ? [
                {
                  tag: 'link' as const,
                  attrs: { rel: 'canonical', href: canonicalUrl },
                  injectTo: 'head' as const,
                },
              ]
            : []),
          ...(seo.alternateUrls
            ? seo.alternateUrls.map((alt: { href: string; hreflang: string }) => ({
                tag: 'link' as const,
                attrs: { rel: 'alternate', href: alt.href, hreflang: alt.hreflang },
                injectTo: 'head' as const,
              }))
            : []),
          {
            tag: 'link',
            attrs: { rel: 'sitemap', type: 'application/xml', href: '/sitemap.xml' },
            injectTo: 'head',
          },
          ...(seo.googleSiteVerification
            ? [
                {
                  tag: 'meta' as const,
                  attrs: { name: 'google-site-verification', content: seo.googleSiteVerification },
                  injectTo: 'head' as const,
                },
              ]
            : []),
        ];

        const name = config.real_name || config.name || '';
        const baseUrl = (defaults.url || '').replace(/\/$/, '');
        const websiteSchema = {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          '@id': `${baseUrl}/#website`,
          name: `${name} — Portfolio`,
          url: `${baseUrl}/`,
          description: `Personal portfolio of ${name}, ${config.title || ''}.`,
          author: { '@id': `${baseUrl}/#person` },
        };
        const profilePageSchema = {
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          '@id': `${baseUrl}/#profile`,
          url: `${baseUrl}/`,
          name: title,
          description,
          dateModified: fs.statSync(dataPath).mtime.toISOString(),
          mainEntity: { '@id': `${baseUrl}/#person` },
          isPartOf: { '@id': `${baseUrl}/#website` },
        };
        const schemas = [
          ['website', websiteSchema],
          ['profile', profilePageSchema],
          ['person', buildPersonSchema(data)],
          ['projects', buildProjectsSchema(data)],
        ] as const;
        schemas.forEach(([schemaName, schema]) => {
          tags.push({
            tag: 'script',
            attrs: { type: 'application/ld+json', 'data-schema': schemaName },
            children: JSON.stringify(schema, null, 4),
            injectTo: 'head',
          });
        });

        return { html: renderStaticContent(html, data), tags };
      },
    },
  };
}

export default defineConfig({
  plugins: [seoInjectPlugin()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  preview: {
    port: 4173,
    open: true,
  },
  publicDir: 'public',
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
