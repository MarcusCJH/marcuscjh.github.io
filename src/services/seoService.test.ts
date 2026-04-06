import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SEOService } from './seoService';
import type { PortfolioData, SEOConfig } from '@/types';

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

    // Verify Twitter Card tags exist (Twitter uses name= not property=)
    expect(document.querySelector('meta[name="twitter:card"]')).toBeTruthy();
    expect(document.querySelector('meta[name="twitter:url"]')).toBeTruthy();
    expect(document.querySelector('meta[name="twitter:title"]')).toBeTruthy();
    expect(document.querySelector('meta[name="twitter:description"]')).toBeTruthy();
    expect(document.querySelector('meta[name="twitter:image"]')).toBeTruthy();
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
    const twitterImage = document.querySelector('meta[name="twitter:image"]') as HTMLMetaElement;
    expect(twitterImage.content).toBe('https://example.com/default-image.png');
  });

  describe('applyStructuredData', () => {
    const mockData: PortfolioData = {
      config: {
        name: 'marcus.cjh',
        real_name: 'Marcus Chan',
        title: 'Full Stack Engineer',
        subtitle: 'Building things',
        summary: 'Experienced engineer with 8+ years.',
        email: 'test@example.com',
        website: 'https://example.com',
        typedMessages: [],
      },
      social: [
        { platform: 'GitHub', url: 'https://github.com/test', icon: 'fab fa-github' },
        { platform: 'LinkedIn', url: 'https://linkedin.com/in/test', icon: 'fab fa-linkedin' },
        { platform: 'Email', url: 'mailto:test@example.com', icon: 'fas fa-envelope' },
      ],
      timeline: [
        {
          category: 'work',
          order: 2,
          company: 'Accenture',
          title: 'Senior Engineer',
          startDate: 'Jan 2022',
          endDate: 'Present',
        },
        {
          category: 'work',
          order: 1,
          company: 'Previous Corp',
          title: 'Engineer',
          startDate: 'Jan 2020',
          endDate: 'Dec 2021',
        },
        {
          category: 'education',
          order: 0,
          company: 'University of Queensland',
          title: 'Bachelor of IT',
          startDate: '2018',
        },
        {
          category: 'certification',
          order: 3,
          company: 'Amazon Web Services',
          title: 'AWS Certified Cloud Practitioner',
          startDate: 'Mar 2022',
        },
      ],
      showcase: [
        {
          id: 'project1',
          title: 'Project One',
          backgroundImage: './img.png',
          technologies: ['TypeScript', 'React'],
          modalContent: {
            title: 'Project One Title',
            description: 'Project one description.',
            links: [{ text: 'Live', url: 'https://project1.com' }],
          },
        },
        {
          id: 'project2',
          title: 'Project Two',
          backgroundImage: './img2.png',
          technologies: ['Python'],
          modalContent: {
            title: 'Project Two Title',
            description: 'Project two description.',
            links: [],
          },
        },
      ],
      navigation: [],
    };

    it('should inject exactly two script tags with data-dynamic-schema', () => {
      SEOService.applyStructuredData(mockData);
      const scripts = document.querySelectorAll('script[data-dynamic-schema]');
      expect(scripts).toHaveLength(2);
      scripts.forEach(s => expect(s.getAttribute('type')).toBe('application/ld+json'));
    });

    it('should use real_name as Person schema name with name as alternateName', () => {
      SEOService.applyStructuredData(mockData);
      const personSchema = JSON.parse(
        document.querySelectorAll('script[data-dynamic-schema]')[0].textContent!
      );
      expect(personSchema['@type']).toBe('Person');
      expect(personSchema.name).toBe('Marcus Chan');
      expect(personSchema.alternateName).toBe('marcus.cjh');
    });

    it('should fall back to name when real_name is absent', () => {
      const data: PortfolioData = {
        ...mockData,
        config: { ...mockData.config, real_name: undefined },
      };
      SEOService.applyStructuredData(data);
      const personSchema = JSON.parse(
        document.querySelectorAll('script[data-dynamic-schema]')[0].textContent!
      );
      expect(personSchema.name).toBe('marcus.cjh');
    });

    it('should include email, jobTitle and description in Person schema', () => {
      SEOService.applyStructuredData(mockData);
      const personSchema = JSON.parse(
        document.querySelectorAll('script[data-dynamic-schema]')[0].textContent!
      );
      expect(personSchema.email).toBe('test@example.com');
      expect(personSchema.jobTitle).toBe('Full Stack Engineer');
      expect(personSchema.description).toBe('Experienced engineer with 8+ years.');
    });

    it('should set worksFor to the highest-order work entry', () => {
      SEOService.applyStructuredData(mockData);
      const personSchema = JSON.parse(
        document.querySelectorAll('script[data-dynamic-schema]')[0].textContent!
      );
      expect(personSchema.worksFor['@type']).toBe('Organization');
      expect(personSchema.worksFor.name).toBe('Accenture');
    });

    it('should build alumniOf from education timeline entries only', () => {
      SEOService.applyStructuredData(mockData);
      const personSchema = JSON.parse(
        document.querySelectorAll('script[data-dynamic-schema]')[0].textContent!
      );
      expect(personSchema.alumniOf).toHaveLength(1);
      expect(personSchema.alumniOf[0]['@type']).toBe('EducationalOrganization');
      expect(personSchema.alumniOf[0].name).toBe('University of Queensland');
    });

    it('should build hasCredential from certification timeline entries only', () => {
      SEOService.applyStructuredData(mockData);
      const personSchema = JSON.parse(
        document.querySelectorAll('script[data-dynamic-schema]')[0].textContent!
      );
      expect(personSchema.hasCredential).toHaveLength(1);
      expect(personSchema.hasCredential[0].name).toBe('AWS Certified Cloud Practitioner');
      expect(personSchema.hasCredential[0].recognizedBy.name).toBe('Amazon Web Services');
      expect(personSchema.hasCredential[0].dateCreated).toBe('Mar 2022');
    });

    it('should exclude mailto: links from sameAs', () => {
      SEOService.applyStructuredData(mockData);
      const personSchema = JSON.parse(
        document.querySelectorAll('script[data-dynamic-schema]')[0].textContent!
      );
      expect(personSchema.sameAs).toContain('https://github.com/test');
      expect(personSchema.sameAs).toContain('https://linkedin.com/in/test');
      expect(personSchema.sameAs).not.toContain('mailto:test@example.com');
    });

    it('should build ItemList schema from all showcase entries', () => {
      SEOService.applyStructuredData(mockData);
      const listSchema = JSON.parse(
        document.querySelectorAll('script[data-dynamic-schema]')[1].textContent!
      );
      expect(listSchema['@type']).toBe('ItemList');
      expect(listSchema.itemListElement).toHaveLength(2);
      expect(listSchema.itemListElement[0].position).toBe(1);
      expect(listSchema.itemListElement[1].position).toBe(2);
    });

    it('should use modalContent title and description for each project', () => {
      SEOService.applyStructuredData(mockData);
      const listSchema = JSON.parse(
        document.querySelectorAll('script[data-dynamic-schema]')[1].textContent!
      );
      const item = listSchema.itemListElement[0].item;
      expect(item.name).toBe('Project One Title');
      expect(item.description).toBe('Project one description.');
      expect(item.programmingLanguage).toEqual(['TypeScript', 'React']);
      expect(item.url).toBe('https://project1.com');
    });

    it('should fall back to project title when modalContent title is absent', () => {
      const data: PortfolioData = {
        ...mockData,
        showcase: [{ id: 'p', title: 'Raw Title', backgroundImage: './img.png' }],
      };
      SEOService.applyStructuredData(data);
      const listSchema = JSON.parse(
        document.querySelectorAll('script[data-dynamic-schema]')[1].textContent!
      );
      expect(listSchema.itemListElement[0].item.name).toBe('Raw Title');
    });

    it('should omit url for projects with no links', () => {
      SEOService.applyStructuredData(mockData);
      const listSchema = JSON.parse(
        document.querySelectorAll('script[data-dynamic-schema]')[1].textContent!
      );
      const item = listSchema.itemListElement[1].item;
      expect(item.url).toBeUndefined();
    });

    it('should remove old schemas and inject fresh ones when called again', () => {
      SEOService.applyStructuredData(mockData);
      SEOService.applyStructuredData(mockData);
      const scripts = document.querySelectorAll('script[data-dynamic-schema]');
      expect(scripts).toHaveLength(2); // not 4
    });
  });
});
