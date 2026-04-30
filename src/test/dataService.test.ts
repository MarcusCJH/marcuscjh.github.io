import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { DataService } from '../services/dataService';

(global as typeof globalThis).fetch = vi.fn();

const mockData = {
  config: {
    name: 'Test User',
    title: 'Test Title',
    subtitle: 'Test Subtitle',
    typedMessages: ['Test Message'],
    cvDriveId: 'test-drive-id',
  },
  social: [{ name: 'GitHub', url: 'https://github.com/test', icon: 'fab fa-github' }],
  navigation: [{ id: 'home', title: 'Home', icon: 'fas fa-home', enabled: true }],
  timeline: [
    { company: 'Acme', title: 'Engineer', startDate: '2020', category: 'work' as const, order: 1 },
  ],
  showcase: [{ id: 'p1', title: 'Project One', backgroundImage: './img.png' }],
};

describe('DataService', () => {
  let dataService: DataService;

  beforeEach(() => {
    dataService = DataService.getInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Reset singleton data state to prevent test pollution across specs
    (dataService as unknown as { data: null }).data = null;
  });

  it('should return singleton instance', () => {
    const instance1 = DataService.getInstance();
    const instance2 = DataService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should load data successfully', async () => {
    (fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as unknown as Response);

    const result = await dataService.loadData();
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith('./data.json', { cache: 'no-cache' });
  });

  it('should return fallback data on fetch error', async () => {
    (fetch as MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error('Network error'));

    const result = await dataService.loadData();
    expect(result.config.name).toBe('marcus.cjh');
    expect(result.config.title).toBe('Lead Full Stack Engineer & Cloud Architect');
  });

  it('should return fallback data on non-ok response', async () => {
    (fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as unknown as Response);

    const result = await dataService.loadData();
    expect(result.config.name).toBe('marcus.cjh');
  });

  describe('getters with loaded data', () => {
    beforeEach(async () => {
      (fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as unknown as Response);
      await dataService.loadData();
    });

    it('should return config data', () => {
      const config = dataService.getConfig();
      expect(config.name).toBe('Test User');
      expect(config.title).toBe('Test Title');
      expect(config.subtitle).toBe('Test Subtitle');
      expect(config.cvDriveId).toBe('test-drive-id');
    });

    it('should return social links', () => {
      const links = dataService.getSocialLinks();
      expect(links).toHaveLength(1);
      expect(links[0].name).toBe('GitHub');
      expect(links[0].url).toBe('https://github.com/test');
    });

    it('should return navigation items', () => {
      const nav = dataService.getNavigation();
      expect(nav).toHaveLength(1);
      expect(nav[0].id).toBe('home');
      expect(nav[0].enabled).toBe(true);
    });

    it('should return timeline items', () => {
      const timeline = dataService.getTimeline();
      expect(timeline).toHaveLength(1);
      expect(timeline[0].company).toBe('Acme');
      expect(timeline[0].category).toBe('work');
    });

    it('should return showcase projects', () => {
      const showcase = dataService.getShowcase();
      expect(showcase).toHaveLength(1);
      expect(showcase[0].id).toBe('p1');
      expect(showcase[0].title).toBe('Project One');
    });
  });

  describe('getters with fallback data (no load)', () => {
    it('should return fallback config', () => {
      const config = dataService.getConfig();
      expect(config).toHaveProperty('name');
      expect(config).toHaveProperty('title');
      expect(config).toHaveProperty('typedMessages');
    });

    it('should return fallback social links', () => {
      const links = dataService.getSocialLinks();
      expect(links.length).toBeGreaterThan(0);
      expect(links[0]).toHaveProperty('url');
      expect(links[0]).toHaveProperty('icon');
    });

    it('should return fallback navigation as empty array', () => {
      expect(dataService.getNavigation()).toEqual([]);
    });

    it('should return fallback timeline as empty array', () => {
      expect(dataService.getTimeline()).toEqual([]);
    });

    it('should return fallback showcase as empty array', () => {
      expect(dataService.getShowcase()).toEqual([]);
    });
  });
});
