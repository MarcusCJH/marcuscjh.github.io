import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TypedText } from './TypedText';
import { DOMUtils } from '@/lib/dom';

describe('TypedText', () => {
  let instance: TypedText | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    // DOMUtils caches by id, so a previous test's detached span would be reused.
    DOMUtils.clearCache();
    document.body.innerHTML = '<span id="typed-text"></span>';
  });

  afterEach(() => {
    instance?.destroy();
    instance = null;
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('types out the first message', () => {
    instance = new TypedText(['hi']);
    vi.advanceTimersByTime(2000);
    expect(document.getElementById('typed-text')?.textContent).not.toBe('');
  });

  /* Regression: typeText() used to index messages[messageIndex] directly.
     With an empty list, messageIndex % 0 is NaN, the lookup is undefined,
     and .substring() threw a TypeError inside the setTimeout callback —
     an async throw, so it surfaced as an unhandled error, not a test failure. */
  it('does not throw when constructed with no messages', () => {
    expect(() => {
      instance = new TypedText([]);
      vi.advanceTimersByTime(5000);
    }).not.toThrow();
  });

  it('does not throw when updateMessages is given an empty list', () => {
    instance = new TypedText(['hello']);
    vi.advanceTimersByTime(500);
    expect(() => {
      instance?.updateMessages([]);
      vi.advanceTimersByTime(5000);
    }).not.toThrow();
  });

  const text = (): string => document.getElementById('typed-text')?.textContent ?? '';

  it('types one character per tick, pauses, deletes, then moves to the next message', () => {
    instance = new TypedText(['ab', 'c']);
    expect(text()).toBe('a');
    vi.advanceTimersByTime(100);
    expect(text()).toBe('ab');
    // Full message: holds for the pause before deleting starts.
    vi.advanceTimersByTime(1999);
    expect(text()).toBe('ab');
    vi.advanceTimersByTime(1);
    expect(text()).toBe('a');
    vi.advanceTimersByTime(50);
    expect(text()).toBe('');
    // Short beat, then the second message begins.
    vi.advanceTimersByTime(499);
    expect(text()).toBe('');
    vi.advanceTimersByTime(1);
    expect(text()).toBe('c');
  });

  it('wraps back to the first message after the last', () => {
    instance = new TypedText(['a', 'b']);
    expect(text()).toBe('a');
    // type(0) -> pause 2000 -> delete -> 500 -> 'b'
    vi.advanceTimersByTime(2000 + 50 + 500);
    expect(text()).toBe('b');
    vi.advanceTimersByTime(2000 + 50 + 500);
    expect(text()).toBe('a');
  });

  it('does nothing when the target element is missing', () => {
    document.body.innerHTML = '';
    expect(() => {
      instance = new TypedText(['hi']);
      vi.advanceTimersByTime(5000);
    }).not.toThrow();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('updateMessages restarts from the first character of the new first message', () => {
    instance = new TypedText(['first message']);
    vi.advanceTimersByTime(450);
    expect(text()).toBe('first');
    instance.updateMessages(['new']);
    expect(text()).toBe('n');
    vi.advanceTimersByTime(200);
    expect(text()).toBe('new');
  });

  it('updateMessages cancels the previous loop so only one timer runs', () => {
    instance = new TypedText(['abc']);
    instance.updateMessages(['xyz']);
    expect(vi.getTimerCount()).toBe(1);
  });

  it('updateMessages works after destroy', () => {
    instance = new TypedText(['abc']);
    instance.destroy();
    instance.updateMessages(['q']);
    expect(text()).toBe('q');
  });

  it('destroy stops the animation and is safe to repeat', () => {
    instance = new TypedText(['abcdef']);
    vi.advanceTimersByTime(100);
    const frozen = text();
    instance.destroy();
    instance.destroy();
    vi.advanceTimersByTime(5000);
    expect(text()).toBe(frozen);
    expect(vi.getTimerCount()).toBe(0);
  });
});
