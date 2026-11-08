import { describe, expect, it } from 'vitest';
import { buildHeadTags } from './head-tags.ts';
import { buildManifest, renderManifest } from './manifest.ts';
import { renderProjectPage } from './project-page.ts';
import {
  buildPersonSchema,
  buildProfilePageSchema,
  buildProjectsSchema,
  buildWebsiteSchema,
} from './schema.ts';
import { buildSitemap } from './sitemap.ts';
import { renderStaticContent } from './static-content.ts';
import { createSiteData } from '../test-fixtures.ts';
import type { HeadTag, ShowcaseProject, SiteData } from '../types.ts';

const MODIFIED = '2026-11-08T12:34:56.000Z';

/** A SiteData whose every optional field is absent. */
function bareData(): SiteData {
  return {
    config: { name: 'bare', title: 'Dev', subtitle: 'Sub' },
    seo: {},
    social: [],
    navigation: [],
    showcase: [],
    timeline: [],
    skills: {},
  };
}

function meta(tags: HeadTag[], key: 'name' | 'property', value: string): string | undefined {
  return tags.find(tag => tag.tag === 'meta' && tag.attrs?.[key] === value)?.attrs?.content;
}

function page(data: SiteData, index = 0): string {
  return renderProjectPage({
    data,
    project: data.showcase[index]!,
    projectIndex: index,
    cssHref: '/a.css',
    dataModifiedIso: MODIFIED,
  });
}

function solo(project: ShowcaseProject): SiteData {
  const data = createSiteData();
  data.showcase = [project];
  return data;
}

describe('buildManifest fallbacks', () => {
  it('uses the real name and title when no SEO title exists', () => {
    const data = createSiteData();
    delete data.seo.defaults;
    delete data.seo.meta;
    const manifest = buildManifest(data);
    expect(manifest.name).toBe('Ada "A&B" O\'Hara | Engineer & Architect');
    expect(manifest.description).toBe('');
    expect(manifest.background_color).toBe('#0a0a0a');
    expect(manifest.theme_color).toBe('#00ff88');
  });

  it('falls back from meta to defaults for description and name', () => {
    const data = createSiteData();
    delete data.seo.meta;
    expect(buildManifest(data).description).toBe('Default description');
    expect(buildManifest(data).name).toBe('Default Title');
  });

  it('degrades to an empty short name when config.name is blank', () => {
    const data = bareData();
    data.config.name = '';
    expect(buildManifest(data).short_name).toBe('');
  });

  it('serialises with 4-space indentation', () => {
    expect(renderManifest(createSiteData())).toContain('\n    "start_url": "/",');
  });
});

describe('buildSitemap optional fields', () => {
  it('emits only the home entry, with no image block, for bare data', () => {
    const xml = buildSitemap(bareData(), '2026-01-01');
    expect(xml).not.toContain('image:image');
    expect(xml.match(/<url>/g)).toHaveLength(1);
    expect(xml).toContain('<loc>/</loc>');
  });

  it('omits the image block for projects without a background image', () => {
    const xml = buildSitemap(createSiteData(), '2026-01-01');
    const webinar = xml.slice(xml.indexOf('datav-webinar'));
    expect(webinar).not.toContain('image:image');
  });

  it('keeps absolute image URLs', () => {
    const data = createSiteData();
    data.seo.defaults!.image = 'https://cdn.example.com/hero.png';
    const xml = buildSitemap(data, '2026-01-01');
    expect(xml).toContain('<image:loc>https://cdn.example.com/hero.png</image:loc>');
    expect(xml).toContain('<loc>https://example.com/</loc>');
  });
});

describe('schema builders with optional fields absent', () => {
  it('omits email, job title, description and employer from a bare Person', () => {
    const data = bareData();
    data.config.title = '';
    const person = buildPersonSchema(data);
    expect(person).not.toHaveProperty('email');
    expect(person).not.toHaveProperty('jobTitle');
    expect(person).not.toHaveProperty('description');
    expect(person).not.toHaveProperty('worksFor');
    expect(person.name).toBe('bare');
    expect(person.url).toBe('/');
    expect(person.sameAs).toEqual([]);
    expect(person.knowsAbout).toEqual([]);
  });

  it('falls back to config.website for the base URL', () => {
    const data = bareData();
    data.config.website = 'https://site.example.com/';
    expect(buildPersonSchema(data)['@id']).toBe('https://site.example.com/#person');
  });

  it('skips social entries with an empty URL', () => {
    const data = createSiteData();
    data.social.push({ platform: 'Empty', url: '' });
    expect(buildPersonSchema(data).sameAs).toHaveLength(2);
  });

  it('describes a single project with no description, tech or image', () => {
    const data = bareData();
    data.showcase = [{ id: 'solo', title: 'Solo' }];
    const [element] = buildProjectsSchema(data).itemListElement;
    expect(element!.position).toBe(1);
    expect(element!.item).toEqual({
      '@type': 'SoftwareApplication',
      name: 'Solo',
      applicationCategory: 'WebApplication',
      operatingSystem: 'Web',
      url: '/projects/solo/',
      mainEntityOfPage: '/projects/solo/',
      author: { '@id': '/#person' },
    });
  });

  it('omits software fields for creative works', () => {
    const data = bareData();
    data.showcase = [{ id: 'datav-webinar', title: 'Talk' }];
    const item = buildProjectsSchema(data).itemListElement[0]!.item;
    expect(item['@type']).toBe('CreativeWork');
    expect(item).not.toHaveProperty('applicationCategory');
  });

  it('builds the website schema without a real name or title', () => {
    const data = bareData();
    data.config.title = '';
    const site = buildWebsiteSchema(data);
    expect(site.name).toBe('bare — Portfolio');
    expect(site.description).toBe('Personal portfolio of bare, .');
    const blank = bareData();
    blank.config.name = '';
    expect(buildWebsiteSchema(blank).name).toBe(' — Portfolio');
  });

  it('builds the profile page schema without SEO defaults', () => {
    const profile = buildProfilePageSchema(bareData(), {
      title: 't',
      description: 'd',
      dateModified: MODIFIED,
    });
    expect(profile['@id']).toBe('/#profile');
    expect(profile.dateModified).toBe(MODIFIED);
  });
});

describe('buildHeadTags with bare data', () => {
  const tags = buildHeadTags(bareData(), MODIFIED);

  it('falls back to empty strings and library defaults', () => {
    expect(tags[0]).toEqual({ tag: 'title', children: '', injectTo: 'head-prepend' });
    expect(meta(tags, 'name', 'author')).toBeUndefined();
    expect(meta(tags, 'name', 'robots')).toBeUndefined();
    expect(meta(tags, 'name', 'googlebot')).toBeUndefined();
    expect(meta(tags, 'name', 'bingbot')).toBeUndefined();
    expect(meta(tags, 'property', 'og:type')).toBe('website');
    expect(meta(tags, 'name', 'twitter:card')).toBe('summary_large_image');
    expect(meta(tags, 'property', 'og:site_name')).toBeUndefined();
    expect(meta(tags, 'property', 'og:locale')).toBeUndefined();
    expect(meta(tags, 'name', 'twitter:image')).toBeUndefined();
    expect(meta(tags, 'name', 'twitter:creator')).toBeUndefined();
    expect(meta(tags, 'name', 'twitter:site')).toBeUndefined();
  });

  it('omits the canonical link when there is no URL at all', () => {
    expect(tags.some(tag => tag.attrs?.rel === 'canonical')).toBe(false);
  });
});

describe('buildHeadTags overrides and fallbacks', () => {
  it('prefers explicit Open Graph / Twitter values over the defaults', () => {
    const data = createSiteData();
    data.seo.openGraph = {
      type: 'profile',
      url: 'https://og.example.com/',
      title: 'OG Title',
      description: 'OG desc',
      image: 'https://og.example.com/i.png',
    };
    data.seo.twitter = {
      card: 'summary',
      url: 'https://tw.example.com/',
      title: 'TW Title',
      description: 'TW desc',
      image: 'https://tw.example.com/i.png',
    };
    data.seo.meta = { robots: 'noindex' };
    data.seo.canonical = 'https://canonical.example.com/';
    const tags = buildHeadTags(data, MODIFIED);
    expect(meta(tags, 'property', 'og:type')).toBe('profile');
    expect(meta(tags, 'property', 'og:url')).toBe('https://og.example.com/');
    expect(meta(tags, 'property', 'og:title')).toBe('OG Title');
    expect(meta(tags, 'property', 'og:description')).toBe('OG desc');
    expect(meta(tags, 'property', 'og:image')).toBe('https://og.example.com/i.png');
    expect(meta(tags, 'name', 'twitter:card')).toBe('summary');
    expect(meta(tags, 'name', 'twitter:url')).toBe('https://tw.example.com/');
    expect(meta(tags, 'name', 'twitter:title')).toBe('TW Title');
    expect(meta(tags, 'name', 'twitter:description')).toBe('TW desc');
    expect(meta(tags, 'name', 'twitter:image')).toBe('https://tw.example.com/i.png');
    expect(meta(tags, 'name', 'robots')).toBe('noindex');
    expect(tags.find(tag => tag.attrs?.rel === 'canonical')?.attrs?.href).toBe(
      'https://canonical.example.com/'
    );
  });

  it('uses the default title/description and Open Graph / Twitter defaults', () => {
    const data = createSiteData();
    data.seo.meta = {};
    data.seo.openGraph = {};
    data.seo.twitter = {};
    data.seo.defaults = {
      title: 'D',
      description: 'DD',
      openGraph: { type: 'article' },
      twitter: { card: 'summary' },
    };
    const tags = buildHeadTags(data, MODIFIED);
    expect(tags[0]!.children).toBe('D');
    expect(meta(tags, 'name', 'description')).toBe('DD');
    expect(meta(tags, 'property', 'og:type')).toBe('article');
    expect(meta(tags, 'name', 'twitter:card')).toBe('summary');
  });

  it('omits optional image dimensions when only the image is set', () => {
    const data = createSiteData();
    data.seo.openGraph = {};
    const tags = buildHeadTags(data, MODIFIED);
    expect(meta(tags, 'property', 'og:image')).toBe('./showcase/hero&main.png');
    expect(meta(tags, 'property', 'og:image:width')).toBeUndefined();
    expect(meta(tags, 'property', 'og:image:height')).toBeUndefined();
    expect(meta(tags, 'property', 'og:image:type')).toBeUndefined();
  });

  it('builds the image alt text from blank names without throwing', () => {
    const data = createSiteData();
    delete data.config.real_name;
    data.config.title = '';
    expect(meta(buildHeadTags(data, MODIFIED), 'property', 'og:image:alt')).toBe(' -  Portfolio');
  });
});

describe('renderProjectPage optional fields', () => {
  it('renders a bare project with fallbacks and links to itself as prev/next', () => {
    const html = page(solo({ id: 'solo', title: 'Solo' }));
    expect(html).toContain(
      '<p class="case-study-lead">Solo by Ada &quot;A&amp;B&quot; O&#39;Hara.</p>'
    );
    expect(html).not.toContain('case-study-subtitle');
    expect(html).not.toContain('case-study-tech');
    expect(html).not.toContain('<figure');
    expect(html).not.toContain('<video');
    expect(html).toContain('This project does not currently have a public link.');
    expect(html).toContain('<span>01 / 01</span>');
    expect(html.match(/href="\/projects\/solo\/"/g)).toHaveLength(2);
    expect(html).toContain('<meta property="og:image" content="./showcase/hero&amp;main.png">');
  });

  it('emits no image meta when neither the project nor the site has an image', () => {
    const data = solo({ id: 'solo', title: 'Solo' });
    delete data.seo.defaults;
    delete data.seo.meta;
    data.config.website = 'https://w.example.com/';
    delete data.config.email;
    const html = page(data);
    expect(html).not.toContain('og:image');
    expect(html).not.toContain('twitter:image');
    expect(html).toContain('<meta name="theme-color" content="#c6f24e">');
    expect(html).toContain('href="https://w.example.com/projects/solo/"');
    expect(html).toContain('<a href="mailto:"></a>');
  });

  it('uses the background image when the modal has none, and an absolute URL as-is', () => {
    const html = page(
      solo({ id: 'p', title: 'P', backgroundImage: 'https://cdn.example.com/bg.png' })
    );
    expect(html).toContain('<img src="https://cdn.example.com/bg.png"');
    expect(html).toContain('content="https://cdn.example.com/bg.png"');
  });

  it('omits the subtitle when the modal title equals the project title', () => {
    const html = page(solo({ id: 'p', title: 'Same', modalContent: { title: 'Same' } }));
    expect(html).not.toContain('case-study-subtitle');
  });

  it('marks only off-site http(s) links as external', () => {
    const html = page(
      solo({
        id: 'p',
        title: 'P',
        modalContent: {
          links: [
            { text: 'Away', url: 'https://other.example.org/x' },
            { text: 'Home', url: 'https://example.com/p/' },
            { text: 'Mail', url: 'mailto:a@example.com' },
          ],
        },
      })
    );
    expect(html).toContain(
      'href="https://other.example.org/x" target="_blank" rel="noopener noreferrer"'
    );
    expect(html).toContain('<span aria-hidden="true">External</span>');
    expect(html).toContain(
      'href="https://example.com/p/"><span>P: Home</span><span aria-hidden="true">Open</span>'
    );
    expect(html).toContain('href="mailto:a@example.com"><span>P: Mail');
    expect(html.match(/target="_blank"/g)).toHaveLength(1);
  });

  it('renders embedded video markup for a creative work', () => {
    const html = page(createSiteData(), 1);
    expect(html).toContain('<source src="https://cdn.example.com/talk.mp4" type="video/mp4">');
    expect(html).toContain('"@type":"CreativeWork"');
  });

  it('truncates long descriptions in meta but not in the lead paragraph', () => {
    const long = `${'word '.repeat(60)}end`;
    const html = page(solo({ id: 'p', title: 'P', modalContent: { description: long } }));
    expect(html).toMatch(/<meta name="description" content="[^"]+…">/);
    expect(html).toContain(`<p class="case-study-lead">${long}</p>`);
  });

  it('wraps previous/next around the ends of the list', () => {
    const data = createSiteData();
    const first = page(data, 0);
    const last = page(data, 1);
    expect(first).toContain('<span>Previous project</span><strong>Webinar</strong>');
    expect(first).toContain('<span>Next project</span><strong>Webinar</strong>');
    expect(last).toContain('<span>Previous project</span><strong>Alpha &amp; Co</strong>');
  });
});

describe('renderStaticContent optional fields', () => {
  const TEMPLATE = [
    '<p class="hero-lead"></p>',
    '<!-- Social links are loaded from data.json -->',
    '<!-- Timeline items are loaded from data.json -->',
    '<!-- Projects are loaded from data.json -->',
    '<span id="footer-meta"></span>',
  ].join('\n');

  it('leaves the footer meta untouched and the lead empty without email/summary', () => {
    const html = renderStaticContent(TEMPLATE, bareData());
    expect(html).toContain('<p class="hero-lead"></p>');
    expect(html).toContain('<span id="footer-meta"></span>');
  });

  it('labels social links by platform, then name, then URL', () => {
    const data = bareData();
    data.social = [
      { platform: 'P', name: 'N', url: 'https://a.example.com' },
      { name: 'N2', url: 'https://b.example.com' },
      { url: 'https://c.example.com' },
      { platform: 'Mail', url: 'mailto:x@example.com' },
    ];
    const html = renderStaticContent(TEMPLATE, data);
    expect(html).toContain('<span>P</span>');
    expect(html).toContain('<span>N2</span>');
    expect(html).toContain('<span>https://c.example.com</span>');
    expect(html).toContain('<a href="mailto:x@example.com" class="social-link">');
    expect(html.match(/target="_blank"/g)).toHaveLength(3);
  });

  it('renders timeline entries without end dates and with unknown categories', () => {
    const data = bareData();
    data.timeline = [{ category: 'hobby', order: 1, startDate: '2020', company: 'C', title: 'T' }];
    const html = renderStaticContent(TEMPLATE, data);
    expect(html).toContain('<div class="timeline-date">2020</div>');
    expect(html).toContain('<div class="timeline-tag">hobby</div>');
  });

  it('renders showcase cards without image, description or technologies', () => {
    const data = bareData();
    data.showcase = [{ id: 'x', title: 'X' }];
    const html = renderStaticContent(TEMPLATE, data);
    expect(html).not.toContain('showcase-media');
    expect(html).not.toContain('showcase-description');
    expect(html).not.toContain('tech-stack');
    expect(html).toContain('<a href="/projects/x/">X</a>');
  });

  it('eager-loads the first three images and lazy-loads the rest', () => {
    const data = bareData();
    data.showcase = ['a', 'b', 'c', 'd'].map(id => ({
      id,
      title: id,
      backgroundImage: `${id}.png`,
    }));
    const html = renderStaticContent(TEMPLATE, data);
    expect(html.match(/loading="eager"/g)).toHaveLength(3);
    expect(html.match(/loading="lazy"/g)).toHaveLength(1);
  });
});

describe('fallbacks are consistent across builders', () => {
  it('manifest name falls back to config.name when real_name is absent', () => {
    const data = bareData();
    // No seo.defaults.title, so the fallback path is what renders.
    expect(buildManifest(data).name).toBe('bare | Dev');
    expect(buildManifest(data).name).not.toContain('undefined');
  });

  it('manifest name prefers real_name when present', () => {
    const data = bareData();
    data.config.real_name = 'Real Name';
    expect(buildManifest(data).name).toBe('Real Name | Dev');
  });

  it('manifest name omits the separator when there is no title', () => {
    const data = bareData();
    data.config.title = '';
    expect(buildManifest(data).name).toBe('bare');
  });

  it('website schema uses config.website as a base-URL fallback, like Person', () => {
    const data = bareData();
    data.config.website = 'https://example.com/';
    const website = buildWebsiteSchema(data);
    const person = buildPersonSchema(data);
    expect(website['@id']).toContain('https://example.com');
    // The two @id bases must agree; they used to diverge when
    // seo.defaults.url was absent because only Person had this fallback.
    const base = (id: string) => id.split('#')[0];
    expect(base(website['@id'])).toBe(base(person['@id']));
  });
});
