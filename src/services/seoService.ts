// SEO service for managing meta tags dynamically
import type { SEOConfig } from '@/types';

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
    const defaultTitle = seo.meta?.title || defaults.title || '';
    const defaultDescription = seo.meta?.description || defaults.description || '';
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
    // Always set Twitter tags if we have defaults or explicit twitter config
    this.setMetaTag(
      'property',
      'twitter:card',
      seo.twitter?.card || defaults.twitter?.card || 'summary_large_image'
    );
    this.setMetaTag('property', 'twitter:url', seo.twitter?.url || baseUrl);
    this.setMetaTag('property', 'twitter:title', seo.twitter?.title || defaultTitle);
    this.setMetaTag(
      'property',
      'twitter:description',
      seo.twitter?.description || defaultDescription
    );
    this.setMetaTag('property', 'twitter:image', seo.twitter?.image || defaultImage);

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
