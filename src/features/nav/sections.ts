import type { NavigationItem } from '../../types';

/** A section switched off in data.json is hidden rather than rendered empty. */
export function hideDisabledSections(navigation: NavigationItem[]): void {
  navigation.forEach(nav => {
    if (nav.id === 'home') {
      return;
    }
    const section = document.getElementById(`${nav.id}-section`);
    if (section) {
      section.hidden = !nav.enabled;
    }
  });
}
