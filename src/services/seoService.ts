// SEO service for injecting data-driven structured data (JSON-LD).
// Static meta tags (title, description, Open Graph, Twitter, canonical, etc.)
// are injected at build time by the seo-inject plugin in vite.config.ts.
import type { PortfolioData } from '@/types';

export class SEOService {
  /**
   * Inject structured data schemas (Person + ItemList) generated from data.json.
   * Removes any previously injected dynamic schemas before re-injecting.
   */
  public static applyStructuredData(data: PortfolioData): void {
    // Remove previously injected dynamic schemas
    document.querySelectorAll('script[data-dynamic-schema]').forEach(el => el.remove());
    this.injectSchema('person', this.buildPersonSchema(data));
    this.injectSchema('projects', this.buildProjectsSchema(data));
  }

  private static buildPersonSchema(data: PortfolioData): object {
    const { config, social, timeline, seo } = data;
    const name = config.real_name || config.name;
    const baseUrl = seo?.defaults?.url || config.website || '';

    const currentWork = [...timeline]
      .filter(t => t.category === 'work')
      .sort((a, b) => b.order - a.order)[0];

    const alumniOf = timeline
      .filter(t => t.category === 'education')
      .map(t => ({ '@type': 'EducationalOrganization', name: t.company }));

    const hasCredential = timeline
      .filter(t => t.category === 'certification')
      .map(t => ({
        '@type': 'EducationalOccupationalCredential',
        name: t.title,
        credentialCategory: 'Professional Certification',
        recognizedBy: { '@type': 'Organization', name: t.company },
      }));

    const sameAs = social.filter(s => s.url && !s.url.startsWith('mailto:')).map(s => s.url);
    const knowsAbout = [...new Set(Object.values(data.skills ?? {}).flat())];

    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      ...(baseUrl ? { '@id': `${baseUrl.replace(/\/$/, '')}/#person` } : {}),
      name,
      alternateName: config.name,
      url: baseUrl,
      ...(config.email ? { email: config.email } : {}),
      ...(config.title ? { jobTitle: config.title } : {}),
      ...(config.summary ? { description: config.summary } : {}),
      alumniOf,
      hasCredential,
      ...(currentWork ? { worksFor: { '@type': 'Organization', name: currentWork.company } } : {}),
      knowsAbout,
      sameAs,
    };
  }

  private static buildProjectsSchema(data: PortfolioData): object {
    const { showcase, config, seo } = data;
    const authorName = config.real_name || config.name;
    const baseUrl = (seo?.defaults?.url || config.website || '').replace(/\/$/, '');

    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      ...(baseUrl ? { '@id': `${baseUrl}/#projects` } : {}),
      name: `${authorName}'s Software Projects`,
      description: `Software projects and applications developed by ${authorName}`,
      itemListElement: showcase.map((project, index) => ({
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
          ...(baseUrl
            ? {
                url: `${baseUrl}/projects/${encodeURIComponent(project.id)}/`,
                mainEntityOfPage: `${baseUrl}/projects/${encodeURIComponent(project.id)}/`,
              }
            : {}),
          ...(project.backgroundImage && baseUrl
            ? {
                image: `${baseUrl}/${project.backgroundImage.replace(/^\.\//, '').replace(/^\//, '')}`,
              }
            : {}),
          author: baseUrl
            ? { '@id': `${baseUrl}/#person` }
            : { '@type': 'Person', name: authorName },
        },
      })),
    };
  }

  private static injectSchema(name: string, schema: object): void {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-schema="${name}"]`);
    if (existing) {
      existing.textContent = JSON.stringify(schema);
      return;
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', name);
    script.setAttribute('data-dynamic-schema', '');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }
}
