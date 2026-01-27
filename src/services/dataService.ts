// Data service for handling portfolio data
import type { PortfolioData } from '@/types';

export class DataService {
  private static instance: DataService;
  private data: PortfolioData | null = null;
  private fallbackData: PortfolioData;

  private constructor() {
    this.fallbackData = {
      config: {
        name: 'Marcus Chan',
        title: 'Full Stack Engineer & Cloud Architect',
        subtitle: 'Building the future with modern technologies',
        typedMessages: ['Full Stack Engineer', 'Cloud Architect', 'Problem Solver'],
      },
      social: [
        { name: 'GitHub', url: 'https://github.com/MarcusCJH', icon: 'fab fa-github' },
        {
          name: 'LinkedIn',
          url: 'https://www.linkedin.com/in/marcuschanjh',
          icon: 'fab fa-linkedin',
        },
        { name: 'Telegram', url: 'https://t.me/marcuscjh', icon: 'fab fa-telegram' },
      ],
      navigation: [],
      showcase: [],
      timeline: [],
    };
  }

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  /**
   * Load portfolio data from JSON file
   */
  public async loadData(): Promise<PortfolioData> {
    try {
      const response = await fetch('./data.json', { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.data = (await response.json()) as PortfolioData;
      return this.data;
    } catch {
      // Failed to load data - using fallback data
      this.data = this.fallbackData;
      return this.data;
    }
  }

  /**
   * Get loaded data
   */
  public getData(): PortfolioData | null {
    return this.data;
  }

  /**
   * Get configuration data
   */
  public getConfig() {
    return this.data?.config || this.fallbackData.config;
  }

  /**
   * Get social links
   */
  public getSocialLinks() {
    return this.data?.social || this.fallbackData.social;
  }

  /**
   * Get navigation items
   */
  public getNavigation() {
    return this.data?.navigation || this.fallbackData.navigation;
  }

  /**
   * Get timeline items
   */
  public getTimeline() {
    return this.data?.timeline || this.fallbackData.timeline;
  }

  /**
   * Get showcase projects
   */
  public getShowcase() {
    return this.data?.showcase || this.fallbackData.showcase;
  }

  /**
   * Get SEO configuration
   */
  public getSEO() {
    return this.data?.seo;
  }
}
