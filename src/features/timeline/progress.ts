import { BREAKPOINTS } from '../../lib/constants';
import { DOMUtils } from '../../lib/dom';

/**
 * Publishes progress as a single custom property. The stylesheet decides
 * whether that drives width (horizontal rail) or height (vertical axis), so
 * orientation lives in CSS rather than in inline styles written per frame.
 */
export function updateTimelineProgress(): void {
  const timelineWrapper = DOMUtils.getElement('timeline-wrapper');
  const progressBar = DOMUtils.getElement('timeline-progress');

  if (!timelineWrapper || !progressBar) {
    return;
  }

  const isMobile = window.innerWidth <= BREAKPOINTS.MOBILE;
  let progress: number;

  if (isMobile) {
    const rect = timelineWrapper.getBoundingClientRect();
    const scrolledPast = window.innerHeight / 2 - rect.top;
    progress = rect.height > 0 ? (scrolledPast / rect.height) * 100 : 0;
  } else {
    const scrollWidth = timelineWrapper.scrollWidth - timelineWrapper.clientWidth;
    progress = scrollWidth > 0 ? (timelineWrapper.scrollLeft / scrollWidth) * 100 : 0;
  }

  progress = Math.max(0, Math.min(100, progress));
  progressBar.style.setProperty('--timeline-progress', `${progress}%`);
}
