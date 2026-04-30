import { describe, it, expect, beforeEach } from 'vitest';
import { DOMUtils } from '../lib/dom';

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
