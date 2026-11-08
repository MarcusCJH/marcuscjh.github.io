/**
 * Build-time shapes for the data that drives SSG/SEO generation.
 *
 * These mirror `public/data.json` (the single source of truth for site
 * content) plus the JSON-LD / web-manifest documents produced from it.
 * They intentionally live outside `src/` because they describe the *build*
 * contract, not the runtime one.
 */

/* ------------------------------------------------------------------ *
 * data.json
 * ------------------------------------------------------------------ */

export interface SiteConfig {
  name: string;
  real_name?: string;
  title: string;
  subtitle: string;
  summary?: string;
  email?: string;
  website?: string;
}

export interface SeoOpenGraphDefaults {
  type?: string;
}

export interface SeoTwitterDefaults {
  card?: string;
}

export interface SeoDefaults {
  url?: string;
  title?: string;
  description?: string;
  image?: string;
  author?: string;
  robots?: string;
  openGraph?: SeoOpenGraphDefaults;
  twitter?: SeoTwitterDefaults;
}

export interface SeoMeta {
  title?: string;
  description?: string;
  themeColor?: string;
  backgroundColor?: string;
  robots?: string;
  googlebot?: string;
  bingbot?: string;
}

export interface SeoOpenGraph {
  type?: string;
  url?: string;
  title?: string;
  description?: string;
  site_name?: string;
  locale?: string;
  image?: string;
  imageWidth?: string;
  imageHeight?: string;
  imageType?: string;
}

export interface SeoTwitter {
  card?: string;
  url?: string;
  title?: string;
  description?: string;
  image?: string;
  creator?: string;
  site?: string;
}

export interface SeoAlternateUrl {
  href: string;
  hreflang: string;
}

export interface SeoData {
  defaults?: SeoDefaults;
  meta?: SeoMeta;
  openGraph?: SeoOpenGraph;
  twitter?: SeoTwitter;
  canonical?: string;
  alternateUrls?: SeoAlternateUrl[];
  googleSiteVerification?: string;
}

export interface SocialLink {
  platform?: string;
  name?: string;
  icon?: string;
  url: string;
}

export interface NavigationItem {
  id: string;
  enabled: boolean;
  title: string;
  icon?: string;
}

export interface ProjectLink {
  text: string;
  url: string;
}

export interface ProjectVideo {
  src: string;
  type: string;
}

export interface ProjectModalContent {
  title?: string;
  description?: string;
  image?: string;
  video?: ProjectVideo;
  links?: ProjectLink[];
}

export interface ShowcaseProject {
  id: string;
  title: string;
  backgroundImage?: string;
  technologies?: string[];
  modalContent?: ProjectModalContent;
}

export interface TimelineEntry {
  category: string;
  order: number;
  startDate: string;
  endDate?: string;
  company: string;
  title: string;
}

export type SkillGroups = Record<string, string[]>;

export interface SiteData {
  config: SiteConfig;
  seo: SeoData;
  social: SocialLink[];
  navigation: NavigationItem[];
  showcase: ShowcaseProject[];
  timeline: TimelineEntry[];
  skills: SkillGroups;
}

/* ------------------------------------------------------------------ *
 * Web app manifest
 * ------------------------------------------------------------------ */

export interface WebManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose: string;
}

export interface WebManifest {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: string;
  background_color: string;
  theme_color: string;
  icons: WebManifestIcon[];
}

/* ------------------------------------------------------------------ *
 * JSON-LD documents
 * ------------------------------------------------------------------ */

export interface JsonLdRef {
  '@id': string;
}

export interface OrganizationSchema {
  '@type': 'Organization';
  name: string;
}

export interface EducationalOrganizationSchema {
  '@type': 'EducationalOrganization';
  name: string;
}

export interface CredentialSchema {
  '@type': 'EducationalOccupationalCredential';
  name: string;
  credentialCategory: string;
  recognizedBy: OrganizationSchema;
}

export interface PersonSchema {
  '@context': string;
  '@type': 'Person';
  '@id': string;
  name: string;
  alternateName: string;
  url: string;
  email?: string;
  jobTitle?: string;
  description?: string;
  worksFor?: OrganizationSchema;
  alumniOf: EducationalOrganizationSchema[];
  hasCredential: CredentialSchema[];
  knowsAbout: string[];
  sameAs: string[];
}

export interface WebsiteSchema {
  '@context': string;
  '@type': 'WebSite';
  '@id': string;
  name: string;
  url: string;
  description: string;
  author: JsonLdRef;
}

export interface ProfilePageSchema {
  '@context': string;
  '@type': 'ProfilePage';
  '@id': string;
  url: string;
  name: string;
  description: string;
  dateModified: string;
  mainEntity: JsonLdRef;
  isPartOf: JsonLdRef;
}

export type ProjectSchemaType = 'CreativeWork' | 'SoftwareApplication';

export interface ProjectListItemSchema {
  '@type': ProjectSchemaType;
  name: string;
  description?: string;
  applicationCategory?: string;
  operatingSystem?: string;
  keywords?: string;
  url: string;
  mainEntityOfPage: string;
  image?: string;
  author: JsonLdRef;
}

export interface ListItemSchema {
  '@type': 'ListItem';
  position: number;
  item: ProjectListItemSchema;
}

export interface ItemListSchema {
  '@context': string;
  '@type': 'ItemList';
  '@id': string;
  name: string;
  description: string;
  itemListElement: ListItemSchema[];
}

export interface BreadcrumbItemSchema {
  '@type': 'ListItem';
  position: number;
  name: string;
  item: string;
}

export interface BreadcrumbListSchema {
  '@type': 'BreadcrumbList';
  itemListElement: BreadcrumbItemSchema[];
}

export interface ProjectCreatorSchema {
  '@type': 'Person';
  '@id': string;
  name: string;
}

export interface ProjectEntitySchema {
  '@type': ProjectSchemaType;
  '@id': string;
  name: string;
  description: string;
  url: string;
  mainEntityOfPage: string;
  image?: string;
  keywords?: string[];
  applicationCategory?: string;
  operatingSystem?: string;
  dateModified: string;
  creator: ProjectCreatorSchema;
}

export interface ProjectPageSchema {
  '@context': string;
  '@graph': [BreadcrumbListSchema, ProjectEntitySchema];
}

/* ------------------------------------------------------------------ *
 * Head tags
 * ------------------------------------------------------------------ */

/**
 * Structural subset of Vite's `HtmlTagDescriptor`, declared here so the head
 * tag builder stays free of any `vite` import and remains unit-testable.
 */
export interface HeadTag {
  tag: string;
  attrs?: Record<string, string>;
  children?: string;
  injectTo: 'head' | 'head-prepend';
}
