import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SEOService } from './seoService';
import type { PortfolioData } from '@/types';

const DYNAMIC_SCHEMA = 'script[data-dynamic-schema]';

/* ------------------------------------------------------------------ *
 * Shapes of the JSON-LD documents SEOService emits. Declared here
 * because they describe what these tests assert about the generated
 * output; `plugins/types.ts` holds the build-time equivalents and the
 * two trees deliberately do not import from each other.
 * ------------------------------------------------------------------ */

interface OrganizationSchema {
  '@type': string;
  name: string;
}

interface CredentialSchema {
  '@type': string;
  name: string;
  credentialCategory: string;
  recognizedBy: OrganizationSchema;
  dateCreated?: string;
}

interface PersonSchema {
  '@context': string;
  '@type': string;
  '@id'?: string;
  name: string;
  alternateName: string;
  url: string;
  email?: string;
  jobTitle?: string;
  description?: string;
  worksFor: OrganizationSchema;
  alumniOf: OrganizationSchema[];
  hasCredential: CredentialSchema[];
  knowsAbout: string[];
  sameAs: string[];
}

interface ProjectItemSchema {
  '@type': string;
  name: string;
  description?: string;
  applicationCategory?: string;
  operatingSystem?: string;
  keywords?: string;
  url?: string;
  mainEntityOfPage?: string;
  image?: string;
  author: OrganizationSchema | { '@id': string };
}

interface ListItemSchema {
  '@type': string;
  position: number;
  item: ProjectItemSchema;
}

interface ItemListSchema {
  '@context': string;
  '@type': string;
  '@id'?: string;
  name: string;
  description: string;
  itemListElement: ListItemSchema[];
}

/**
 * `JSON.parse` hands back `any`, so every property read off it is unchecked.
 * Parsing through this helper names the document shape once, at the point the
 * script tag is read, and keeps the assertions below pinned to that contract.
 */
function parseJsonLd<T>(selector: string, index = 0): T {
  return JSON.parse(document.querySelectorAll(selector)[index]!.textContent) as T;
}

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
      const personSchema = parseJsonLd<PersonSchema>(DYNAMIC_SCHEMA, 0);
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
      const personSchema = parseJsonLd<PersonSchema>(DYNAMIC_SCHEMA, 0);
      expect(personSchema.name).toBe('marcus.cjh');
    });

    it('should include email, jobTitle and description in Person schema', () => {
      SEOService.applyStructuredData(mockData);
      const personSchema = parseJsonLd<PersonSchema>(DYNAMIC_SCHEMA, 0);
      expect(personSchema.email).toBe('test@example.com');
      expect(personSchema.jobTitle).toBe('Full Stack Engineer');
      expect(personSchema.description).toBe('Experienced engineer with 8+ years.');
    });

    it('should set worksFor to the highest-order work entry', () => {
      SEOService.applyStructuredData(mockData);
      const personSchema = parseJsonLd<PersonSchema>(DYNAMIC_SCHEMA, 0);
      expect(personSchema.worksFor['@type']).toBe('Organization');
      expect(personSchema.worksFor.name).toBe('Accenture');
    });

    it('should build alumniOf from education timeline entries only', () => {
      SEOService.applyStructuredData(mockData);
      const personSchema = parseJsonLd<PersonSchema>(DYNAMIC_SCHEMA, 0);
      expect(personSchema.alumniOf).toHaveLength(1);
      expect(personSchema.alumniOf[0]!['@type']).toBe('EducationalOrganization');
      expect(personSchema.alumniOf[0]!.name).toBe('University of Queensland');
    });

    it('should build hasCredential from certification timeline entries only', () => {
      SEOService.applyStructuredData(mockData);
      const personSchema = parseJsonLd<PersonSchema>(DYNAMIC_SCHEMA, 0);
      expect(personSchema.hasCredential).toHaveLength(1);
      expect(personSchema.hasCredential[0]!.name).toBe('AWS Certified Cloud Practitioner');
      expect(personSchema.hasCredential[0]!.recognizedBy.name).toBe('Amazon Web Services');
      expect(personSchema.hasCredential[0]!.dateCreated).toBeUndefined();
    });

    it('should exclude mailto: links from sameAs', () => {
      SEOService.applyStructuredData(mockData);
      const personSchema = parseJsonLd<PersonSchema>(DYNAMIC_SCHEMA, 0);
      expect(personSchema.sameAs).toContain('https://github.com/test');
      expect(personSchema.sameAs).toContain('https://linkedin.com/in/test');
      expect(personSchema.sameAs).not.toContain('mailto:test@example.com');
    });

    it('should build ItemList schema from all showcase entries', () => {
      SEOService.applyStructuredData(mockData);
      const listSchema = parseJsonLd<ItemListSchema>(DYNAMIC_SCHEMA, 1);
      expect(listSchema['@type']).toBe('ItemList');
      expect(listSchema.itemListElement).toHaveLength(2);
      expect(listSchema.itemListElement[0]!.position).toBe(1);
      expect(listSchema.itemListElement[1]!.position).toBe(2);
    });

    it('should use modalContent title and description for each project', () => {
      SEOService.applyStructuredData(mockData);
      const listSchema = parseJsonLd<ItemListSchema>(DYNAMIC_SCHEMA, 1);
      const item = listSchema.itemListElement[0]!.item;
      expect(item.name).toBe('Project One Title');
      expect(item.description).toBe('Project one description.');
      expect(item.keywords).toBe('TypeScript, React');
      expect(item.operatingSystem).toBe('Web');
      expect(item.url).toBe('https://example.com/projects/project1/');
      expect(item.mainEntityOfPage).toBe('https://example.com/projects/project1/');
    });

    it('should fall back to project title when modalContent title is absent', () => {
      const data: PortfolioData = {
        ...mockData,
        showcase: [{ id: 'p', title: 'Raw Title', backgroundImage: './img.png' }],
      };
      SEOService.applyStructuredData(data);
      const listSchema = parseJsonLd<ItemListSchema>(DYNAMIC_SCHEMA, 1);
      expect(listSchema.itemListElement[0]!.item.name).toBe('Raw Title');
    });

    it('should link projects without external links to their internal case study', () => {
      SEOService.applyStructuredData(mockData);
      const listSchema = parseJsonLd<ItemListSchema>(DYNAMIC_SCHEMA, 1);
      const item = listSchema.itemListElement[1]!.item;
      expect(item.url).toBe('https://example.com/projects/project2/');
    });

    it('should remove old schemas and inject fresh ones when called again', () => {
      SEOService.applyStructuredData(mockData);
      SEOService.applyStructuredData(mockData);
      const scripts = document.querySelectorAll('script[data-dynamic-schema]');
      expect(scripts).toHaveLength(2); // not 4
    });

    it('should update build-time schemas instead of creating duplicates', () => {
      document.head.innerHTML = `
        <script type="application/ld+json" data-schema="person">{}</script>
        <script type="application/ld+json" data-schema="projects">{}</script>
      `;

      SEOService.applyStructuredData(mockData);

      expect(document.querySelectorAll('script[data-schema="person"]')).toHaveLength(1);
      expect(document.querySelectorAll('script[data-schema="projects"]')).toHaveLength(1);
      expect(document.querySelectorAll('script[data-dynamic-schema]')).toHaveLength(0);
      const personSchema = parseJsonLd<PersonSchema>('script[data-schema="person"]');
      expect(personSchema.name).toBe('Marcus Chan');
    });
  });
});

describe('SEOService optional and fallback branches', () => {
  const minimal: PortfolioData = {
    config: { name: 'solo', title: '', subtitle: '', summary: '', typedMessages: [] },
    social: [{ platform: 'Site', url: '', icon: 'x' }],
    timeline: [],
    showcase: [
      { id: 'datav-webinar', title: 'Webinar', backgroundImage: '' },
      {
        id: 'app',
        title: 'App',
        backgroundImage: '/abs/img.png',
        technologies: [],
        modalContent: { title: '', description: '', links: [] },
      },
    ],
    navigation: [],
  };

  beforeEach(() => {
    document.head.innerHTML = '';
  });

  afterEach(() => {
    document.head.innerHTML = '';
  });

  it('omits optional Person fields and ids when no base url or email exists', () => {
    SEOService.applyStructuredData(minimal);
    const person = parseJsonLd<PersonSchema>(DYNAMIC_SCHEMA, 0);
    expect(person['@id']).toBeUndefined();
    expect(person.email).toBeUndefined();
    expect(person.jobTitle).toBeUndefined();
    expect(person.description).toBeUndefined();
    expect(person.worksFor).toBeUndefined();
    expect(person.name).toBe('solo');
    expect(person.url).toBe('');
    expect(person.knowsAbout).toEqual([]);
    expect(person.sameAs).toEqual([]);
  });

  it('omits url, image and list @id without a base url, and authors as an inline Person', () => {
    SEOService.applyStructuredData(minimal);
    const list = parseJsonLd<ItemListSchema>(DYNAMIC_SCHEMA, 1);
    expect(list['@id']).toBeUndefined();
    const app = list.itemListElement[1]!.item;
    expect(app.url).toBeUndefined();
    expect(app.image).toBeUndefined();
    expect(app.author).toEqual({ '@type': 'Person', name: 'solo' });
  });

  it('types datav-webinar as a CreativeWork without application fields', () => {
    SEOService.applyStructuredData(minimal);
    const list = parseJsonLd<ItemListSchema>(DYNAMIC_SCHEMA, 1);
    const webinar = list.itemListElement[0]!.item;
    expect(webinar['@type']).toBe('CreativeWork');
    expect(webinar.applicationCategory).toBeUndefined();
    expect(webinar.operatingSystem).toBeUndefined();
    expect(list.itemListElement[1]!.item['@type']).toBe('SoftwareApplication');
  });

  it('skips description and keywords when empty', () => {
    SEOService.applyStructuredData(minimal);
    const list = parseJsonLd<ItemListSchema>(DYNAMIC_SCHEMA, 1);
    const app = list.itemListElement[1]!.item;
    expect(app.name).toBe('App');
    expect(app.description).toBeUndefined();
    expect(app.keywords).toBeUndefined();
  });

  it('prefers seo.defaults.url, strips trailing slashes and normalises image paths', () => {
    const data: PortfolioData = {
      ...minimal,
      config: { ...minimal.config, website: 'https://ignored.example' },
      seo: { defaults: { url: 'https://site.example/' } },
      skills: { a: ['TS', 'CSS'], b: ['TS', 'Go'] },
      social: [{ platform: 'GH', url: 'https://github.com/x', icon: 'x' }],
      showcase: [
        { id: 'a b', title: 'A', backgroundImage: './img/a.png' },
        { id: 'c', title: 'C', backgroundImage: '/img/c.png' },
      ],
    };
    SEOService.applyStructuredData(data);
    const person = parseJsonLd<PersonSchema>(DYNAMIC_SCHEMA, 0);
    expect(person['@id']).toBe('https://site.example/#person');
    expect(person.url).toBe('https://site.example/');
    expect(person.knowsAbout).toEqual(['TS', 'CSS', 'Go']);
    expect(person.sameAs).toEqual(['https://github.com/x']);

    const list = parseJsonLd<ItemListSchema>(DYNAMIC_SCHEMA, 1);
    expect(list['@id']).toBe('https://site.example/#projects');
    const [first, second] = list.itemListElement;
    expect(first!.item.url).toBe('https://site.example/projects/a%20b/');
    expect(first!.item.image).toBe('https://site.example/img/a.png');
    expect(second!.item.image).toBe('https://site.example/img/c.png');
    expect(first!.item.author).toEqual({ '@id': 'https://site.example/#person' });
  });
});
