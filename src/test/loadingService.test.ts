import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LoadingService } from '../services/loadingService';

// Mock DOM elements
const mockElement = {
  style: {},
  textContent: '',
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    toggle: vi.fn(),
  },
};

// Mock DOMUtils
vi.mock('../lib/dom', () => ({
  DOMUtils: {
    getElement: vi.fn(() => mockElement),
    getElements: vi.fn(() => [mockElement]),
  },
}));

// Mock document.querySelector
Object.defineProperty(document, 'querySelector', {
  value: vi.fn(() => mockElement),
  writable: true,
});

describe('LoadingService', () => {
  let loadingService: LoadingService;

  beforeEach(() => {
    loadingService = LoadingService.getInstance();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return singleton instance', () => {
    const instance1 = LoadingService.getInstance();
    const instance2 = LoadingService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should start loading with initial state', () => {
    loadingService.startLoading();
    const state = loadingService.getState();
    expect(state.progress).toBe(0);
    expect(state.currentMessageIndex).toBe(0);
  });

  it('should update progress over time', () => {
    loadingService.startLoading();

    // Fast-forward time to trigger interval
    vi.advanceTimersByTime(200);

    const state = loadingService.getState();
    expect(state.progress).toBeGreaterThan(0);
  });

  it('should complete loading', () => {
    loadingService.startLoading();

    // Fast-forward to ensure progress has started
    vi.advanceTimersByTime(100);

    loadingService.completeLoading();

    const state = loadingService.getState();
    expect(state.progress).toBe(100);
  });
});
