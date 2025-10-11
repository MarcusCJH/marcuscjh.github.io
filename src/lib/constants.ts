// Application constants

export const APP_CONFIG = {
  MIN_LOADING_TIME: 2000,
  LOADING_UPDATE_INTERVAL: 150,
  ANIMATION_DELAY: 200,
  DEBOUNCE_DELAY: 10,
  THROTTLE_DELAY: 16,
  RESIZE_DEBOUNCE_DELAY: 250,
  MATRIX_ANIMATION_INTERVAL: 50,
  PARTICLE_CREATION_INTERVAL: 300,
  PARTICLE_LIFETIME: 6000,
  TYPED_TEXT_SPEEDS: {
    DELETE: 50,
    TYPE: 100,
    PAUSE: 2000,
    NEXT_MESSAGE: 500,
  },
} as const;

export const CSS_CLASSES = {
  HIDDEN: 'hidden',
  ACTIVE: 'active',
  VISIBLE: 'visible',
  SCROLLED: 'scrolled',
  SCROLLING: 'scrolling',
} as const;

export const SELECTORS = {
  MAIN_CONTAINER: '.main-container',
  LOADING_SCREEN: '#loading-screen',
  LOADING_PROGRESS: '#loading-progress',
  LOADING_TEXT: '.loading-text',
  NAV_CONTAINER: '.nav-container',
  NAV_MENU: '#nav-menu',
  NAV_TOGGLE: '#nav-toggle',
  TIMELINE_WRAPPER: '#timeline-wrapper',
  TIMELINE_PROGRESS: '#timeline-progress',
  MODAL_OVERLAY: '#modal-overlay',
  MODAL_CLOSE: '#modal-close',
  MATRIX_CANVAS: '#matrix-canvas',
  PARTICLES_CONTAINER: '#particles-container',
} as const;

export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1200,
} as const;
