import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DOMUtils, onActivate } from './dom';

describe('DOMUtils', () => {
  beforeEach(() => {
    DOMUtils.clearCache();
    document.body.innerHTML = '';
  });

  describe('getElement', () => {
    it('should return the element when it exists', () => {
      document.body.innerHTML = '<div id="test-el"></div>';
      const el = DOMUtils.getElement('test-el');
      expect(el).not.toBeNull();
      expect(el?.id).toBe('test-el');
    });

    it('should return null when the element does not exist', () => {
      expect(DOMUtils.getElement('nonexistent')).toBeNull();
    });

    it('should not cache null — finds element added after first miss', () => {
      // First call: element absent
      expect(DOMUtils.getElement('late-el')).toBeNull();

      // Element added to DOM after the first lookup
      document.body.innerHTML = '<div id="late-el"></div>';

      // Second call must find it now
      expect(DOMUtils.getElement('late-el')).not.toBeNull();
    });

    it('should return the same reference on subsequent calls (cache hit)', () => {
      document.body.innerHTML = '<div id="cached-el"></div>';
      const first = DOMUtils.getElement('cached-el');
      const second = DOMUtils.getElement('cached-el');
      expect(first).toBe(second);
    });
  });

  describe('getElements', () => {
    it('should return matching elements', () => {
      document.body.innerHTML = '<div class="item"></div><div class="item"></div>';
      expect(DOMUtils.getElements('.item').length).toBe(2);
    });

    it('should return empty NodeList when nothing matches', () => {
      expect(DOMUtils.getElements('.no-match').length).toBe(0);
    });
  });
});

describe('DOMUtils cache management', () => {
  beforeEach(() => {
    DOMUtils.clearCache();
    document.body.innerHTML = '';
  });

  it('re-looks-up an element that has been replaced in the document', () => {
    document.body.innerHTML = '<div id="cached"></div>';
    const first = DOMUtils.getElement('cached');
    document.body.innerHTML = '<div id="cached"></div>';
    const second = DOMUtils.getElement('cached');
    expect(second).not.toBe(first);
    expect(second).toBe(document.getElementById('cached'));
    expect(second?.isConnected).toBe(true);
  });

  it('returns null once the element is gone, rather than a detached node', () => {
    document.body.innerHTML = '<div id="cached"></div>';
    DOMUtils.getElement('cached');
    document.body.innerHTML = '';
    expect(DOMUtils.getElement('cached')).toBeNull();
  });

  it('clearCache forces a fresh lookup', () => {
    document.body.innerHTML = '<div id="cached"></div>';
    const first = DOMUtils.getElement('cached');
    document.body.innerHTML = '<div id="cached"></div>';
    DOMUtils.clearCache();
    const second = DOMUtils.getElement('cached');
    expect(second).not.toBe(first);
    expect(second).toBe(document.getElementById('cached'));
  });

  it('removeFromCache evicts only the named id', () => {
    document.body.innerHTML = '<div id="a"></div><div id="b"></div>';
    DOMUtils.getElement('a');
    DOMUtils.getElement('b');

    /* Both elements are still connected, so eviction is observed through
       whether the next call re-queries the document rather than through
       identity. */
    const lookup = vi.spyOn(document, 'getElementById');
    DOMUtils.removeFromCache('a');
    DOMUtils.getElement('a');
    DOMUtils.getElement('b');

    expect(lookup).toHaveBeenCalledTimes(1);
    expect(lookup).toHaveBeenCalledWith('a');
    lookup.mockRestore();
  });

  it('getElements returns every match', () => {
    document.body.innerHTML = '<i class="x"></i><i class="x"></i>';
    expect(DOMUtils.getElements('.x')).toHaveLength(2);
  });
});

describe('onActivate', () => {
  function setup() {
    const el = document.createElement('div');
    const handler = vi.fn();
    onActivate(el, handler);
    return { el, handler };
  }

  it('fires on click', () => {
    const { el, handler } = setup();
    el.dispatchEvent(new MouseEvent('click'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it.each(['Enter', ' '])('fires and prevents default for key %j', key => {
    const { el, handler } = setup();
    const event = new KeyboardEvent('keydown', { key, cancelable: true });
    el.dispatchEvent(event);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('ignores other keys without preventing default', () => {
    const { el, handler } = setup();
    const event = new KeyboardEvent('keydown', { key: 'a', cancelable: true });
    el.dispatchEvent(event);
    expect(handler).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });
});
