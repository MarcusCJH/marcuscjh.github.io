// TypeScript interfaces for portfolio data structures

export interface SocialLink {
  name?: string;
  platform?: string;
  url: string;
  icon: string;
}

export interface NavigationItem {
  id: string;
  title: string;
  icon: string;
  enabled: boolean;
}

export interface TimelineItem {
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  category: 'work' | 'education' | 'certification';
  order: number;
  modalContent?: ModalContent;
}

export interface ShowcaseProject {
  id: string;
  title: string;
  backgroundImage: string;
  technologies?: string[];
  modalContent?: ModalContent;
}

export interface ModalContentAward {
  title: string;
  date?: string;
  issuer?: string;
  description?: string;
}

export interface ModalContent {
  title?: string;
  subtitle?: string;
  location?: string;
  image?: string;
  video?: {
    src: string;
    type: string;
  };
  iframe?: string;
  description?: string;
  details?: string[];
  awards?: ModalContentAward[];
  links?: {
    text: string;
    url: string;
  }[];
}

export interface Config {
  name: string;
  real_name?: string;
  title: string;
  subtitle: string;
  summary?: string;
  email?: string;
  website?: string;
  typedMessages: string[];
  cvDriveId?: string;
  resumeUrl?: string;

  /**
   * User-facing labels. Every one is optional: it falls back to DEFAULT_TEXT
   * or to the copy already in index.html, so a partial config still renders.
   */
  sections?: Record<string, SectionText>;
  scrollCue?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
  dragHint?: string;
  emptyMessage?: string;
  filters?: TimelineFilter[];
  resumeTitle?: string;
  loadingMessages?: string[];
  loadingReady?: string;
}

export interface TimelineFilter {
  /** Matches TimelineItem.category, or 'all'. */
  id: string;
  /** Text on the filter button. */
  label: string;
  /** Text on a card's category tag; defaults to `id`. */
  tag?: string;
}

export interface SectionText {
  title?: string;
  note?: string;
}

/** Free-form groups of tools, keyed by domain (`cloud`, `platform`, ...). */
export type SkillGroups = Record<string, string[]>;

export interface SEOMeta {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  robots?: string;
  themeColor?: string;
  backgroundColor?: string;
  googlebot?: string;
  bingbot?: string;
}

export interface OpenGraph {
  type?: string;
  url?: string;
  title?: string;
  description?: string;
  image?: string;
  site_name?: string;
  locale?: string;
  imageWidth?: string;
  imageHeight?: string;
  imageType?: string;
}

export interface TwitterCard {
  card?: string;
  url?: string;
  title?: string;
  description?: string;
  image?: string;
  creator?: string;
  site?: string;
}

export interface SEODefaults {
  url?: string;
  title?: string;
  description?: string;
  image?: string;
  author?: string;
  robots?: string;
  openGraph?: Partial<OpenGraph>;
  twitter?: Partial<TwitterCard>;
}

export interface AlternateUrl {
  href: string;
  hreflang: string;
}

export interface SEOConfig {
  defaults?: SEODefaults;
  meta?: SEOMeta;
  openGraph?: OpenGraph;
  twitter?: TwitterCard;
  canonical?: string;
  googleSiteVerification?: string;
  alternateUrls?: AlternateUrl[];
}

export interface PortfolioData {
  config: Config;
  seo?: SEOConfig;
  social: SocialLink[];
  navigation: NavigationItem[];
  timeline: TimelineItem[];
  showcase: ShowcaseProject[];
  skills?: SkillGroups;
}

export interface TimelineState {
  currentFilter: string;
  currentSearch: string;
  filteredItems: TimelineItem[];
}
