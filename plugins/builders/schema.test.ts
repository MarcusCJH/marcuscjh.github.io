import { describe, expect, it } from 'vitest';
import {
  buildPersonSchema,
  buildProfilePageSchema,
  buildProjectsSchema,
  buildWebsiteSchema,
  isCreativeWork,
} from './schema.ts';
import { createSiteData } from '../test-fixtures.ts';

describe('buildPersonSchema', () => {
  const person = buildPersonSchema(createSiteData());

  it('is a schema.org Person identified by the site-root #person anchor', () => {
    expect(person['@context']).toBe('https://schema.org');
    expect(person['@type']).toBe('Person');
    expect(person['@id']).toBe('https://example.com/#person');
    expect(person.url).toBe('https://example.com/');
  });

  it('uses the real name with the handle as the alternate name', () => {
    expect(person.name).toBe('Ada "A&B" O\'Hara');
    expect(person.alternateName).toBe('tester');
  });

  it('carries the contact, role and summary fields', () => {
    expect(person.email).toBe('ada@example.com');
    expect(person.jobTitle).toBe('Engineer & Architect');
    expect(person.description).toBe('Summary with & and <angle> brackets.');
  });

  it('picks the highest-order work entry as the current employer', () => {
    expect(person.worksFor).toEqual({ '@type': 'Organization', name: 'Current Employer' });
  });

  it('maps education to alumniOf and certifications to hasCredential', () => {
    expect(person.alumniOf).toEqual([{ '@type': 'EducationalOrganization', name: 'Polytechnic' }]);
    expect(person.hasCredential).toEqual([
      {
        '@type': 'EducationalOccupationalCredential',
        name: 'Certified Something',
        credentialCategory: 'Professional Certification',
        recognizedBy: { '@type': 'Organization', name: 'Cert Issuer' },
      },
    ]);
  });

  it('flattens and de-duplicates skills into knowsAbout', () => {
    expect(person.knowsAbout).toEqual(['TypeScript', 'SQL', 'AWS']);
  });

  it('lists only linkable social profiles in sameAs', () => {
    expect(person.sameAs).toEqual([
      'https://linkedin.example.com/in/ada',
      'https://medium.example.com/@ada',
    ]);
  });

  it('omits optional fields and falls back to config.website for the base url', () => {
    const data = createSiteData();
    delete data.seo.defaults?.url;
    data.config.email = undefined;
    data.config.summary = undefined;
    data.timeline = data.timeline.filter(item => item.category !== 'work');
    const minimal = buildPersonSchema(data);
    expect(minimal['@id']).toBe('https://fallback.example.com/#person');
    expect(minimal).not.toHaveProperty('email');
    expect(minimal).not.toHaveProperty('description');
    expect(minimal).not.toHaveProperty('worksFor');
  });
});

describe('buildProjectsSchema', () => {
  const list = buildProjectsSchema(createSiteData());

  it('is an ItemList anchored at #projects', () => {
    expect(list['@type']).toBe('ItemList');
    expect(list['@id']).toBe('https://example.com/#projects');
    expect(list.name).toBe('Ada "A&B" O\'Hara\'s software projects');
    expect(list.itemListElement).toHaveLength(2);
  });

  it('describes a software project with its category, keywords and image', () => {
    expect(list.itemListElement[0]).toEqual({
      '@type': 'ListItem',
      position: 1,
      item: {
        '@type': 'SoftwareApplication',
        name: 'Alpha: the long title',
        description: 'Alpha description',
        applicationCategory: 'WebApplication',
        operatingSystem: 'Web',
        keywords: 'TypeScript, Vite',
        url: 'https://example.com/projects/alpha/',
        mainEntityOfPage: 'https://example.com/projects/alpha/',
        image: 'https://example.com/showcase/alpha&one.png',
        author: { '@id': 'https://example.com/#person' },
      },
    });
  });

  it('types the webinar as a CreativeWork without application metadata', () => {
    const item = list.itemListElement[1]!.item;
    expect(item['@type']).toBe('CreativeWork');
    expect(item).not.toHaveProperty('applicationCategory');
    expect(item).not.toHaveProperty('keywords');
    expect(item).not.toHaveProperty('image');
    expect(isCreativeWork('datav-webinar')).toBe(true);
    expect(isCreativeWork('alpha')).toBe(false);
  });
});

describe('buildWebsiteSchema', () => {
  it('describes the portfolio and attributes it to the Person', () => {
    expect(buildWebsiteSchema(createSiteData())).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': 'https://example.com/#website',
      name: 'Ada "A&B" O\'Hara — Portfolio',
      url: 'https://example.com/',
      description: 'Personal portfolio of Ada "A&B" O\'Hara, Engineer & Architect.',
      author: { '@id': 'https://example.com/#person' },
    });
  });
});

describe('buildProfilePageSchema', () => {
  it('links the profile page to the Person and the WebSite', () => {
    expect(
      buildProfilePageSchema(createSiteData(), {
        title: 'Meta Title',
        description: 'Meta description',
        dateModified: '2026-11-08T00:00:00.000Z',
      })
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      '@id': 'https://example.com/#profile',
      url: 'https://example.com/',
      name: 'Meta Title',
      description: 'Meta description',
      dateModified: '2026-11-08T00:00:00.000Z',
      mainEntity: { '@id': 'https://example.com/#person' },
      isPartOf: { '@id': 'https://example.com/#website' },
    });
  });
});
