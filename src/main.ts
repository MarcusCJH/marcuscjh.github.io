import './styles/style.css';

import { DataService } from './services/dataService';
import { LoadingService } from './services/loadingService';
import { SEOService } from './services/seoService';
import { MatrixBackground } from './components/MatrixBackground';
import { ParticleSystem } from './components/ParticleSystem';
import { TypedText } from './components/TypedText';

import { DOMUtils } from './lib/dom';
import { debounce } from './lib/utils';
import { APP_CONFIG, BREAKPOINTS, CSS_CLASSES, SELECTORS } from './lib/constants';

import type {
  TimelineItem,
  ShowcaseProject,
  ModalContent,
  TimelineState,
  NavigationItem,
} from './types';

class Portfolio {
  private dataService: DataService;
  private loadingService: LoadingService;
  private snapTimer: number | undefined;
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

    if (!prefersReducedMotion) {
      new MatrixBackground();
      new ParticleSystem();
    }

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

    this.initHero();
    this.initNavigation();
    this.initSocials();
    this.initTimeline();
    this.initShowcase();
    this.initScrollAnimations();
  }

  private initHero(): void {
    const config = this.dataService.getConfig();
    if (!config) {
      return;
    }

    const setGlitch = (el: HTMLElement | null, value: string) => {
      if (!el) {
        return;
      }
      el.textContent = value;
      el.setAttribute('data-text', value);
    };

    setGlitch(document.querySelector('.brand-text'), config.name);
    setGlitch(document.querySelector('.hero-title'), config.name);
    setGlitch(document.querySelector('.loading-logo .glitch'), config.name);

    const heroDesc = document.querySelector<HTMLElement>('.hero-description');
    if (heroDesc) {
      heroDesc.innerHTML = `
        <p class="fade-in-up">${config.title}</p>
        <p class="fade-in-up delay-1">${config.subtitle}</p>
      `;
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

    navMenu.innerHTML = navigation
      .filter(nav => nav.enabled)
      .map(
        nav => `
        <button class="nav-item" type="button" data-nav-id="${nav.id}">
          <i class="${nav.icon}" aria-hidden="true"></i>
          <span>${nav.title}</span>
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
          this.navigateToSection(target);
        }
        navToggle?.classList.remove(CSS_CLASSES.ACTIVE);
        navToggle?.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove(CSS_CLASSES.ACTIVE);
      });
    });

    // Scroll spy
    const debouncedScrollHandler = debounce(() => {
      const scrollY = window.scrollY;
      document
        .querySelector<HTMLElement>(SELECTORS.NAV_CONTAINER)
        ?.classList.toggle(CSS_CLASSES.SCROLLED, scrollY > 50);
    }, APP_CONFIG.DEBOUNCE_DELAY);

    window.addEventListener('scroll', debouncedScrollHandler);
  }

  private initSocials(): void {
    const socialLinksContainers = document.querySelectorAll(SELECTORS.SOCIAL_LINKS);
    const socialLinks = this.dataService.getSocialLinks();

    if (!socialLinks || socialLinksContainers.length === 0) {
      return;
    }

    const socialHtml = socialLinks
      .map(social => {
        const label = social.platform || social.name || '';
        return `
        <a href="${social.url}" target="_blank" rel="noopener noreferrer" class="social-link" title="${label}" aria-label="${label}">
          <i class="${social.icon}" aria-hidden="true"></i>
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
      if (!nav.enabled) {
        const section = document.getElementById(`${nav.id}-section`);
        if (section) {
          section.style.display = 'none';
        }
      }
    });
  }

  private initTimeline(): void {
    const timelineContainer = DOMUtils.getElement('timeline-items');
    const filterButtons = DOMUtils.getElements('.filter-btn');
    const searchInput = DOMUtils.getElement('timeline-search');
    const timelineWrapper = DOMUtils.getElement('timeline-wrapper');
    const timeline = this.dataService.getTimeline();

    if (!timeline || !timelineContainer) {
      return;
    }

    // Drag-to-scroll state
    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;

    const renderTimeline = (filter: string = 'all', search: string = ''): void => {
      this.timelineState.currentFilter = filter;
      this.timelineState.currentSearch = search.toLowerCase();

      this.timelineState.filteredItems = timeline
        .filter(item => {
          const matchesFilter = filter === 'all' || item.category === filter;
          const matchesSearch =
            search === '' ||
            item.company.toLowerCase().includes(search.toLowerCase()) ||
            item.title.toLowerCase().includes(search.toLowerCase());
          return matchesFilter && matchesSearch;
        })
        .sort((a, b) => b.order - a.order);

      timelineContainer.innerHTML = this.timelineState.filteredItems
        .map(
          (item, index) => `
        <div class="timeline-item visible" role="button" tabindex="0" aria-label="${item.company} — ${item.title}" data-category="${item.category}" data-index="${index}" data-timeline-item style="--item-index: ${index}">
          <div class="timeline-dot ${item.category}">
            <i class="${this.getTimelineIcon(item.category)}" aria-hidden="true"></i>
          </div>
          <div class="timeline-content">
            <div class="timeline-date">${item.startDate}${item.endDate ? ` - ${item.endDate}` : ''}</div>
            <h3>${item.company}</h3>
            <p>${item.title}</p>
          </div>
        </div>
      `
        )
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
        filterButtons.forEach(b => b.classList.remove(CSS_CLASSES.ACTIVE));
        btn.classList.add(CSS_CLASSES.ACTIVE);
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
      timelineWrapper.addEventListener('scroll', debouncedTimelineScroll);
      window.addEventListener('scroll', debouncedTimelineScroll);
      window.addEventListener('resize', debouncedTimelineScroll);

      // Drag-to-scroll with momentum (desktop only).
      // Evaluated per-event so resizing across the breakpoint behaves correctly.
      const isDesktop = () => window.innerWidth > BREAKPOINTS.MOBILE;

      {
        let velocity = 0;
        let lastX = 0;
        let lastMoveTime = 0;
        let momentumRafId = 0;

        // Disable scroll snap while dragging/coasting so it doesn't fight the gesture
        const disableSnap = () => {
          timelineWrapper.style.scrollSnapType = 'none';
        };
        const restoreSnap = () => {
          timelineWrapper.style.scrollSnapType = '';
        };

        const applyMomentum = () => {
          if (Math.abs(velocity) < 0.3) {
            velocity = 0;
            restoreSnap();
            return;
          }
          timelineWrapper.scrollLeft += velocity;
          velocity *= 0.88;
          momentumRafId = window.requestAnimationFrame(applyMomentum);
        };

        // Mouse down - start drag
        timelineWrapper.addEventListener('mousedown', e => {
          if (!isDesktop()) {
            return;
          }
          isDragging = true;
          velocity = 0;
          window.cancelAnimationFrame(momentumRafId);
          disableSnap();
          timelineWrapper.style.cursor = 'grabbing';
          timelineWrapper.style.userSelect = 'none';
          startX = e.pageX - timelineWrapper.offsetLeft;
          scrollLeft = timelineWrapper.scrollLeft;
          lastX = e.pageX;
          lastMoveTime = window.performance.now();
        });

        // Mouse move - 1:1 drag, track velocity via EMA
        timelineWrapper.addEventListener('mousemove', e => {
          if (!isDragging) {
            return;
          }
          e.preventDefault();
          const x = e.pageX - timelineWrapper.offsetLeft;
          // 1:1 drag — no amplification multiplier
          timelineWrapper.scrollLeft = scrollLeft - (x - startX);
          const now = window.performance.now();
          const dt = now - lastMoveTime || 1;
          const rawVelocity = ((lastX - e.pageX) / dt) * 16;
          // Exponential moving average to smooth noisy samples
          velocity = velocity * 0.6 + rawVelocity * 0.4;
          lastX = e.pageX;
          lastMoveTime = now;
        });

        const endDrag = () => {
          if (!isDragging) {
            return;
          }
          isDragging = false;
          timelineWrapper.style.cursor = 'grab';
          timelineWrapper.style.userSelect = 'none';
          window.cancelAnimationFrame(momentumRafId);
          // Cap momentum so a fast flick doesn't fly too far
          velocity = Math.max(-40, Math.min(40, velocity));
          momentumRafId = window.requestAnimationFrame(applyMomentum);
        };

        timelineWrapper.addEventListener('mouseup', endDrag);
        timelineWrapper.addEventListener('mouseleave', endDrag);

        // Prevent default drag behavior
        timelineWrapper.addEventListener('dragstart', e => {
          e.preventDefault();
        });

        // Wheel → horizontal scroll conversion
        timelineWrapper.addEventListener(
          'wheel',
          e => {
            if (isDesktop() && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
              e.preventDefault();
              window.cancelAnimationFrame(momentumRafId);
              disableSnap();
              timelineWrapper.scrollLeft += e.deltaY;
              // Brief delay before snap restores so it doesn't snap on each tick
              clearTimeout(this.snapTimer);
              this.snapTimer = window.setTimeout(restoreSnap, 150);
            }
          },
          { passive: false }
        );

        // Touch swipe support (touch-screen desktops / iPads in desktop mode)
        let touchStartX = 0;
        let touchScrollLeft = 0;
        let touchActive = false;
        timelineWrapper.addEventListener(
          'touchstart',
          e => {
            touchActive = isDesktop();
            if (!touchActive) {
              return;
            }
            touchStartX = e.touches[0].pageX;
            touchScrollLeft = timelineWrapper.scrollLeft;
            velocity = 0;
            window.cancelAnimationFrame(momentumRafId);
            disableSnap();
          },
          { passive: true }
        );

        timelineWrapper.addEventListener(
          'touchmove',
          e => {
            if (!touchActive) {
              return;
            }
            const dx = touchStartX - e.touches[0].pageX;
            timelineWrapper.scrollLeft = touchScrollLeft + dx;
          },
          { passive: true }
        );

        timelineWrapper.addEventListener(
          'touchend',
          e => {
            if (!touchActive) {
              return;
            }
            touchActive = false;
            const dx = touchStartX - e.changedTouches[0].pageX;
            velocity = Math.max(-40, Math.min(40, dx * 0.2));
            momentumRafId = window.requestAnimationFrame(applyMomentum);
          },
          { passive: true }
        );
      }
    }

    renderTimeline();
  }

  private updateTimelineProgress(): void {
    const timelineWrapper = DOMUtils.getElement('timeline-wrapper');
    const progressBar = DOMUtils.getElement('timeline-progress');

    if (!timelineWrapper || !progressBar) {
      return;
    }

    const isMobile = window.innerWidth <= BREAKPOINTS.MOBILE;

    if (isMobile) {
      const rect = timelineWrapper.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Calculate progress based on how much of the timeline has passed the center of the screen
      // or simply how much of it is scrolled through.
      const totalHeight = rect.height;
      const scrolledPast = viewportHeight / 2 - rect.top;
      let progress = (scrolledPast / totalHeight) * 100;

      progress = Math.max(0, Math.min(100, progress));

      progressBar.style.height = `${progress}%`;
      progressBar.style.width = '4px';
    } else {
      const scrollLeft = timelineWrapper.scrollLeft;
      const scrollWidth = timelineWrapper.scrollWidth - timelineWrapper.clientWidth;
      const progress = scrollWidth > 0 ? (scrollLeft / scrollWidth) * 100 : 0;

      progressBar.style.width = `${progress}%`;
      progressBar.style.height = '4px';
    }
  }

  private initShowcase(): void {
    const showcaseContainer = DOMUtils.getElement('showcase-grid');
    const showcase = this.dataService.getShowcase();

    if (!showcase || !showcaseContainer) {
      return;
    }

    showcaseContainer.innerHTML = showcase
      .map(
        project => `
      <div class="showcase-card" role="button" tabindex="0" aria-label="View project: ${project.title}" data-showcase-item data-project-id="${project.id}">
        <div class="showcase-image" style="background-image: url('${project.backgroundImage}')">
          <div class="showcase-overlay"></div>
        </div>
        <div class="showcase-content">
          <h3 class="showcase-title">${project.title}</h3>
          ${
            project.technologies
              ? `
            <div class="tech-stack">
              ${project.technologies.map(tech => `<span class="tech-badge">${tech}</span>`).join('')}
            </div>
          `
              : ''
          }
        </div>
      </div>
    `
      )
      .join('');

    showcaseContainer.querySelectorAll('[data-showcase-item]').forEach(item => {
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
    const observerOptions: IntersectionObserverInit = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(CSS_CLASSES.VISIBLE);
        }
      });
    }, observerOptions);

    [...DOMUtils.getElements('.timeline-item'), ...DOMUtils.getElements('.showcase-card')].forEach(
      element => observer.observe(element)
    );
  }

  private setupEventListeners(): void {
    const cvPreview = DOMUtils.getElement('cv-preview');
    if (cvPreview) {
      Portfolio.onActivate(cvPreview, () => this.openCVModal());
    }

    // Scroll indicator
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
        (element as HTMLElement).style.transform = 'translateY(0)';
      }, index * APP_CONFIG.ANIMATION_DELAY);
    });
  }

  private openModal(title: string, data: TimelineItem | ShowcaseProject): void {
    const modal = DOMUtils.getElement('modal-overlay');
    const modalTitle = DOMUtils.getElement('modal-title');
    const modalContent = DOMUtils.getElement('modal-content');

    if (!modal || !modalTitle || !modalContent) {
      return;
    }

    modalTitle.textContent = title;
    modalContent.innerHTML = data.modalContent
      ? this.generateModalContent(data.modalContent)
      : '<p>No additional information available.</p>';

    this.lastFocusedElement = document.activeElement as HTMLElement | null;
    modal.classList.add(CSS_CLASSES.ACTIVE);
    document.body.style.overflow = 'hidden';
    this.focusModalClose(modal);
  }

  /**
   * Move focus to the modal's close button once the open transition finishes.
   * Several elements in the modal use `transition: all`, which also transitions
   * the inherited `visibility` — until that completes the button computes as
   * hidden and is unfocusable. A timeout acts as a fallback in case no
   * transition fires.
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
    const cvDriveId = this.dataService.getConfig().cvDriveId;
    if (!cvDriveId) {
      return;
    }
    const modalContent: ModalContent = {
      title: 'Resume / CV',
      description: 'View my complete resume and professional background.',
      iframe: `https://drive.google.com/file/d/${cvDriveId}/preview`,
    };

    const tempProject: ShowcaseProject = {
      id: 'cv',
      title: 'Resume / CV',
      backgroundImage: '',
      modalContent,
    };

    this.openModal('Resume', tempProject);
  }

  private generateModalContent(content: ModalContent): string {
    let html = '';

    if (content.subtitle) {
      html += `<h2 class="modal-subtitle">${content.subtitle}</h2>`;
    }

    if (content.location) {
      html += `<p class="modal-location"><i class="fas fa-map-marker-alt" aria-hidden="true"></i> ${content.location}</p>`;
    }

    if (content.image) {
      html += `<img class="modal-media" src="${content.image}" alt="${content.title}">`;
    }

    if (content.video) {
      html += `
        <video class="modal-media" controls>
          <source src="${content.video.src}" type="${content.video.type}">
          Your browser does not support the video tag.
        </video>
      `;
    }

    if (content.iframe) {
      html += `<iframe class="modal-iframe" src="${content.iframe}" title="${content.title}"></iframe>`;
    }

    if (content.description) {
      html += `<p class="modal-description">${content.description}</p>`;
    }

    if (content.details && content.details.length > 0) {
      html += this.generateDetailsHTML(content.details);
    }

    if (content.awards && content.awards.length > 0) {
      html += this.generateAwardsHTML(content.awards);
    }

    if (content.links && content.links.length > 0) {
      html += this.generateLinksHTML(content.links);
    }

    return html;
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
    html +=
      '<h3 class="modal-awards-title"><i class="fas fa-trophy" aria-hidden="true"></i>Awards</h3>';
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
      const icon =
        link.text.toLowerCase().includes('live') || link.text.toLowerCase().includes('view')
          ? 'fa-external-link-alt'
          : 'fa-code';
      html += `<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="modal-link"><i class="fas ${icon}" aria-hidden="true"></i>${link.text}</a>`;
    });

    html += '</div>';
    return html;
  }

  public closeModal(): void {
    DOMUtils.getElement('modal-overlay')?.classList.remove(CSS_CLASSES.ACTIVE);
    document.body.style.overflow = 'auto';
    this.lastFocusedElement?.focus();
    this.lastFocusedElement = null;
  }

  private getTimelineIcon(category: string): string {
    const icons: Record<string, string> = {
      work: 'fas fa-briefcase',
      education: 'fas fa-graduation-cap',
      certification: 'fas fa-certificate',
    };
    return icons[category] || 'fas fa-circle';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Portfolio();
});
