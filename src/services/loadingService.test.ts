import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LoadingService } from './loadingService';

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

describe('LoadingService message ladder', () => {
  interface LoadingInternals {
    state: { progress: number; messages: string[]; currentMessageIndex: number };
    updateLoadingMessage: (element: HTMLElement | null) => void;
  }

  /* LoadingService is a singleton with a private constructor, and
     setMessages() ignores an empty array, so the state is seeded directly
     to get a clean starting point (and to reach the empty-list case). */
  function advance(messages: string[], progress: number): string {
    const element = document.createElement('div');
    const internals = LoadingService.getInstance() as unknown as LoadingInternals;
    internals.state.messages = [...messages];
    internals.state.currentMessageIndex = 0;
    internals.state.progress = progress;
    internals.updateLoadingMessage(element);
    return element.textContent ?? '';
  }

  it('matches the historical thresholds for five messages', () => {
    const five = ['a', 'b', 'c', 'd', 'e'];
    expect(advance(five, 20)).toBe('');
    expect(advance(five, 21)).toBe('b');
    expect(advance(five, 41)).toBe('c');
    expect(advance(five, 61)).toBe('d');
    expect(advance(five, 81)).toBe('e');
    expect(advance(five, 100)).toBe('e');
  });

  it('always lands on a real message for a short list, never blank', () => {
    for (const count of [2, 3, 4, 5, 6]) {
      const messages = Array.from({ length: count }, (_, i) => `m${i}`);
      const last = messages[count - 1];

      // Once fully loaded the final message must be showing. The old
      // hardcoded ladder indexed messages[4] regardless of length, which
      // blanked the text for any list shorter than five.
      expect(advance(messages, 100)).toBe(last);

      for (let progress = 0; progress <= 100; progress += 5) {
        const text = advance(messages, progress);
        expect(messages.includes(text) || text === '').toBe(true);
      }
    }
  });

  it('does not throw on an empty message list', () => {
    expect(() => advance([], 50)).not.toThrow();
  });
});
