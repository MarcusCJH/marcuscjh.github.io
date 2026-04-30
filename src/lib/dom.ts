// DOM utility functions
export class DOMUtils {
  private static cachedElements: Map<string, HTMLElement> = new Map();

  /**
   * Get DOM element by ID with caching for better performance
   */
  static getElement(id: string): HTMLElement | null {
    if (!this.cachedElements.has(id)) {
      const el = document.getElementById(id);
      if (el) {
        this.cachedElements.set(id, el);
      }
      return el;
    }
    return this.cachedElements.get(id) ?? null;
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
