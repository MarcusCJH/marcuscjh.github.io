// SEO service for managing meta tags dynamically
import type { PortfolioData, SEOConfig } from '@/types';

export class SEOService {
  /**
   * Apply SEO configuration to the page
   */
  public static applySEO(seo: SEOConfig): void {
    if (!seo) {
      return;
    }

    // Get default values from meta or defaults section
    const defaults = seo.defaults || {};
    const baseUrl = defaults.url || '';
    const defaultTitle = defaults.title || seo.meta?.title || '';
    const defaultDescription = defaults.description || seo.meta?.description || '';
    const defaultImage = defaults.image || '';

    // Update page title
    if (defaultTitle) {
      document.title = defaultTitle;
    }

    // Update or create meta tags
    this.setMetaTag('name', 'title', seo.meta?.title || defaultTitle);
    this.setMetaTag('name', 'description', seo.meta?.description || defaultDescription);
    this.setMetaTag('name', 'keywords', seo.meta?.keywords);
    this.setMetaTag('name', 'author', seo.meta?.author || defaults.author);
    this.setMetaTag('name', 'robots', seo.meta?.robots || defaults.robots);

    // Open Graph meta tags (with fallbacks)
    // Always set OG tags if we have defaults or explicit openGraph config
    this.setMetaTag(
      'property',
      'og:type',
      seo.openGraph?.type || defaults.openGraph?.type || 'website'
    );
    this.setMetaTag('property', 'og:url', seo.openGraph?.url || baseUrl);
    this.setMetaTag('property', 'og:title', seo.openGraph?.title || defaultTitle);
    this.setMetaTag('property', 'og:description', seo.openGraph?.description || defaultDescription);
    this.setMetaTag('property', 'og:image', seo.openGraph?.image || defaultImage);

    // Twitter Card meta tags (with fallbacks)
    // Twitter uses name= attribute (not property= like Open Graph)
    this.setMetaTag(
      'name',
      'twitter:card',
      seo.twitter?.card || defaults.twitter?.card || 'summary_large_image'
    );
    this.setMetaTag('name', 'twitter:url', seo.twitter?.url || baseUrl);
    this.setMetaTag('name', 'twitter:title', seo.twitter?.title || defaultTitle);
    this.setMetaTag('name', 'twitter:description', seo.twitter?.description || defaultDescription);
    this.setMetaTag('name', 'twitter:image', seo.twitter?.image || defaultImage);

    // Canonical URL (with fallback)
    const canonicalUrl = seo.canonical || baseUrl;
    if (canonicalUrl) {
      this.setLinkTag('canonical', canonicalUrl);
    }

    // Google Site Verification
    if (seo.googleSiteVerification) {
      this.setMetaTag('name', 'google-site-verification', seo.googleSiteVerification);
    }
  }

  /**
   * Inject structured data schemas (Person + ItemList) generated from data.json.
   * Removes any previously injected dynamic schemas before re-injecting.
   */
  public static applyStructuredData(data: PortfolioData): void {
    // Remove previously injected dynamic schemas
    document.querySelectorAll('script[data-dynamic-schema]').forEach(el => el.remove());
    this.injectSchema(this.buildPersonSchema(data));
    this.injectSchema(this.buildProjectsSchema(data));
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
        ...(t.startDate ? { dateCreated: t.startDate } : {}),
      }));

    const sameAs = social.filter(s => s.url && !s.url.startsWith('mailto:')).map(s => s.url);

    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name,
      alternateName: config.name,
      url: baseUrl,
      ...(config.email ? { email: config.email } : {}),
      ...(config.title ? { jobTitle: config.title } : {}),
      ...(config.summary ? { description: config.summary } : {}),
      ...(seo?.defaults?.image ? { image: seo.defaults.image } : {}),
      alumniOf,
      hasCredential,
      ...(currentWork ? { worksFor: { '@type': 'Organization', name: currentWork.company } } : {}),
      sameAs,
    };
  }

  private static buildProjectsSchema(data: PortfolioData): object {
    const { showcase, config } = data;
    const authorName = config.real_name || config.name;

    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${authorName}'s Software Projects`,
      description: `Software projects and applications developed by ${authorName}`,
      itemListElement: showcase.map((project, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'SoftwareApplication',
          name: project.modalContent?.title || project.title,
          ...(project.modalContent?.description
            ? { description: project.modalContent.description }
            : {}),
          applicationCategory: 'WebApplication',
          ...(project.technologies?.length ? { programmingLanguage: project.technologies } : {}),
          ...(project.modalContent?.links?.[0]?.url
            ? { url: project.modalContent.links[0].url }
            : {}),
          author: { '@type': 'Person', name: authorName },
        },
      })),
    };
  }

  private static injectSchema(schema: object): void {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-dynamic-schema', '');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  /**
   * Set or update a meta tag
   */
  private static setMetaTag(
    attribute: 'name' | 'property',
    identifier: string,
    content: string | undefined
  ): void {
    if (!content) {
      return;
    }

    let meta = document.querySelector(`meta[${attribute}="${identifier}"]`) as HTMLMetaElement;

    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attribute, identifier);
      document.head.appendChild(meta);
    }

    meta.setAttribute('content', content);
  }

  /**
   * Set or update a link tag (e.g., canonical)
   */
  private static setLinkTag(rel: string, href: string): void {
    if (!href) {
      return;
    }

    let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;

    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', rel);
      document.head.appendChild(link);
    }

    link.setAttribute('href', href);
  }
}
