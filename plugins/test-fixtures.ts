import type { SiteData } from './types.ts';

/**
 * Minimal data.json-shaped fixture for the build-time builder tests.
 *
 * Values deliberately contain `&`, `<`, `"` and `'` so escaping regressions
 * show up in the generated XML/HTML.
 */
export function createSiteData(): SiteData {
  return {
    config: {
      name: 'tester',
      real_name: 'Ada "A&B" O\'Hara',
      title: 'Engineer & Architect',
      subtitle: 'Builds <things>',
      summary: 'Summary with & and <angle> brackets.',
      email: 'ada@example.com',
      website: 'https://fallback.example.com',
    },
    seo: {
      defaults: {
        url: 'https://example.com/',
        title: 'Default Title',
        description: 'Default description',
        image: './showcase/hero&main.png',
        author: 'Ada Author',
        robots: 'index, follow',
        openGraph: { type: 'website' },
        twitter: { card: 'summary_large_image' },
      },
      meta: {
        title: 'Meta Title',
        description: 'Meta description',
        themeColor: '#c6f24e',
        backgroundColor: '#08090a',
        googlebot: 'index, follow',
        bingbot: 'index, follow',
      },
      openGraph: {
        site_name: 'Ada | Portfolio',
        locale: 'en_SG',
        imageWidth: '520',
        imageHeight: '366',
        imageType: 'image/png',
      },
      twitter: { creator: '@ada', site: '@ada' },
      alternateUrls: [{ href: 'https://example.com/', hreflang: 'en' }],
      googleSiteVerification: 'verification-token',
    },
    social: [
      { platform: 'LinkedIn', url: 'https://linkedin.example.com/in/ada' },
      { platform: 'Email', url: 'mailto:ada@example.com' },
      { name: 'Medium', url: 'https://medium.example.com/@ada' },
    ],
    navigation: [
      { id: 'home', enabled: true, title: 'home' },
      { id: 'timeline', enabled: true, title: 'timeline' },
      { id: 'hidden', enabled: false, title: 'hidden' },
    ],
    showcase: [
      {
        id: 'alpha',
        title: 'Alpha & Co',
        backgroundImage: './showcase/alpha&one.png',
        technologies: ['TypeScript', 'Vite'],
        modalContent: {
          title: 'Alpha: the long title',
          description: 'Alpha description',
          image: './showcase/alpha-modal.png',
          links: [
            { text: 'Try it Live', url: 'https://alpha.example.com/' },
            { text: 'Internal', url: 'https://example.com/alpha/' },
          ],
        },
      },
      {
        id: 'datav-webinar',
        title: 'Webinar',
        technologies: [],
        modalContent: {
          title: 'Webinar talk',
          description: 'A talk, not an app.',
          video: { src: 'https://cdn.example.com/talk.mp4', type: 'video/mp4' },
          links: [],
        },
      },
    ],
    timeline: [
      {
        category: 'education',
        order: 0,
        startDate: '2011',
        endDate: '2014',
        company: 'Polytechnic',
        title: 'Diploma',
      },
      {
        category: 'work',
        order: 1,
        startDate: 'Jul 2017',
        endDate: 'Jan 2018',
        company: 'Old Employer',
        title: 'Junior Developer',
      },
      {
        category: 'certification',
        order: 2,
        startDate: 'Mar 2024',
        company: 'Cert Issuer',
        title: 'Certified Something',
      },
      {
        category: 'work',
        order: 3,
        startDate: 'Apr 2021',
        endDate: 'Present',
        company: 'Current Employer',
        title: 'Lead Engineer',
      },
    ],
    skills: {
      languages: ['TypeScript', 'SQL'],
      cloud: ['TypeScript', 'AWS'],
    },
  };
}

/**
 * `JSON.parse` returns `any`, which makes every subsequent property read an
 * unchecked access. The builders under test all emit documents whose shapes are
 * declared in `./types.ts`, so tests parse through this helper and name the
 * expected shape, which keeps the assertions pinned to the real contract.
 */
export function parseJson<T>(text: string): T {
  return JSON.parse(text) as T;
}

/**
 * Vite declares hooks as `fn | { handler: fn, order?: ... }`. Tests call the
 * hook directly, so this normalises either shape to the plain function.
 */
export function hookFunction<F>(hook: F | { handler: F } | undefined): F {
  if (hook === undefined) {
    throw new Error('Plugin hook is not defined');
  }
  if (typeof hook === 'object' && hook !== null && 'handler' in hook) {
    return hook.handler;
  }
  return hook;
}
