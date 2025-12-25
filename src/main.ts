// Import CSS for Vite
import './styles/style.css';

// Import services and components
import { DataService } from './services/dataService';
import { LoadingService } from './services/loadingService';
import { SEOService } from './services/seoService';
import { MatrixBackground } from './components/MatrixBackground';
import { ParticleSystem } from './components/ParticleSystem';
import { TypedText } from './components/TypedText';

// Import utilities
import { DOMUtils } from './lib/dom';
import { debounce } from './lib/utils';
import { APP_CONFIG, CSS_CLASSES, SELECTORS } from './lib/constants';

// Import types
import type {
  TimelineItem,
  ShowcaseProject,
  ModalContent,
  TimelineState,
  NavigationItem,
} from './types';

// Simplified Portfolio Class - KISS Principle
class Portfolio {
  private dataService: DataService;
  private loadingService: LoadingService;
  private timelineState: TimelineState = {
    currentFilter: 'all',
    currentSearch: '',
    currentIndex: 0,
    filteredItems: [],
    isScrolling: false,
  };

  constructor() {
    this.dataService = DataService.getInstance();
    this.loadingService = LoadingService.getInstance();
    this.hideMainContent();
    this.init();
  }

  private async init(): Promise<void> {
    this.loadingService.startLoading();

    const dataPromise = this.dataService.loadData();
    const minLoadingTime = APP_CONFIG.MIN_LOADING_TIME;
    const startTime = Date.now();

    const data = await dataPromise;

    // Apply SEO configuration from data.json
    if (data.seo) {
      SEOService.applySEO(data.seo);
    }

    this.initializeComponents();
    this.setupEventListeners();
    this.startAnimations();

    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

    if (remainingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, remainingTime));
    }

    this.loadingService.completeLoading();
  }

  private hideMainContent(): void {
    const mainContainer = document.querySelector(SELECTORS.MAIN_CONTAINER) as HTMLElement;
    if (mainContainer) {
      mainContainer.style.opacity = '0';
      mainContainer.style.visibility = 'hidden';
      mainContainer.style.transition = 'opacity 0.3s ease, visibility 0.3s ease';
    }
  }

  private initializeComponents(): void {
    // Initialize background effects
    new MatrixBackground();
    new ParticleSystem();

    // Initialize typed text
    const config = this.dataService.getConfig();
    if (config?.typedMessages) {
      new TypedText(config.typedMessages);
    }

    this.initNavigation();
    this.initSocials();
    this.initTimeline();
    this.initShowcase();
    this.initScrollAnimations();
  }

  private initNavigation(): void {
    const navMenu = DOMUtils.getElement('nav-menu') as HTMLElement;
    const navToggle = DOMUtils.getElement('nav-toggle') as HTMLElement;
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
        <div class="nav-item" data-nav-id="${nav.id}">
          <i class="${nav.icon}"></i>
          <span>${nav.title}</span>
        </div>
      `
      )
      .join('');

    const navItems = DOMUtils.getElements('.nav-item');

    navToggle?.addEventListener('click', () => {
      navToggle.classList.toggle(CSS_CLASSES.ACTIVE);
      navMenu.classList.toggle(CSS_CLASSES.ACTIVE);
    });

    navItems.forEach(item => {
      item.addEventListener('click', e => {
        const target = (e.currentTarget as HTMLElement).dataset.navId;
        if (target) {
          this.navigateToSection(target);
        }
        navToggle.classList.remove(CSS_CLASSES.ACTIVE);
        navMenu.classList.remove(CSS_CLASSES.ACTIVE);
      });
    });

    // Scroll spy
    const debouncedScrollHandler = debounce(() => {
      const scrollY = window.scrollY;
      const nav = document.querySelector(SELECTORS.NAV_CONTAINER) as HTMLElement;
      nav?.classList.toggle(CSS_CLASSES.SCROLLED, scrollY > 50);
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
      .map(
        social => `
        <a href="${social.url}" target="_blank" class="social-link" title="${social.platform || social.name || ''}">
          <i class="${social.icon}"></i>
        </a>
      `
      )
      .join('');

    socialLinksContainers.forEach(container => {
      container.innerHTML = socialHtml;
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
    const timelineContainer = DOMUtils.getElement('timeline-items') as HTMLElement;
    const filterButtons = DOMUtils.getElements('.filter-btn');
    const searchInput = DOMUtils.getElement('timeline-search') as HTMLInputElement;
    const timelineWrapper = DOMUtils.getElement('timeline-wrapper') as HTMLElement;
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
        <div class="timeline-item visible" data-category="${item.category}" data-index="${index}" data-timeline-item>
          <div class="timeline-dot ${item.category}">
            <i class="${this.getTimelineIcon(item.category)}"></i>
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

      // Add click handlers
      timelineContainer.querySelectorAll('[data-timeline-item]').forEach(item => {
        item.addEventListener('click', e => {
          const index = parseInt((e.currentTarget as HTMLElement).dataset.index || '0');
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

      timelineWrapper.addEventListener('scroll', debouncedTimelineScroll);

      // Drag-to-scroll functionality (desktop only)
      const isDesktop = window.innerWidth > 768;

      if (isDesktop) {
        // Mouse down - start drag
        timelineWrapper.addEventListener('mousedown', e => {
          isDragging = true;
          timelineWrapper.style.cursor = 'grabbing';
          timelineWrapper.style.userSelect = 'none';
          startX = e.pageX - timelineWrapper.offsetLeft;
          scrollLeft = timelineWrapper.scrollLeft;
        });

        // Mouse move - drag scroll
        timelineWrapper.addEventListener('mousemove', e => {
          if (!isDragging) {
            return;
          }
          e.preventDefault();
          const x = e.pageX - timelineWrapper.offsetLeft;
          const walk = (x - startX) * 2; // Scroll speed multiplier
          timelineWrapper.scrollLeft = scrollLeft - walk;
        });

        // Mouse up - end drag
        timelineWrapper.addEventListener('mouseup', () => {
          isDragging = false;
          timelineWrapper.style.cursor = 'grab';
          timelineWrapper.style.userSelect = 'none';
        });

        // Mouse leave - end drag
        timelineWrapper.addEventListener('mouseleave', () => {
          isDragging = false;
          timelineWrapper.style.cursor = 'grab';
          timelineWrapper.style.userSelect = 'none';
        });

        // Prevent default drag behavior
        timelineWrapper.addEventListener('dragstart', e => {
          e.preventDefault();
        });
      }
    }

    renderTimeline();
  }

  private updateTimelineProgress(): void {
    const timelineWrapper = DOMUtils.getElement('timeline-wrapper') as HTMLElement;
    const progressBar = DOMUtils.getElement('timeline-progress') as HTMLElement;

    if (!timelineWrapper || !progressBar) {
      return;
    }

    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      const scrollTop = timelineWrapper.scrollTop;
      const scrollHeight = timelineWrapper.scrollHeight - timelineWrapper.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

      progressBar.style.height = `${progress}%`;
      progressBar.style.width = '2px';
    } else {
      const scrollLeft = timelineWrapper.scrollLeft;
      const scrollWidth = timelineWrapper.scrollWidth - timelineWrapper.clientWidth;
      const progress = scrollWidth > 0 ? (scrollLeft / scrollWidth) * 100 : 0;

      progressBar.style.width = `${progress}%`;
      progressBar.style.height = '4px';
    }
  }

  private initShowcase(): void {
    const showcaseContainer = DOMUtils.getElement('showcase-grid') as HTMLElement;
    const showcase = this.dataService.getShowcase();

    if (!showcase || !showcaseContainer) {
      return;
    }

    showcaseContainer.innerHTML = showcase
      .map(
        project => `
      <div class="showcase-card" data-showcase-item data-project-id="${project.id}">
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

    // Add click handlers
    showcaseContainer.querySelectorAll('[data-showcase-item]').forEach(item => {
      item.addEventListener('click', e => {
        const projectId = (e.currentTarget as HTMLElement).dataset.projectId;
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
    // CV Preview click
    const cvPreview = DOMUtils.getElement('cv-preview') as HTMLElement;
    cvPreview?.addEventListener('click', () => this.openCVModal());

    // Scroll indicator
    const scrollArrow = document.querySelector('.scroll-arrow') as HTMLElement;
    scrollArrow?.addEventListener('click', () => {
      document.getElementById('timeline-section')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Modal close
    const modalClose = DOMUtils.getElement('modal-close') as HTMLElement;
    const modalOverlay = DOMUtils.getElement('modal-overlay') as HTMLElement;

    modalClose?.addEventListener('click', () => this.closeModal());

    modalOverlay?.addEventListener('click', e => {
      if (e.target === modalOverlay) {
        this.closeModal();
      }
    });

    // Escape key to close modal
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        this.closeModal();
      }
    });
  }

  private startAnimations(): void {
    DOMUtils.getElements('.fade-in-up').forEach((element, index) => {
      setTimeout(() => {
        (element as HTMLElement).style.opacity = '1';
        (element as HTMLElement).style.transform = 'translateY(0)';
      }, index * APP_CONFIG.ANIMATION_DELAY);
    });
  }

  public openModal(title: string, data: string | TimelineItem | ShowcaseProject): void {
    const modal = DOMUtils.getElement('modal-overlay') as HTMLElement;
    const modalTitle = DOMUtils.getElement('modal-title') as HTMLElement;
    const modalContent = DOMUtils.getElement('modal-content') as HTMLElement;

    if (!modal || !modalTitle || !modalContent) {
      return;
    }

    let parsedData: TimelineItem | ShowcaseProject;
    try {
      parsedData = typeof data === 'string' ? JSON.parse(data.replace(/&quot;/g, '"')) : data;
    } catch {
      return;
    }

    modalTitle.textContent = title;

    if (parsedData.modalContent) {
      modalContent.innerHTML = this.generateModalContent(parsedData.modalContent);
    } else {
      modalContent.innerHTML = '<p>No additional information available.</p>';
    }

    modal.classList.add(CSS_CLASSES.ACTIVE);
    document.body.style.overflow = 'hidden';
  }

  private openCVModal(): void {
    const cvElement = document.getElementById('cv-preview');
    const cvDriveId = cvElement?.dataset.cvDriveId || '16eXxJWLCsUib7gZKX48jhT85myOxqh0_';
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
      html += `<h2 style="color: var(--secondary-color); margin-bottom: 1rem;">${content.subtitle}</h2>`;
    }

    if (content.location) {
      html += `<p style="color: var(--text-muted); margin-bottom: 1rem;"><i class="fas fa-map-marker-alt"></i> ${content.location}</p>`;
    }

    if (content.image) {
      html += `<img src="${content.image}" alt="${content.title}" style="width: 100%; border-radius: 10px; margin-bottom: 1rem;">`;
    }

    if (content.video) {
      html += `
        <video controls style="width: 100%; border-radius: 10px; margin-bottom: 1rem;">
          <source src="${content.video.src}" type="${content.video.type}">
          Your browser does not support the video tag.
        </video>
      `;
    }

    if (content.iframe) {
      html += `<iframe src="${content.iframe}" style="width: 100%; height: 500px; border: none; border-radius: 10px; margin-bottom: 1rem;"></iframe>`;
    }

    if (content.description) {
      html += `<p style="margin-bottom: 1rem; line-height: 1.6;">${content.description}</p>`;
    }

    if (content.details && content.details.length > 0) {
      html += this.generateDetailsHTML(content.details);
    }

    if (content.links && content.links.length > 0) {
      html += this.generateLinksHTML(content.links);
    }

    return html;
  }

  private generateDetailsHTML(details: string[]): string {
    let html = '<div style="margin-bottom: 1rem; font-family: monospace; line-height: 1.8;">';

    details.forEach(detail => {
      const trimmedDetail = detail.trim();
      const leadingSpaces = detail.length - detail.trimStart().length;

      if (trimmedDetail === '') {
        html += '<br>';
      } else if (leadingSpaces > 0) {
        const indentLevel = Math.floor(leadingSpaces / 2);
        const indentStyle = `margin-left: ${indentLevel * 1.5}rem;`;

        if (trimmedDetail.startsWith('•')) {
          html += `<div style="${indentStyle} margin-bottom: 0.3rem; color: var(--text-secondary);">${trimmedDetail}</div>`;
        } else {
          html += `<div style="${indentStyle} margin-bottom: 0.3rem; color: var(--text-primary);">${trimmedDetail}</div>`;
        }
      } else {
        if (trimmedDetail.includes('(') && trimmedDetail.includes(')')) {
          html += `<h3 style="color: var(--primary-color); margin: 1.5rem 0 0.8rem 0; font-size: 1.2rem; font-weight: 600;">${trimmedDetail}</h3>`;
        } else if (trimmedDetail.endsWith(':')) {
          html += `<h4 style="color: var(--secondary-color); margin: 1rem 0 0.5rem 0; font-size: 1rem; font-weight: 500;">${trimmedDetail}</h4>`;
        } else {
          html += `<div style="margin-bottom: 0.5rem; color: var(--text-primary);">${trimmedDetail}</div>`;
        }
      }
    });

    html += '</div>';
    return html;
  }

  private generateLinksHTML(links: { text: string; url: string }[]): string {
    let html = '<div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem;">';

    links.forEach(link => {
      const icon =
        link.text.toLowerCase().includes('live') || link.text.toLowerCase().includes('view')
          ? 'fa-external-link-alt'
          : 'fa-code';
      html += `
        <a href="${link.url}" target="_blank" style="
          display: flex; 
          align-items: center; 
          gap: 0.5rem; 
          padding: 0.8rem 1.5rem; 
          background: var(--glass-bg); 
          border: 1px solid var(--glass-border); 
          border-radius: 25px; 
          color: var(--text-primary); 
          text-decoration: none; 
          transition: var(--transition-smooth);
          backdrop-filter: blur(10px);
        " onmouseover="this.style.background='rgba(0, 255, 136, 0.1)'; this.style.borderColor='var(--primary-color)'; this.style.color='var(--primary-color)';" onmouseout="this.style.background='var(--glass-bg)'; this.style.borderColor='var(--glass-border)'; this.style.color='var(--text-primary)';">
          <i class="fas ${icon}"></i>
          ${link.text}
        </a>
      `;
    });

    html += '</div>';
    return html;
  }

  public closeModal(): void {
    const modal = DOMUtils.getElement('modal-overlay') as HTMLElement;
    modal?.classList.remove(CSS_CLASSES.ACTIVE);
    document.body.style.overflow = 'auto';
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

// Global portfolio instance for onclick handlers
declare global {
  interface Window {
    portfolio: Portfolio;
  }
}

// Initialize the portfolio when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.portfolio = new Portfolio();
});

// Handle window resize for canvas elements
window.addEventListener('resize', () => {
  const canvas = document.getElementById('matrix-canvas') as HTMLCanvasElement;
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
});

// Smooth scroll polyfill for older browsers
if (!('scrollBehavior' in document.documentElement.style)) {
  const smoothScrollPolyfill = document.createElement('script');
  smoothScrollPolyfill.src =
    'https://cdn.jsdelivr.net/gh/iamdustan/smoothscroll@master/src/smoothscroll.js';
  document.head.appendChild(smoothScrollPolyfill);
}
