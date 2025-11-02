import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SEOService } from './seoService';
import type { SEOConfig } from '@/types';

describe('SEOService', () => {
  beforeEach(() => {
    // Reset document
    document.title = '';
    document.head.innerHTML = '';
  });

  afterEach(() => {
    // Restore original implementations
    vi.restoreAllMocks();
    document.head.innerHTML = '';
    document.title = '';
  });

  it('should update document title', () => {
    const seoConfig: SEOConfig = {
      meta: {
        title: 'Test Title',
        description: 'Test Description',
        keywords: 'test, keywords',
        author: 'Test Author',
        robots: 'index, follow',
      },
      openGraph: {
        type: 'website',
        url: 'https://example.com',
        title: 'OG Title',
        description: 'OG Description',
        image: 'https://example.com/image.png',
      },
      twitter: {
        card: 'summary_large_image',
        url: 'https://example.com',
        title: 'Twitter Title',
        description: 'Twitter Description',
        image: 'https://example.com/image.png',
      },
      canonical: 'https://example.com',
    };

    SEOService.applySEO(seoConfig);

    expect(document.title).toBe('Test Title');
  });

  it('should create and set meta tags', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    const appendChildSpy = vi.spyOn(document.head, 'appendChild');

    const seoConfig: SEOConfig = {
      meta: {
        title: 'Test Title',
        description: 'Test Description',
        keywords: 'test, keywords',
        author: 'Test Author',
        robots: 'index, follow',
      },
      openGraph: {
        type: 'website',
        url: 'https://example.com',
        title: 'OG Title',
        description: 'OG Description',
        image: 'https://example.com/image.png',
      },
      twitter: {
        card: 'summary_large_image',
        url: 'https://example.com',
        title: 'Twitter Title',
        description: 'Twitter Description',
        image: 'https://example.com/image.png',
      },
      canonical: 'https://example.com',
    };

    SEOService.applySEO(seoConfig);

    // Check that meta tags were created
    expect(createElementSpy).toHaveBeenCalledWith('meta');
    expect(appendChildSpy).toHaveBeenCalled();
  });

  it('should set basic meta tags correctly', () => {
    const seoConfig: SEOConfig = {
      meta: {
        title: 'Page Title',
        description: 'Page description for SEO',
        keywords: 'keyword1, keyword2, keyword3',
        author: 'Author Name',
        robots: 'noindex, nofollow',
      },
      openGraph: {
        type: 'website',
        url: 'https://example.com',
        title: 'OG Title',
        description: 'OG Description',
        image: 'https://example.com/image.png',
      },
      twitter: {
        card: 'summary_large_image',
        url: 'https://example.com',
        title: 'Twitter Title',
        description: 'Twitter Description',
        image: 'https://example.com/image.png',
      },
      canonical: 'https://example.com',
    };

    SEOService.applySEO(seoConfig);

    // Verify title was set
    expect(document.title).toBe('Page Title');

    // Verify meta tags exist in DOM
    expect(document.querySelector('meta[name="description"]')).toBeTruthy();
    expect(document.querySelector('meta[name="keywords"]')).toBeTruthy();
    expect(document.querySelector('meta[name="author"]')).toBeTruthy();
    expect(document.querySelector('meta[name="robots"]')).toBeTruthy();
  });

  it('should set Open Graph meta tags', () => {
    const seoConfig: SEOConfig = {
      meta: {
        title: 'Title',
        description: 'Description',
        keywords: 'keywords',
        author: 'Author',
        robots: 'index, follow',
      },
      openGraph: {
        type: 'article',
        url: 'https://example.com/article',
        title: 'Article Title',
        description: 'Article Description',
        image: 'https://example.com/article-image.png',
      },
      twitter: {
        card: 'summary',
        url: 'https://example.com',
        title: 'Twitter Title',
        description: 'Twitter Description',
        image: 'https://example.com/image.png',
      },
      canonical: 'https://example.com',
    };

    SEOService.applySEO(seoConfig);

    // Verify Open Graph tags exist
    expect(document.querySelector('meta[property="og:type"]')).toBeTruthy();
    expect(document.querySelector('meta[property="og:url"]')).toBeTruthy();
    expect(document.querySelector('meta[property="og:title"]')).toBeTruthy();
    expect(document.querySelector('meta[property="og:description"]')).toBeTruthy();
    expect(document.querySelector('meta[property="og:image"]')).toBeTruthy();
  });

  it('should set Twitter Card meta tags', () => {
    const seoConfig: SEOConfig = {
      meta: {
        title: 'Title',
        description: 'Description',
        keywords: 'keywords',
        author: 'Author',
        robots: 'index, follow',
      },
      openGraph: {
        type: 'website',
        url: 'https://example.com',
        title: 'OG Title',
        description: 'OG Description',
        image: 'https://example.com/image.png',
      },
      twitter: {
        card: 'summary',
        url: 'https://example.com/twitter',
        title: 'Twitter Card Title',
        description: 'Twitter Card Description',
        image: 'https://example.com/twitter-image.png',
      },
      canonical: 'https://example.com',
    };

    SEOService.applySEO(seoConfig);

    // Verify Twitter Card tags exist
    expect(document.querySelector('meta[property="twitter:card"]')).toBeTruthy();
    expect(document.querySelector('meta[property="twitter:url"]')).toBeTruthy();
    expect(document.querySelector('meta[property="twitter:title"]')).toBeTruthy();
    expect(document.querySelector('meta[property="twitter:description"]')).toBeTruthy();
    expect(document.querySelector('meta[property="twitter:image"]')).toBeTruthy();
  });

  it('should set canonical link', () => {
    const seoConfig: SEOConfig = {
      meta: {
        title: 'Title',
        description: 'Description',
        keywords: 'keywords',
        author: 'Author',
        robots: 'index, follow',
      },
      openGraph: {
        type: 'website',
        url: 'https://example.com',
        title: 'OG Title',
        description: 'OG Description',
        image: 'https://example.com/image.png',
      },
      twitter: {
        card: 'summary_large_image',
        url: 'https://example.com',
        title: 'Twitter Title',
        description: 'Twitter Description',
        image: 'https://example.com/image.png',
      },
      canonical: 'https://example.com/canonical',
    };

    SEOService.applySEO(seoConfig);

    const canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    expect(canonicalLink).toBeTruthy();
    expect(canonicalLink.href).toBe('https://example.com/canonical');
  });

  it('should set Google Site Verification', () => {
    const seoConfig: SEOConfig = {
      meta: {
        title: 'Title',
        description: 'Description',
        keywords: 'keywords',
        author: 'Author',
        robots: 'index, follow',
      },
      openGraph: {
        type: 'website',
        url: 'https://example.com',
        title: 'OG Title',
        description: 'OG Description',
        image: 'https://example.com/image.png',
      },
      twitter: {
        card: 'summary_large_image',
        url: 'https://example.com',
        title: 'Twitter Title',
        description: 'Twitter Description',
        image: 'https://example.com/image.png',
      },
      canonical: 'https://example.com',
      googleSiteVerification: 'verification-code-123',
    };

    SEOService.applySEO(seoConfig);

    const verificationMeta = document.querySelector(
      'meta[name="google-site-verification"]'
    ) as HTMLMetaElement;
    expect(verificationMeta).toBeTruthy();
    expect(verificationMeta.content).toBe('verification-code-123');
  });

  it('should handle missing optional fields gracefully', () => {
    const seoConfig: SEOConfig = {
      meta: {
        title: 'Title',
        description: 'Description',
        keywords: 'keywords',
        author: 'Author',
        robots: 'index, follow',
      },
      openGraph: {
        type: 'website',
        url: 'https://example.com',
        title: 'OG Title',
        description: 'OG Description',
        image: 'https://example.com/image.png',
      },
      twitter: {
        card: 'summary_large_image',
        url: 'https://example.com',
        title: 'Twitter Title',
        description: 'Twitter Description',
        image: 'https://example.com/image.png',
      },
      canonical: 'https://example.com',
      // googleSiteVerification is optional and not provided
    };

    expect(() => SEOService.applySEO(seoConfig)).not.toThrow();
    expect(document.title).toBe('Title');
  });

  it('should update existing meta tags', () => {
    // Create an existing meta tag
    const existingMeta = document.createElement('meta');
    existingMeta.setAttribute('name', 'description');
    existingMeta.setAttribute('content', 'Old Description');
    document.head.appendChild(existingMeta);

    const seoConfig: SEOConfig = {
      meta: {
        title: 'Title',
        description: 'New Description',
        keywords: 'keywords',
        author: 'Author',
        robots: 'index, follow',
      },
      openGraph: {
        type: 'website',
        url: 'https://example.com',
        title: 'OG Title',
        description: 'OG Description',
        image: 'https://example.com/image.png',
      },
      twitter: {
        card: 'summary_large_image',
        url: 'https://example.com',
        title: 'Twitter Title',
        description: 'Twitter Description',
        image: 'https://example.com/image.png',
      },
      canonical: 'https://example.com',
    };

    SEOService.applySEO(seoConfig);

    // Should update existing meta tag, not create a new one
    const descriptionMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    expect(descriptionMeta).toBeTruthy();
    expect(descriptionMeta.content).toBe('New Description');
    // Should only have one description meta tag
    expect(document.querySelectorAll('meta[name="description"]').length).toBe(1);
  });

  it('should handle empty SEO config without errors', () => {
    const seoConfig = {} as SEOConfig;

    expect(() => SEOService.applySEO(seoConfig)).not.toThrow();
  });

  it('should use defaults for fallback values', () => {
    const seoConfig: SEOConfig = {
      defaults: {
        url: 'https://example.com',
        title: 'Default Title',
        description: 'Default Description',
        image: 'https://example.com/default-image.png',
        author: 'Default Author',
        robots: 'index, follow',
        openGraph: {
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
        },
      },
      meta: {
        keywords: 'test keywords',
        // title and description omitted to test fallback
      },
      openGraph: {
        // Empty object - should use defaults
      },
      twitter: {
        // Empty object - should use defaults
      },
      // canonical omitted - should use defaults.url
    };

    SEOService.applySEO(seoConfig);

    // Should use default title
    expect(document.title).toBe('Default Title');

    // Should use default description
    const descriptionMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    expect(descriptionMeta.content).toBe('Default Description');

    // Should use default URL for canonical
    const canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    expect(canonicalLink.getAttribute('href')).toBe('https://example.com');

    // Should use default image for OG
    const ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
    expect(ogImage.content).toBe('https://example.com/default-image.png');

    // Should use default image for Twitter
    const twitterImage = document.querySelector(
      'meta[property="twitter:image"]'
    ) as HTMLMetaElement;
    expect(twitterImage.content).toBe('https://example.com/default-image.png');
  });
});
