// DOM utility functions
export class DOMUtils {
  private static cachedElements: Map<string, HTMLElement> = new Map();

  /**
   * Get DOM element by ID with caching for better performance
   */
  static getElement(id: string): HTMLElement | null {
    /* A cached node is only reused while it is still in the document.
       Without the isConnected check a detached element — one replaced by a
       container re-render — would be handed back forever, and every write
       to it would silently go nowhere. */
    const cached = this.cachedElements.get(id);
    if (cached?.isConnected) {
      return cached;
    }

    const element = document.getElementById(id);
    if (element) {
      this.cachedElements.set(id, element);
    } else {
      this.cachedElements.delete(id);
    }
    return element;
  }

  /**
   * Get DOM elements by selector
   */
  static getElements(selector: string): NodeListOf<Element> {
    return document.querySelectorAll(selector);
  }

  /**
   * Clear element cache (useful for dynamic content)
   */
  static clearCache(): void {
    this.cachedElements.clear();
  }

  /**
   * Remove specific element from cache
   */
  static removeFromCache(id: string): void {
    this.cachedElements.delete(id);
  }
}

/**
 * Make a non-native control activatable by mouse and keyboard (Enter/Space),
 * for the card-shaped elements that carry `role="button"`.
 */
export function onActivate(element: Element, handler: () => void): void {
  element.addEventListener('click', handler);
  element.addEventListener('keydown', e => {
    const key = (e as KeyboardEvent).key;
    if (key === 'Enter' || key === ' ') {
      e.preventDefault();
      handler();
    }
  });
}
