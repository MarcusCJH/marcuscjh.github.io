import { absoluteUrl, normalizeBaseUrl } from '../lib/urls.ts';
import type {
  ItemListSchema,
  PersonSchema,
  ProfilePageSchema,
  ProjectListItemSchema,
  SiteData,
  WebsiteSchema,
} from '../types.ts';

/** Projects that are talks/articles rather than software get a CreativeWork type. */
const CREATIVE_WORK_IDS = new Set(['datav-webinar']);

function personBaseUrl(data: SiteData): string {
  return normalizeBaseUrl(data.seo.defaults?.url || data.config.website || '');
}

function displayName(data: SiteData): string {
  return data.config.real_name || data.config.name;
}

/** schema.org `Person` describing the site owner (the JSON-LD root entity). */
export function buildPersonSchema(data: SiteData): PersonSchema {
  const { config, social, timeline, skills } = data;
  const name = displayName(data);
  const baseUrl = personBaseUrl(data);
  const currentWork = [...timeline]
    .filter(item => item.category === 'work')
    .sort((a, b) => b.order - a.order)[0];

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
    ...(currentWork
      ? { worksFor: { '@type': 'Organization' as const, name: currentWork.company } }
      : {}),
    alumniOf: timeline
      .filter(item => item.category === 'education')
      .map(item => ({ '@type': 'EducationalOrganization' as const, name: item.company })),
    hasCredential: timeline
      .filter(item => item.category === 'certification')
      .map(item => ({
        '@type': 'EducationalOccupationalCredential' as const,
        name: item.title,
        credentialCategory: 'Professional Certification',
        recognizedBy: { '@type': 'Organization' as const, name: item.company },
      })),
    knowsAbout: [...new Set(Object.values(skills).flat())],
    sameAs: social
      .filter(item => item.url && !item.url.startsWith('mailto:'))
      .map(item => item.url),
  };
}

/** schema.org `ItemList` of every showcase project, authored by the Person. */
export function buildProjectsSchema(data: SiteData): ItemListSchema {
  const baseUrl = personBaseUrl(data);
  const name = displayName(data);

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${baseUrl}/#projects`,
    name: `${name}'s software projects`,
    description: `Selected software projects and applications developed by ${name}`,
    itemListElement: data.showcase.map((project, index) => {
      const projectUrl = `${baseUrl}/projects/${encodeURIComponent(project.id)}/`;
      const item: ProjectListItemSchema = {
        '@type': CREATIVE_WORK_IDS.has(project.id) ? 'CreativeWork' : 'SoftwareApplication',
        name: project.modalContent?.title || project.title,
        ...(project.modalContent?.description
          ? { description: project.modalContent.description }
          : {}),
        ...(CREATIVE_WORK_IDS.has(project.id)
          ? {}
          : { applicationCategory: 'WebApplication', operatingSystem: 'Web' }),
        ...(project.technologies?.length ? { keywords: project.technologies.join(', ') } : {}),
        url: projectUrl,
        mainEntityOfPage: projectUrl,
        ...(project.backgroundImage
          ? { image: absoluteUrl(project.backgroundImage, baseUrl) }
          : {}),
        author: { '@id': `${baseUrl}/#person` },
      };
      return { '@type': 'ListItem' as const, position: index + 1, item };
    }),
  };
}

/** schema.org `WebSite` for the portfolio itself. */
export function buildWebsiteSchema(data: SiteData): WebsiteSchema {
  const { config } = data;
  const name = config.real_name || config.name || '';
  // Matches buildPersonSchema and renderProjectPage; without the
  // config.website fallback the @id bases could disagree.
  const baseUrl = normalizeBaseUrl(data.seo.defaults?.url || config.website || '');

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    name: `${name} — Portfolio`,
    url: `${baseUrl}/`,
    description: `Personal portfolio of ${name}, ${config.title || ''}.`,
    author: { '@id': `${baseUrl}/#person` },
  };
}

export interface ProfilePageOptions {
  /** Resolved `<title>` for the home page. */
  title: string;
  /** Resolved meta description for the home page. */
  description: string;
  /** ISO timestamp of the last data.json change. */
  dateModified: string;
}

/** schema.org `ProfilePage` wrapper that points at the Person entity. */
export function buildProfilePageSchema(
  data: SiteData,
  options: ProfilePageOptions
): ProfilePageSchema {
  const baseUrl = normalizeBaseUrl(data.seo.defaults?.url || '');

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${baseUrl}/#profile`,
    url: `${baseUrl}/`,
    name: options.title,
    description: options.description,
    dateModified: options.dateModified,
    mainEntity: { '@id': `${baseUrl}/#person` },
    isPartOf: { '@id': `${baseUrl}/#website` },
  };
}

/** Whether a project is described as a CreativeWork rather than software. */
export function isCreativeWork(projectId: string): boolean {
  return CREATIVE_WORK_IDS.has(projectId);
}
