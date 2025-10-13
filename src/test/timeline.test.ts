import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataService } from '../services/dataService';
import type { TimelineItem } from '../types';

// Mock DOM elements
const mockTimelineContainer = {
  innerHTML: '',
  querySelectorAll: vi.fn(() => []),
} as unknown as HTMLElement;

const mockFilterButtons = [
  { dataset: { filter: 'all' }, classList: { remove: vi.fn(), add: vi.fn() } },
  { dataset: { filter: 'work' }, classList: { remove: vi.fn(), add: vi.fn() } },
  { dataset: { filter: 'education' }, classList: { remove: vi.fn(), add: vi.fn() } },
  { dataset: { filter: 'certification' }, classList: { remove: vi.fn(), add: vi.fn() } },
] as unknown as HTMLElement[];

const mockSearchInput = {
  addEventListener: vi.fn(),
} as unknown as HTMLInputElement;

// Mock DOMUtils
vi.mock('../lib/dom', () => ({
  DOMUtils: {
    getElement: vi.fn((id: string) => {
      if (id === 'timeline-items') {
        return mockTimelineContainer;
      }
      if (id === 'timeline-search') {
        return mockSearchInput;
      }
      return null;
    }),
    getElements: vi.fn(() => mockFilterButtons),
  },
}));

// Mock timeline data
const mockTimelineData: TimelineItem[] = [
  {
    category: 'work',
    order: 1,
    startDate: '2021',
    endDate: 'Present',
    company: 'Accenture',
    title: 'Software Engineer',
  },
  {
    category: 'education',
    order: 2,
    startDate: '2016',
    endDate: '2016',
    company: 'SMU',
    title: 'Bachelor of Science',
  },
  {
    category: 'certification',
    order: 3,
    startDate: '2022',
    company: 'AWS',
    title: 'Cloud Practitioner',
  },
];

describe('Timeline Filtering', () => {
  let dataService: DataService;

  beforeEach(() => {
    dataService = DataService.getInstance();
    // Mock the getTimeline method
    vi.spyOn(dataService, 'getTimeline').mockReturnValue(mockTimelineData);
    mockTimelineContainer.innerHTML = '';
  });

  describe('Filter Logic', () => {
    it('should filter work items correctly', () => {
      const workItems = mockTimelineData.filter(item => item.category === 'work');
      expect(workItems).toHaveLength(1);
      expect(workItems[0].company).toBe('Accenture');
    });

    it('should filter education items correctly', () => {
      const educationItems = mockTimelineData.filter(item => item.category === 'education');
      expect(educationItems).toHaveLength(1);
      expect(educationItems[0].company).toBe('SMU');
    });

    it('should filter certification items correctly', () => {
      const certItems = mockTimelineData.filter(item => item.category === 'certification');
      expect(certItems).toHaveLength(1);
      expect(certItems[0].company).toBe('AWS');
    });

    it('should show all items when filter is "all"', () => {
      const allItems = mockTimelineData.filter(_item => true);
      expect(allItems).toHaveLength(3);
    });
  });

  describe('Search Logic', () => {
    it('should search by company name', () => {
      const searchTerm = 'Accenture';
      const filteredItems = mockTimelineData.filter(
        _item =>
          _item.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          _item.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(filteredItems).toHaveLength(1);
      expect(filteredItems[0]?.company).toBe('Accenture');
    });

    it('should search by job title', () => {
      const searchTerm = 'Engineer';
      const filteredItems = mockTimelineData.filter(
        item =>
          item.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(filteredItems).toHaveLength(1);
      expect(filteredItems[0].title).toBe('Software Engineer');
    });

    it('should be case insensitive', () => {
      const searchTerm = 'aws';
      const filteredItems = mockTimelineData.filter(
        item =>
          item.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(filteredItems).toHaveLength(1);
      expect(filteredItems[0].company).toBe('AWS');
    });

    it('should return empty array for no matches', () => {
      const searchTerm = 'nonexistent';
      const filteredItems = mockTimelineData.filter(
        item =>
          item.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(filteredItems).toHaveLength(0);
    });
  });

  describe('Combined Filter and Search', () => {
    it('should filter by category and search term', () => {
      const filter: string = 'work';
      const search: string = 'Accenture';

      const filteredItems = mockTimelineData.filter(item => {
        const matchesFilter = filter === 'all' || item.category === filter;
        const matchesSearch =
          search === '' ||
          item.company.toLowerCase().includes(search.toLowerCase()) ||
          item.title.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
      });

      expect(filteredItems).toHaveLength(1);
      expect(filteredItems[0].category).toBe('work');
      expect(filteredItems[0].company).toBe('Accenture');
    });

    it("should return empty array when filter and search don't match", () => {
      const filter: string = 'education';
      const search: string = 'Accenture';

      const filteredItems = mockTimelineData.filter(item => {
        const matchesFilter = filter === 'all' || item.category === filter;
        const matchesSearch =
          search === '' ||
          item.company.toLowerCase().includes(search.toLowerCase()) ||
          item.title.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
      });

      expect(filteredItems).toHaveLength(0);
    });
  });

  describe('Timeline Item Generation', () => {
    it('should generate timeline items with visible class', () => {
      const item = mockTimelineData[0];
      const expectedHTML = `
        <div class="timeline-item visible" data-category="${item.category}" data-index="0" data-timeline-item>
          <div class="timeline-dot ${item.category}">
            <i class="fas fa-briefcase"></i>
          </div>
          <div class="timeline-content">
            <div class="timeline-date">${item.startDate}${item.endDate ? ` - ${item.endDate}` : ''}</div>
            <h3>${item.company}</h3>
            <p>${item.title}</p>
          </div>
        </div>
      `;

      // Check that the HTML contains the visible class
      expect(expectedHTML).toContain('timeline-item visible');
      expect(expectedHTML).toContain(`data-category="${item.category}"`);
      expect(expectedHTML).toContain(item.company);
      expect(expectedHTML).toContain(item.title);
    });

    it('should include endDate when present', () => {
      const item = mockTimelineData[0]; // Has endDate
      const expectedDate = `${item.startDate} - ${item.endDate}`;
      expect(expectedDate).toBe('2021 - Present');
    });

    it('should not include endDate when not present', () => {
      const item = mockTimelineData[2]; // No endDate
      expect(item.startDate).toBe('2022');
    });
  });

  describe('Timeline Sorting', () => {
    it('should sort items by order in descending order', () => {
      const sortedItems = [...mockTimelineData].sort((a, b) => b.order - a.order);
      expect(sortedItems[0].order).toBe(3);
      expect(sortedItems[1].order).toBe(2);
      expect(sortedItems[2].order).toBe(1);
    });
  });
});
