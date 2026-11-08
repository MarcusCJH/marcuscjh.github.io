// Test setup file for Vitest
import { vi } from 'vitest';

/**
 * jsdom implements neither `matchMedia` nor the observer constructors, so the
 * suite installs inert stand-ins. The mocks are built with an explicit
 * implementation passed to `vi.fn(...)` rather than an untyped
 * `vi.fn().mockImplementation(...)`, so what gets installed carries a real
 * signature instead of `any`.
 */
const matchMediaMock = vi.fn((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(), // deprecated
  removeListener: vi.fn(), // deprecated
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: matchMediaMock,
});

/* These must be classes, not `vi.fn().mockImplementation(() => ({...}))`.
   An arrow function has no [[Construct]] slot, so `new IntersectionObserver()`
   threw "is not a constructor". Nothing caught it because no test constructed
   one until the feature tests arrived. The casts cover lib.dom members a mock
   has no use for (e.g. scrollMargin). */
class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: readonly number[] = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn((): IntersectionObserverEntry[] => []);
  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
}

global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock ResizeObserver (a class, for the same reason as above)
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(_callback: ResizeObserverCallback) {}
}

global.ResizeObserver = MockResizeObserver;
