// Application constants

export const APP_CONFIG = {
  /**
   * Floor on how long the loading screen stays up. Kept short on purpose: an
   * artificial wait in front of a static page is pure added latency and it
   * pushes Largest Contentful Paint out by however long it runs.
   */
  MIN_LOADING_TIME: 400,
  LOADING_UPDATE_INTERVAL: 60,
  ANIMATION_DELAY: 90,
  DEBOUNCE_DELAY: 10,
  THROTTLE_DELAY: 16,
  TYPED_TEXT_SPEEDS: {
    DELETE: 50,
    TYPE: 100,
    PAUSE: 2000,
    NEXT_MESSAGE: 500,
  },
  /** Feel of the timeline rail's pointer drag. Tuning, not content. */
  DRAG: {
    /** Per-frame velocity decay while coasting. */
    FRICTION: 0.88,
    /** Below this the coast stops and scroll snap is handed back. */
    MIN_VELOCITY: 0.3,
    /** Caps a fast flick so it cannot fly the length of the rail. */
    MAX_VELOCITY: 40,
    /** Weight of the newest sample in the velocity average; raw deltas are too noisy. */
    SMOOTHING: 0.4,
    /** Converts px-per-ms into px-per-frame at ~60fps. */
    VELOCITY_SCALE: 16,
    /** Grace period before scroll snap resumes, so it does not snap on every wheel tick. */
    SNAP_DELAY: 150,
  },
} as const;

/**
 * Fallback copy. Keys mirror the label fields on `config` in data.json, so
 * there is no mapping layer between the two — a field is either supplied
 * there or taken from here.
 */
export const DEFAULT_TEXT = {
  emptyMessage: 'No entries match that filter.',
  resumeTitle: 'Resume / CV',
  loadingMessages: [
    'Initializing',
    'Fetching data',
    'Building sections',
    'Laying out',
    'Almost there',
  ],
  loadingReady: 'Ready',
  filters: [
    { id: 'all', label: 'All' },
    { id: 'work', label: 'Work', tag: 'work' },
    { id: 'education', label: 'Education', tag: 'education' },
    { id: 'certification', label: 'Certs', tag: 'certification' },
  ],
} as const;

export const CSS_CLASSES = {
  ACTIVE: 'active',
  VISIBLE: 'visible',
  SCROLLED: 'scrolled',
} as const;

export const SELECTORS = {
  MAIN_CONTAINER: '.main-container',
  LOADING_TEXT: '.loading-text',
  NAV_CONTAINER: '.nav-container',
  SOCIAL_LINKS: '.social-links',
} as const;

export const BREAKPOINTS = {
  MOBILE: 768,
} as const;
