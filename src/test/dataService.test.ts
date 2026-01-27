import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { DataService } from '../services/dataService';

// Mock fetch
(global as typeof globalThis).fetch = vi.fn();

describe('DataService', () => {
  let dataService: DataService;

  beforeEach(() => {
    dataService = DataService.getInstance();
    vi.clearAllMocks();
  });

  it('should return singleton instance', () => {
    const instance1 = DataService.getInstance();
    const instance2 = DataService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should load data successfully', async () => {
    const mockData = {
      config: {
        name: 'Test User',
        title: 'Test Title',
        subtitle: 'Test Subtitle',
        typedMessages: ['Test Message'],
      },
      social: [],
      navigation: [],
      showcase: [],
      timeline: [],
    };

    (fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as unknown as Response);

    const result = await dataService.loadData();
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith('./data.json', { cache: 'no-cache' });
  });

  it('should return fallback data on error', async () => {
    (fetch as MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error('Network error'));

    const result = await dataService.loadData();
    expect(result.config.name).toBe('Marcus Chan');
    expect(result.config.title).toBe('Full Stack Engineer & Cloud Architect');
  });

  it('should return config data', () => {
    const config = dataService.getConfig();
    expect(config).toHaveProperty('name');
    expect(config).toHaveProperty('title');
    expect(config).toHaveProperty('subtitle');
  });
});
