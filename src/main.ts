import './styles/style.css';

import { DataService } from './services/dataService';
import { LoadingService } from './services/loadingService';
import { SEOService } from './services/seoService';
import { TypedText } from './components/TypedText';
import { DragRail } from './components/DragRail';

import { DOMUtils } from './lib/dom';
import { icon } from './lib/icons';
import { debounce } from './lib/utils';
import { APP_CONFIG, BREAKPOINTS, CSS_CLASSES, DEFAULT_TEXT, SELECTORS } from './lib/constants';

import type {
  TimelineItem,
  ShowcaseProject,
  ModalContent,
  TimelineState,
  NavigationItem,
  TimelineFilter,
} from './types';

/** Escape a value that is about to be interpolated into markup. */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

class Portfolio {
  private dataService: DataService;
  private loadingService: LoadingService;
  private lastFocusedElement: HTMLElement | null = null;
  private timelineState: TimelineState = {
    currentFilter: 'all',
    currentSearch: '',
    filteredItems: [],
  };

  constructor() {
    this.dataService = DataService.getInstance();
    this.loadingService = LoadingService.getInstance();
    this.hideMainContent();
    this.init();
  }

  private async init(): Promise<void> {
    this.loadingService.startLoading();

    const startTime = Date.now();
    const data = await this.dataService.loadData();

    // Static meta tags are injected at build time (vite.config.ts);
    // only the data-driven structured data schemas are applied at runtime.
    SEOService.applyStructuredData(data);

    const { loadingMessages, loadingReady } = this.dataService.getConfig();
    this.loadingService.setMessages(loadingMessages, loadingReady);

    this.initializeComponents();
    this.setupEventListeners();
    this.startAnimations();

    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, APP_CONFIG.MIN_LOADING_TIME - elapsedTime);
    if (remainingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, remainingTime));
    }

    this.loadingService.completeLoading();
  }

  private hideMainContent(): void {
    const mainContainer = document.querySelector<HTMLElement>(SELECTORS.MAIN_CONTAINER);
    if (mainContainer) {
      mainContainer.style.opacity = '0';
      mainContainer.style.visibility = 'hidden';
      mainContainer.style.transition = 'opacity 0.3s ease, visibility 0.3s ease';
    }
  }

  private initializeComponents(): void {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const config = this.dataService.getConfig();

    if (config?.typedMessages?.length) {
      if (prefersReducedMotion) {
        const typedElement = DOMUtils.getElement('typed-text');
        if (typedElement) {
          typedElement.textContent = config.typedMessages[0];
        }
      } else {
        new TypedText(config.typedMessages);
      }
    }

    this.applyText();
    this.initStaticIcons();
    this.initHero();
    this.initNavigation();
    this.initSocials();
    this.initTimeline();
    this.initShowcase();
    this.initFooter();
    this.initScrollAnimations();
  }

  /**
   * Fill the inline-SVG slots in the static markup. Keeping the icons out of
   * index.html means one source of truth for the icon set.
   */
  /**
   * Writes the labels from `config` over whatever index.html already
   * contains. The markup keeps meaningful defaults so the page reads
   * correctly before the fetch resolves and for crawlers that do not run
   * scripts; this only overrides what is actually supplied.
   */
  private applyText(): void {
    const config = this.dataService.getConfig();

    const setText = (selector: string, value?: string) => {
      const el = document.querySelector<HTMLElement>(selector);
      if (el && value) {
        el.textContent = value;
      }
    };
    const setAttr = (selector: string, attr: string, value?: string) => {
      const el = document.querySelector(selector);
      if (el && value) {
        el.setAttribute(attr, value);
      }
    };

    Object.entries(config.sections ?? {}).forEach(([id, text]) => {
      setText(`#${id}-section .section-title`, text.title);
      setText(`#${id}-section .section-note`, text.note);
    });

    setText('.scroll-arrow', config.scrollCue);
    setText('.timeline-hint', config.dragHint);
    setAttr('#timeline-search', 'placeholder', config.searchPlaceholder);
    setAttr('#timeline-search', 'aria-label', config.searchLabel);
  }

  /** Filter definitions, from config when present. */
  private get timelineFilters(): TimelineFilter[] {
    return this.dataService.getConfig().filters ?? [...DEFAULT_TEXT.filters];
  }

  private initStaticIcons(): void {
    const slots: [string, string][] = [['.timeline-search', 'search']];

    slots.forEach(([selector, name]) => {
      const host = document.querySelector(selector);
      // Guard so a second init pass cannot stack a duplicate glyph.
      if (host && !host.querySelector(':scope > svg')) {
        host.insertAdjacentHTML('afterbegin', icon(name));
      }
    });

    const closeButton = DOMUtils.getElement('modal-close');
    if (closeButton) {
      closeButton.innerHTML = icon('times');
    }
  }

  private initHero(): void {
    const config = this.dataService.getConfig();
    if (!config) {
      return;
    }

    const setText = (selector: string, value?: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (element && value) {
        element.textContent = value;
      }
    };

    const displayName = config.real_name || config.name;

    setText('.brand-text', config.name);
    setText('.loading-logo', config.name);
    setText('.hero-handle-text', config.name);
    setText('.hero-title', displayName);
    setText('.hero-role-title', config.title);
    setText('.hero-role-sub', config.subtitle);
    setText('.hero-lead', config.summary);
  }

  private initFooter(): void {
    const config = this.dataService.getConfig();
    const brand = DOMUtils.getElement('footer-brand');
    const meta = DOMUtils.getElement('footer-meta');

    if (brand) {
      brand.textContent = `${config.real_name || config.name} — ${new Date().getFullYear()}`;
    }

    if (meta && config.email) {
      meta.innerHTML = `<a href="mailto:${esc(config.email)}">${esc(config.email)}</a>`;
    }
  }

  private initNavigation(): void {
    const navMenu = DOMUtils.getElement('nav-menu');
    const navToggle = DOMUtils.getElement('nav-toggle');
    const navigation = this.dataService.getNavigation();

    if (!navigation || !navMenu) {
      return;
    }

    // Hide sections based on navigation enabled status
    this.hideDisabledSections(navigation);

    // Nav items carry a CSS-generated index instead of an icon — the counter
    // reads as wayfinding, and one fewer glyph per row keeps the bar quiet.
    navMenu.innerHTML = navigation
      .filter(nav => nav.enabled)
      .map(
        nav => `
        <button class="nav-item" type="button" data-nav-id="${esc(nav.id)}">
          <span>${esc(nav.title)}</span>
        </button>
      `
      )
      .join('');

    const navItems = DOMUtils.getElements('.nav-item');

    navToggle?.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle(CSS_CLASSES.ACTIVE);
      navToggle.classList.toggle(CSS_CLASSES.ACTIVE, isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navItems.forEach(item => {
      item.addEventListener('click', e => {
        const target = (e.currentTarget as HTMLElement).dataset.navId;
        if (target) {
          if (target === 'resume') {
            this.openCVModal();
          } else {
            this.navigateToSection(target);
          }
        }
        navToggle?.classList.remove(CSS_CLASSES.ACTIVE);
        navToggle?.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove(CSS_CLASSES.ACTIVE);
      });
    });

    this.setupScrollSpy(navigation);
  }

  /**
   * Marks the nav item for the section currently in view, and toggles the
   * condensed state on the bar.
   *
   * This deliberately does not use an IntersectionObserver band centred on
   * the viewport. On a tall display — a 1440x2560 monitor in portrait, say —
   * three sections are on screen at once and the centre of the viewport sits
   * inside the second one, so the bar highlighted "timeline" while the
   * reader was still at the top of the page. Picking the last section whose
   * top has crossed the bar is correct at any viewport height.
   */
  private setupScrollSpy(navigation: NavigationItem[]): void {
    const navContainer = document.querySelector<HTMLElement>(SELECTORS.NAV_CONTAINER);

    const sections = navigation
      .filter(nav => nav.enabled)
      .map(nav => ({
        id: nav.id,
        element: document.getElementById(nav.id === 'home' ? 'hero-section' : `${nav.id}-section`),
      }))
      .filter((entry): entry is { id: string; element: HTMLElement } => Boolean(entry.element));

    let activeId = '';
    const setActive = (id: string) => {
      if (id === activeId) {
        return;
      }
      activeId = id;
      DOMUtils.getElements('.nav-item').forEach(item => {
        const element = item as HTMLElement;
        element.classList.toggle(CSS_CLASSES.ACTIVE, element.dataset.navId === id);
      });
    };

    const update = () => {
      navContainer?.classList.toggle(CSS_CLASSES.SCROLLED, window.scrollY > 24);

      if (sections.length === 0) {
        return;
      }

      // A little below the bar, so a section counts as current once its
      // heading has actually arrived rather than when its first pixel has.
      // The slack must exceed the CSS `scroll-padding-top` (bar + 24px):
      // with the two equal, a section scrolled to the top lands exactly on
      // the line and sub-pixel rounding decides whether it counts.
      const line = (navContainer?.offsetHeight ?? 0) + 32;
      let current = sections[0];

      for (const section of sections) {
        if (section.element.getBoundingClientRect().top <= line) {
          current = section;
        }
      }

      // At the very bottom the last section may never cross the line.
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      setActive(atBottom ? sections[sections.length - 1].id : current.id);
    };

    const debouncedScrollHandler = debounce(update, APP_CONFIG.DEBOUNCE_DELAY);
    window.addEventListener('scroll', debouncedScrollHandler, { passive: true });
    window.addEventListener('resize', debouncedScrollHandler);

    // This runs before the sections below it have been filled in, so the
    // first measurement sees them all stacked near the top and would mark
    // the last one current. Re-measure whenever the document's height
    // changes — section rendering, images arriving, the webfont swapping.
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(debouncedScrollHandler).observe(document.body);
    }
    window.addEventListener('load', debouncedScrollHandler);

    update();
  }

  private initSocials(): void {
    const socialLinksContainers = document.querySelectorAll(SELECTORS.SOCIAL_LINKS);
    const socialLinks = this.dataService.getSocialLinks();

    if (!socialLinks || socialLinksContainers.length === 0) {
      return;
    }

    // Named text links rather than a row of brand circles: the label is the
    // accessible name, it needs no brand glyph, and it reads as editorial.
    const socialHtml = socialLinks
      .map(social => {
        const label = esc(social.platform || social.name || social.url);
        return `
        <a href="${esc(social.url)}" target="_blank" rel="noopener noreferrer" class="social-link">
          <span>${label}</span>${icon('arrow-up-right')}
        </a>
      `;
      })
      .join('');

    socialLinksContainers.forEach(container => {
      container.innerHTML = socialHtml;
    });
  }

  /**
   * Make a non-native element activatable by mouse and keyboard (Enter/Space).
   */
  private static onActivate(element: Element, handler: () => void): void {
    element.addEventListener('click', handler);
    element.addEventListener('keydown', e => {
      const key = (e as KeyboardEvent).key;
      if (key === 'Enter' || key === ' ') {
        e.preventDefault();
        handler();
      }
    });
  }

  private navigateToSection(section: string): void {
    const targetElement =
      section === 'home'
        ? document.getElementById('hero-section')
        : document.getElementById(`${section}-section`);

    targetElement?.scrollIntoView({ behavior: 'smooth' });
  }

  private hideDisabledSections(navigation: NavigationItem[]): void {
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

  private initTimeline(): void {
    const timelineContainer = DOMUtils.getElement('timeline-items');
    const searchInput = DOMUtils.getElement('timeline-search');
    const timelineWrapper = DOMUtils.getElement('timeline-wrapper');
    const timeline = this.dataService.getTimeline();

    if (!timeline || !timelineContainer) {
      return;
    }

    const filters = this.timelineFilters;
    // One source for what a category is called, shared by the filter button
    // and the tag on each card.
    const tagFor = (category: string) => filters.find(f => f.id === category)?.tag ?? category;

    const filterHost = document.querySelector('.timeline-filters');
    if (filterHost) {
      filterHost.innerHTML = filters
        .map(
          (f, i) => `
        <button class="filter-btn${i === 0 ? ' active' : ''}" type="button"
                aria-pressed="${i === 0}" data-filter="${esc(f.id)}">${esc(f.label)}</button>`
        )
        .join('');
    }
    const filterButtons = DOMUtils.getElements('.filter-btn');

    const renderTimeline = (filter: string = 'all', search: string = ''): void => {
      const needle = search.trim().toLowerCase();
      this.timelineState.currentFilter = filter;
      this.timelineState.currentSearch = needle;

      this.timelineState.filteredItems = timeline
        .filter(item => {
          const matchesFilter = filter === 'all' || item.category === filter;
          const haystack = `${item.company} ${item.title}`.toLowerCase();
          return matchesFilter && (needle === '' || haystack.includes(needle));
        })
        .sort((a, b) => b.order - a.order);

      if (this.timelineState.filteredItems.length === 0) {
        const message = this.dataService.getConfig().emptyMessage ?? DEFAULT_TEXT.emptyMessage;
        timelineContainer.innerHTML = `<p class="timeline-empty">${esc(message)}</p>`;
        this.updateTimelineProgress();
        return;
      }

      timelineContainer.innerHTML = this.timelineState.filteredItems
        .map((item, index) => {
          const dates = `${esc(item.startDate)}${item.endDate ? ` — ${esc(item.endDate)}` : ''}`;
          return `
        <div class="timeline-item visible" role="button" tabindex="0" aria-label="${esc(item.company)} — ${esc(item.title)}" data-category="${esc(item.category)}" data-index="${index}" data-timeline-item style="--item-index: ${index}">
          <div class="timeline-dot ${esc(item.category)}" aria-hidden="true"></div>
          <div class="timeline-content">
            <div class="timeline-date">${dates}</div>
            <h3>${esc(item.company)}</h3>
            <p>${esc(item.title)}</p>
            <div class="timeline-tag">${esc(tagFor(item.category))}</div>
          </div>
        </div>
      `;
        })
        .join('');

      timelineContainer.querySelectorAll('[data-timeline-item]').forEach(item => {
        Portfolio.onActivate(item, () => {
          const index = parseInt((item as HTMLElement).dataset.index || '0');
          const timelineItem = this.timelineState.filteredItems[index];
          if (timelineItem) {
            this.openModal(timelineItem.company, timelineItem);
          }
        });
      });

      this.updateTimelineProgress();
    };

    // Filter functionality
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const filterValue = (btn as HTMLElement).dataset.filter || 'all';
        filterButtons.forEach(b => {
          b.classList.remove(CSS_CLASSES.ACTIVE);
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add(CSS_CLASSES.ACTIVE);
        btn.setAttribute('aria-pressed', 'true');
        renderTimeline(filterValue, this.timelineState.currentSearch);
      });
    });

    // Search functionality
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        renderTimeline(this.timelineState.currentFilter, (e.target as HTMLInputElement).value);
      });
    }

    // Scroll progress tracking
    if (timelineWrapper) {
      const debouncedTimelineScroll = debounce(() => {
        this.updateTimelineProgress();
      }, APP_CONFIG.THROTTLE_DELAY);

      // On mobile, listen to window scroll; on desktop, listen to wrapper scroll
      timelineWrapper.addEventListener('scroll', debouncedTimelineScroll, { passive: true });
      window.addEventListener('scroll', debouncedTimelineScroll, { passive: true });
      window.addEventListener('resize', debouncedTimelineScroll);

      // Pointer drag, flick momentum and hover-wheel live in DragRail;
      // touch is left to the browser, which already scrolls this element.
      new DragRail(timelineWrapper, {
        enabled: () => window.innerWidth > BREAKPOINTS.MOBILE,
        wheelScope: '.timeline-track',
      });
    }

    renderTimeline();
  }

  /**
   * Publishes progress as a single custom property. The stylesheet decides
   * whether that drives width (horizontal rail) or height (vertical axis), so
   * orientation lives in CSS rather than in inline styles written per frame.
   */
  private updateTimelineProgress(): void {
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

  private initShowcase(): void {
    const showcaseContainer = DOMUtils.getElement('showcase-grid');
    const showcase = this.dataService.getShowcase();

    if (!showcase || !showcaseContainer) {
      return;
    }

    showcaseContainer.innerHTML = showcase
      .map((project, index) => {
        // A real <img> rather than a background-image: it can be lazy-loaded,
        // it reserves its box via aspect-ratio, and it decodes off-thread.
        const eager = index < 3;
        const media = project.backgroundImage
          ? `<img class="showcase-media" src="${esc(project.backgroundImage)}" alt="${esc(project.title)} project preview"
               loading="${eager ? 'eager' : 'lazy'}" decoding="async"
               fetchpriority="${eager ? 'high' : 'auto'}">`
          : '';

        const tech = project.technologies?.length
          ? `<div class="tech-stack">${project.technologies
              .map(item => `<span class="tech-badge">${esc(item)}</span>`)
              .join('')}</div>`
          : '';

        return `
      <article class="showcase-card" role="button" tabindex="0" aria-label="View project: ${esc(project.title)}" data-showcase-item data-project-id="${esc(project.id)}">
        <div class="showcase-image">
          ${media}
          <div class="showcase-overlay" aria-hidden="true"></div>
          <span class="showcase-index" aria-hidden="true"></span>
        </div>
        <div class="showcase-content">
          <h3 class="showcase-title"><span><a href="/projects/${encodeURIComponent(project.id)}/">${esc(project.title)}</a></span></h3>
          ${tech}
        </div>
      </article>
    `;
      })
      .join('');

    showcaseContainer.querySelectorAll('[data-showcase-item]').forEach(item => {
      item.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', event => event.stopPropagation());
        link.addEventListener('keydown', event => event.stopPropagation());
      });
      Portfolio.onActivate(item, () => {
        const projectId = (item as HTMLElement).dataset.projectId;
        const project = showcase.find(p => p.id === projectId);
        if (project) {
          this.openModal(project.title, project);
        }
      });
    });
  }

  private initScrollAnimations(): void {
    // Where scroll-driven CSS animation is available the reveals are handled
    // entirely in the stylesheet; this observer only backs up the timeline,
    // whose stagger index comes from the render pass.
    const observerOptions: IntersectionObserverInit = {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px',
    };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(CSS_CLASSES.VISIBLE);
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    DOMUtils.getElements('.timeline-item').forEach(element => observer.observe(element));
  }

  private setupEventListeners(): void {
    // The brand keeps its href so it still works without JavaScript, but a
    // plain anchor would leave "#hero-section" sitting in the address bar
    // after every click. Scroll it ourselves and keep the URL clean.
    document.querySelector<HTMLAnchorElement>('.nav-brand')?.addEventListener('click', e => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    });

    // Scroll cue
    document.querySelector<HTMLElement>('.scroll-arrow')?.addEventListener('click', () => {
      document.getElementById('timeline-section')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Modal close
    const modalClose = DOMUtils.getElement('modal-close');
    const modalOverlay = DOMUtils.getElement('modal-overlay');

    modalClose?.addEventListener('click', () => this.closeModal());

    modalOverlay?.addEventListener('click', e => {
      if (e.target === modalOverlay) {
        this.closeModal();
      }
    });

    // Modal keyboard handling: Escape closes, Tab is trapped inside the dialog
    document.addEventListener('keydown', e => {
      const modal = DOMUtils.getElement('modal-overlay');
      if (!modal?.classList.contains(CSS_CLASSES.ACTIVE)) {
        return;
      }

      if (e.key === 'Escape') {
        this.closeModal();
        return;
      }

      if (e.key === 'Tab') {
        this.trapModalFocus(e);
      }
    });
  }

  private trapModalFocus(e: KeyboardEvent): void {
    const container = DOMUtils.getElement('modal-container');
    if (!container) {
      return;
    }

    const focusable = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), iframe, video, input, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (e.shiftKey && (active === first || !container.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !container.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  }

  private startAnimations(): void {
    DOMUtils.getElements('.fade-in-up').forEach((element, index) => {
      setTimeout(() => {
        (element as HTMLElement).style.opacity = '1';
        (element as HTMLElement).style.translate = '0 0';
      }, index * APP_CONFIG.ANIMATION_DELAY);
    });
  }

  private openModal(title: string, data: TimelineItem | ShowcaseProject): void {
    const modal = DOMUtils.getElement('modal-overlay');
    const modalContainer = DOMUtils.getElement('modal-container');
    const modalTitle = DOMUtils.getElement('modal-title');
    const modalContent = DOMUtils.getElement('modal-content');

    if (!modal || !modalContainer || !modalTitle || !modalContent) {
      return;
    }

    modalContainer.classList.remove('resume-modal');
    modalTitle.textContent = title;
    modalContent.innerHTML = data.modalContent
      ? this.generateModalContent(data.modalContent)
      : '<p class="modal-description">No additional information available.</p>';
    modalContent.scrollTop = 0;

    this.lastFocusedElement = document.activeElement as HTMLElement | null;
    modal.classList.add(CSS_CLASSES.ACTIVE);
    document.body.style.overflow = 'hidden';
    this.focusModalClose(modal);
  }

  /**
   * Move focus to the modal's close button once the open transition finishes.
   * The overlay delays its `visibility` change until the fade-out completes,
   * so until the open transition fires the button can still compute as hidden
   * and be unfocusable. The timeout is the fallback if no transition runs.
   */
  private focusModalClose(modal: HTMLElement): void {
    const closeButton = DOMUtils.getElement('modal-close');
    if (!closeButton) {
      return;
    }

    let focused = false;
    const tryFocus = () => {
      if (focused || !modal.classList.contains(CSS_CLASSES.ACTIVE)) {
        return;
      }
      focused = true;
      closeButton.focus();
    };

    modal.addEventListener('transitionend', tryFocus, { once: true });
    window.setTimeout(tryFocus, 400);
  }

  private openCVModal(): void {
    const config = this.dataService.getConfig();
    const resumeUrl =
      config.resumeUrl ||
      (config.cvDriveId ? `https://drive.google.com/file/d/${config.cvDriveId}/preview` : '');
    if (!resumeUrl) {
      return;
    }
    const title = config.resumeTitle ?? DEFAULT_TEXT.resumeTitle;
    const resume: ShowcaseProject = {
      id: 'resume',
      title,
      backgroundImage: '',
      modalContent: { title, iframe: resumeUrl } satisfies ModalContent,
    };

    this.openModal(title, resume);
    DOMUtils.getElement('modal-container')?.classList.add('resume-modal');
  }

  /**
   * Splits a project into a media column and a text column.
   *
   * Stacked in one narrow scroller, a tall screenshot pushed everything that
   * explains it below the fold, so opening a project showed a picture and
   * little else. Side by side on a wide screen the whole thing is readable
   * at once, and on a narrow one it falls back to a single column inside a
   * full-height sheet. An embedded document (the CV) stays full width —
   * there is no text beside it to pair with.
   */
  private generateModalContent(content: ModalContent): string {
    const media: string[] = [];
    const text: string[] = [];

    if (content.image) {
      media.push(
        `<img class="modal-media" src="${content.image}" alt="${esc(content.title ?? '')}" loading="lazy" decoding="async">`
      );
    }

    if (content.video) {
      media.push(`
        <video class="modal-media" controls preload="metadata">
          <source src="${content.video.src}" type="${content.video.type}">
          Your browser does not support the video tag.
        </video>
      `);
    }

    if (content.iframe) {
      media.push(
        `<iframe class="modal-iframe" src="${content.iframe}" title="${esc(content.title ?? '')}" loading="lazy"></iframe>`
      );
    }

    if (content.subtitle) {
      text.push(`<h2 class="modal-subtitle">${content.subtitle}</h2>`);
    }

    if (content.location) {
      text.push(
        `<p class="modal-location">${icon('map-marker-alt')}<span>${content.location}</span></p>`
      );
    }

    if (content.description) {
      text.push(`<p class="modal-description">${content.description}</p>`);
    }

    if (content.details && content.details.length > 0) {
      text.push(this.generateDetailsHTML(content.details));
    }

    if (content.awards && content.awards.length > 0) {
      text.push(this.generateAwardsHTML(content.awards));
    }

    if (content.links && content.links.length > 0) {
      text.push(this.generateLinksHTML(content.links));
    }

    const splittable = media.length > 0 && text.length > 0 && !content.iframe;
    const classes = `modal-body${splittable ? ' modal-body--split' : ''}`;

    return `<div class="${classes}">
      ${media.length ? `<div class="modal-figure">${media.join('')}</div>` : ''}
      ${text.length ? `<div class="modal-text">${text.join('')}</div>` : ''}
    </div>`;
  }

  private generateDetailsHTML(details: string[]): string {
    let html = '<div class="modal-details">';

    details.forEach(detail => {
      const trimmedDetail = detail.trim();
      const leadingSpaces = detail.length - detail.trimStart().length;

      if (trimmedDetail === '') {
        html += '<br>';
      } else if (leadingSpaces > 0) {
        const indentLevel = Math.floor(leadingSpaces / 2);
        const indentStyle = `margin-left: ${indentLevel * 1.5}rem;`;
        const lineClass = trimmedDetail.startsWith('•') ? 'detail-bullet' : 'detail-line';
        html += `<div class="${lineClass}" style="${indentStyle}">${trimmedDetail}</div>`;
      } else {
        if (trimmedDetail.includes('(') && trimmedDetail.includes(')')) {
          html += `<h3 class="detail-heading">${trimmedDetail}</h3>`;
        } else if (trimmedDetail.endsWith(':')) {
          html += `<h4 class="detail-subheading">${trimmedDetail}</h4>`;
        } else {
          html += `<div class="detail-text">${trimmedDetail}</div>`;
        }
      }
    });

    html += '</div>';
    return html;
  }

  private generateAwardsHTML(
    awards: { title: string; date?: string; issuer?: string; description?: string }[]
  ): string {
    let html = '<div class="modal-awards">';
    html += `<h3 class="modal-awards-title">${icon('trophy')}<span>Awards</span></h3>`;
    html += '<ul class="modal-awards-list">';
    awards.forEach(award => {
      const parts: string[] = [award.title];
      if (award.date) {
        parts.push(award.date);
      }
      if (award.issuer) {
        parts.push(award.issuer);
      }
      const line = parts.join(' · ');
      const desc = award.description
        ? ` <span class="award-description">— ${award.description}</span>`
        : '';
      html += `<li>${line}${desc}</li>`;
    });
    html += '</ul></div>';
    return html;
  }

  private generateLinksHTML(links: { text: string; url: string }[]): string {
    let html = '<div class="modal-links">';

    links.forEach(link => {
      const isLive =
        link.text.toLowerCase().includes('live') || link.text.toLowerCase().includes('view');
      html += `<a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer" class="modal-link">${icon(
        isLive ? 'external-link-alt' : 'code'
      )}<span>${esc(link.text)}</span></a>`;
    });

    html += '</div>';
    return html;
  }

  public closeModal(): void {
    DOMUtils.getElement('modal-overlay')?.classList.remove(CSS_CLASSES.ACTIVE);
    DOMUtils.getElement('modal-container')?.classList.remove('resume-modal');
    document.body.style.overflow = 'auto';
    this.lastFocusedElement?.focus();
    this.lastFocusedElement = null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Portfolio();
});
