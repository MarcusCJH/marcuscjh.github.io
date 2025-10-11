// Import CSS for Vite
import './styles/style.css';

// Import services and components
import { DataService } from './services/dataService';
import { LoadingService } from './services/loadingService';
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
  DragState,
  TouchState
} from './types';

// Modern Portfolio TypeScript Class
class ModernPortfolio {
  private dataService: DataService;
  private loadingService: LoadingService;
  // Component instances (initialized but not directly accessed)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _matrixBackground: MatrixBackground | null = null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _particleSystem: ParticleSystem | null = null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _typedText: TypedText | null = null;
  
  // State management
  private timelineState: TimelineState = {
    currentFilter: 'all',
    currentSearch: '',
    currentIndex: 0,
    filteredItems: [],
    isScrolling: false
  };
  
  private dragState: DragState = {
    isDragging: false,
    startX: 0,
    scrollLeft: 0
  };
  
  private touchState: TouchState = {
    startX: 0,
    startY: 0,
    isScrolling: false
  };

  constructor() {
    this.dataService = DataService.getInstance();
    this.loadingService = LoadingService.getInstance();
    
    // Hide main content initially
    this.hideMainContent();
    
    this.init();
  }

  private async init(): Promise<void> {
    this.loadingService.startLoading();
    
    // Start loading data and components in parallel
    const dataPromise = this.dataService.loadData();
    const minLoadingTime = APP_CONFIG.MIN_LOADING_TIME;
    const startTime = Date.now();
    
    // Wait for data to load
    await dataPromise;
    
    // Initialize components
    this.initializeComponents();
    this.setupEventListeners();
    this.startAnimations();
    
    // Ensure minimum loading time has passed
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
    
    if (remainingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, remainingTime));
    }
    
    // Only hide loading after everything is ready and minimum time has passed
    this.loadingService.completeLoading();
  }

  // Hide main content initially to prevent flash
  private hideMainContent(): void {
    const mainContainer = document.querySelector(SELECTORS.MAIN_CONTAINER) as HTMLElement;
    if (mainContainer) {
      mainContainer.style.opacity = '0';
      mainContainer.style.visibility = 'hidden';
      mainContainer.style.transition = 'opacity 0.3s ease, visibility 0.3s ease';
    }
  }

  private initializeComponents(): void {
    this.initMatrixBackground();
    this.initParticleSystem();
    this.initHeroContent();
    this.initNavigation();
    this.initSocialLinks();
    this.initTimeline();
    this.initShowcase();
    this.initTypedText();
    this.initScrollAnimations();
    this.toggleSections();
  }

  private initMatrixBackground(): void {
    this._matrixBackground = new MatrixBackground();
  }

  private initParticleSystem(): void {
    this._particleSystem = new ParticleSystem();
  }

  private initHeroContent(): void {
    const config = this.dataService.getConfig();
    if (!config) return;
    
    // Update hero title
    const heroTitle = document.querySelector('.hero-title') as HTMLElement;
    if (heroTitle) {
      heroTitle.textContent = config.name;
      heroTitle.setAttribute('data-text', config.name);
    }
    
    // Update brand name
    const brandText = document.querySelector('.brand-text') as HTMLElement;
    if (brandText) {
      brandText.textContent = config.name;
    }
    
    // Update hero description
    const heroDescriptions = document.querySelectorAll('.hero-description p');
    if (heroDescriptions.length >= 2) {
      (heroDescriptions[0] as HTMLElement).textContent = config.title;
      (heroDescriptions[1] as HTMLElement).textContent = config.subtitle;
    }
  }

  private initNavigation(): void {
    const navMenu = DOMUtils.getElement('nav-menu') as HTMLElement;
    const navToggle = DOMUtils.getElement('nav-toggle') as HTMLElement;
    const navigation = this.dataService.getNavigation();
    
    if (!navigation || !navMenu) return;

    // Generate navigation items from data
    navMenu.innerHTML = navigation
      .filter(nav => nav.enabled)
      .map(nav => `
        <div class="nav-item" id="${nav.id}-nav">
          <i class="${nav.icon}"></i>
          <span>${nav.title}</span>
        </div>
      `).join('');

    const navItems = DOMUtils.getElements('.nav-item');

    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle(CSS_CLASSES.ACTIVE);
      navMenu.classList.toggle(CSS_CLASSES.ACTIVE);
    });

    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const target = (e.currentTarget as HTMLElement).id.replace('-nav', '');
        this.navigateToSection(target);
        
        // Close mobile menu
        navToggle.classList.remove(CSS_CLASSES.ACTIVE);
        navMenu.classList.remove(CSS_CLASSES.ACTIVE);
      });
    });

    // Scroll spy for nav background only (debounced for performance)
    const debouncedScrollHandler = debounce(() => {
      const scrollY = window.scrollY;
      const nav = document.querySelector(SELECTORS.NAV_CONTAINER) as HTMLElement;
      nav?.classList.toggle(CSS_CLASSES.SCROLLED, scrollY > 50);
    }, APP_CONFIG.DEBOUNCE_DELAY);
    
    window.addEventListener('scroll', debouncedScrollHandler);
  }

  private toggleSections(): void {
    const navigation = this.dataService.getNavigation();
    if (!navigation) return;
    
    const enabledSections = navigation
      .filter(nav => nav.enabled)
      .map(nav => nav.id);
    
    // Hide/show sections based on navigation data
    const allSections = ['timeline', 'showcase', 'cv'];
    
    allSections.forEach(sectionId => {
      const section = document.getElementById(`${sectionId}-section`) as HTMLElement;
      if (section) {
        if (enabledSections.includes(sectionId)) {
          section.style.display = 'block';
        } else {
          section.style.display = 'none';
        }
      }
    });
  }

  private navigateToSection(section: string): void {
    let targetElement: HTMLElement | null;
    
    if (section === 'home') {
      targetElement = document.getElementById('hero-section');
    } else {
      targetElement = document.getElementById(`${section}-section`);
    }
    
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  private initSocialLinks(): void {
    const socialContainer = document.querySelector('.social-links') as HTMLElement;
    const socialLinks = this.dataService.getSocialLinks();
    
    if (socialLinks && socialContainer) { 
      socialContainer.innerHTML = socialLinks.map(social => `
        <a href="${social.url}" target="_blank" class="social-link">
          <i class="${social.icon}"></i>
        </a>
      `).join('');
    }
  }

  private initTimeline(): void {
    const timelineContainer = DOMUtils.getElement('timeline-items') as HTMLElement;
    const filterButtons = DOMUtils.getElements('.filter-btn');
    const searchInput = DOMUtils.getElement('timeline-search') as HTMLInputElement;
    const timelineWrapper = DOMUtils.getElement('timeline-wrapper') as HTMLElement;
    const timeline = this.dataService.getTimeline();
    
    if (!timeline || !timelineContainer) return;

    this.timelineState.currentFilter = 'all';
    this.timelineState.currentSearch = '';
    this.timelineState.currentIndex = 0;
    this.timelineState.filteredItems = [];
    this.timelineState.isScrolling = false;

    const renderTimeline = (filter: string = 'all', search: string = ''): void => {
      this.timelineState.currentFilter = filter;
      this.timelineState.currentSearch = search.toLowerCase();
      
      this.timelineState.filteredItems = timeline
        .filter(item => {
          const matchesFilter = filter === 'all' || item.category === filter;
          const matchesSearch = search === '' || 
            item.company.toLowerCase().includes(this.timelineState.currentSearch) ||
            item.title.toLowerCase().includes(this.timelineState.currentSearch);
          return matchesFilter && matchesSearch;
        })
        .sort((a, b) => b.order - a.order);

      timelineContainer.innerHTML = this.timelineState.filteredItems.map((item, index) => `
        <div class="timeline-item" data-category="${item.category}" data-index="${index}" onclick="portfolio.openModal('${item.company}', ${JSON.stringify(item).replace(/"/g, '&quot;')})">
          <div class="timeline-dot ${item.category}">
            <i class="${this.getTimelineIcon(item.category)}"></i>
          </div>
          <div class="timeline-content">
            <div class="timeline-date">${item.startDate}${item.endDate ? ` - ${item.endDate}` : ''}</div>
            <h3>${item.company}</h3>
            <p>${item.title}</p>
          </div>
        </div>
      `).join('');

      this.updateTimelineIndicators();
      this.animateTimelineItems();
      this.updateTimelineProgress();
    };

    // Filter functionality
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove(CSS_CLASSES.ACTIVE));
        btn.classList.add(CSS_CLASSES.ACTIVE);
        renderTimeline((btn as HTMLElement).dataset.filter || 'all', this.timelineState.currentSearch);
      });
    });

    // Search functionality
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        renderTimeline(this.timelineState.currentFilter, (e.target as HTMLInputElement).value);
      });
    }

    // Drag-to-scroll functionality for desktop
    this.initDragToScroll();

    // Scroll progress tracking (debounced for performance)
    if (timelineWrapper) {
      const debouncedTimelineScroll = debounce(() => {
        this.updateTimelineProgress();
      }, APP_CONFIG.THROTTLE_DELAY);
      
      timelineWrapper.addEventListener('scroll', debouncedTimelineScroll);
    }

    // Touch/swipe support for mobile
    this.initTimelineTouchSupport();

    // Handle window resize for responsive behavior (debounced for performance)
    const debouncedResize = debounce(() => {
      this.updateTimelineProgress();
    }, 250);
    
    window.addEventListener('resize', debouncedResize);

    renderTimeline();
  }

  private navigateTimeline(direction: number): void {
    if (this.timelineState.isScrolling) return;

    const timelineWrapper = document.getElementById('timeline-wrapper') as HTMLElement;
    if (!timelineWrapper) return;

    const scrollLeft = timelineWrapper.scrollLeft;
    const maxScroll = timelineWrapper.scrollWidth - timelineWrapper.clientWidth;
    const itemWidth = 300;
    const targetScroll = scrollLeft + (direction * itemWidth);

    if (targetScroll < 0 || targetScroll > maxScroll) return;

    this.timelineState.isScrolling = true;
    
    timelineWrapper.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });

    setTimeout(() => {
      this.timelineState.isScrolling = false;
    }, 500);
  }

  private updateTimelineIndicators(): void {
    const indicatorContainer = document.getElementById('timeline-indicator') as HTMLElement;
    if (!indicatorContainer) return;

    const totalItems = this.timelineState.filteredItems.length;
    const itemsPerPage = Math.floor(window.innerWidth / 300);
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    indicatorContainer.innerHTML = Array.from({ length: totalPages }, (_, index) => 
      `<div class="timeline-dot-indicator" data-page="${index}"></div>`
    ).join('');

    indicatorContainer.querySelectorAll('.timeline-dot-indicator').forEach((indicator, index) => {
      indicator.addEventListener('click', () => {
        this.scrollToTimelinePage(index);
      });
    });
  }

  private scrollToTimelinePage(pageIndex: number): void {
    if (this.timelineState.isScrolling) return;

    const timelineWrapper = document.getElementById('timeline-wrapper') as HTMLElement;
    const itemWidth = 280;
    const itemsPerPage = Math.floor(window.innerWidth / 300);
    const scrollPosition = pageIndex * itemsPerPage * itemWidth;
    
    if (timelineWrapper) {
      this.timelineState.isScrolling = true;
      
      timelineWrapper.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });

      setTimeout(() => {
        this.timelineState.isScrolling = false;
      }, 500);
    }
  }

  private updateTimelineProgress(): void {
    const timelineWrapper = DOMUtils.getElement('timeline-wrapper') as HTMLElement;
    const progressBar = DOMUtils.getElement('timeline-progress') as HTMLElement;
    
    if (!timelineWrapper || !progressBar) return;

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

  private initDragToScroll(): void {
    const timelineWrapper = DOMUtils.getElement('timeline-wrapper') as HTMLElement;
    if (!timelineWrapper) return;

    timelineWrapper.addEventListener('mousedown', (e) => {
      if (window.innerWidth <= 768) return;
      
      this.dragState.isDragging = true;
      timelineWrapper.style.cursor = 'grabbing';
      timelineWrapper.style.userSelect = 'none';
      
      this.dragState.startX = e.pageX - timelineWrapper.offsetLeft;
      this.dragState.scrollLeft = timelineWrapper.scrollLeft;
      
      e.preventDefault();
    });

    timelineWrapper.addEventListener('mouseleave', () => {
      this.dragState.isDragging = false;
      timelineWrapper.style.cursor = 'grab';
      timelineWrapper.style.userSelect = 'auto';
    });

    timelineWrapper.addEventListener('mouseup', () => {
      this.dragState.isDragging = false;
      timelineWrapper.style.cursor = 'grab';
      timelineWrapper.style.userSelect = 'auto';
    });

    timelineWrapper.addEventListener('mousemove', (e) => {
      if (!this.dragState.isDragging || window.innerWidth <= 768) return;
      
      e.preventDefault();
      const x = e.pageX - timelineWrapper.offsetLeft;
      const walk = (x - this.dragState.startX) * 2;
      timelineWrapper.scrollLeft = this.dragState.scrollLeft - walk;
    });

    timelineWrapper.style.cursor = 'grab';
  }

  private initTimelineTouchSupport(): void {
    const timelineWrapper = DOMUtils.getElement('timeline-wrapper') as HTMLElement;
    if (!timelineWrapper) return;

    timelineWrapper.addEventListener('touchstart', (e) => {
      this.touchState.startX = e.touches[0].clientX;
      this.touchState.startY = e.touches[0].clientY;
      this.touchState.isScrolling = false;
    });

    timelineWrapper.addEventListener('touchmove', (e) => {
      if (!this.touchState.startX || !this.touchState.startY) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = Math.abs(this.touchState.startX - currentX);
      const diffY = Math.abs(this.touchState.startY - currentY);

      if (diffX > diffY) {
        this.touchState.isScrolling = true;
      }
    });

    timelineWrapper.addEventListener('touchend', (e) => {
      if (!this.touchState.isScrolling) return;

      const endX = e.changedTouches[0].clientX;
      const diffX = this.touchState.startX - endX;

      if (Math.abs(diffX) > 50) {
        if (diffX > 0) {
          this.navigateTimeline(1);
        } else {
          this.navigateTimeline(-1);
        }
      }

      this.touchState.startX = 0;
      this.touchState.startY = 0;
      this.touchState.isScrolling = false;
    });
  }

  private initShowcase(): void {
    const showcaseContainer = DOMUtils.getElement('showcase-grid') as HTMLElement;
    const showcase = this.dataService.getShowcase();
    
    if (!showcase || !showcaseContainer) return;

    showcaseContainer.innerHTML = showcase.map(project => `
      <div class="showcase-card" onclick="portfolio.openModal('${project.id}', ${JSON.stringify(project).replace(/"/g, '&quot;')})">
        <div class="showcase-image" style="background-image: url('${project.backgroundImage}')">
          <div class="showcase-overlay"></div>
        </div>
        <div class="showcase-content">
          <h3 class="showcase-title">${project.title}</h3>
          ${project.technologies ? `
            <div class="tech-stack">
              ${project.technologies.map(tech => `<span class="tech-badge">${tech}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  private initTypedText(): void {
    const config = this.dataService.getConfig();
    if (config?.typedMessages) {
      this._typedText = new TypedText(config.typedMessages);
    }
  }

  private initScrollAnimations(): void {
    const observerOptions: IntersectionObserverInit = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(CSS_CLASSES.VISIBLE);
        }
      });
    }, observerOptions);

    [...DOMUtils.getElements('.timeline-item'), ...DOMUtils.getElements('.showcase-card')]
      .forEach(element => observer.observe(element));
  }

  private animateTimelineItems(): void {
    DOMUtils.getElements('.timeline-item').forEach((item, index) => {
      setTimeout(() => {
        item.classList.add(CSS_CLASSES.VISIBLE);
      }, index * APP_CONFIG.ANIMATION_DELAY);
    });
  }

  private setupEventListeners(): void {
    // CV Preview click
    const cvPreview = DOMUtils.getElement('cv-preview') as HTMLElement;
    cvPreview?.addEventListener('click', () => this.openCVModal());

    // Scroll indicator
    const scrollArrow = document.querySelector('.scroll-arrow') as HTMLElement;
    scrollArrow?.addEventListener('click', () => {
      DOMUtils.getElement('timeline-section')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Modal close
    const modalClose = DOMUtils.getElement('modal-close') as HTMLElement;
    const modalOverlay = DOMUtils.getElement('modal-overlay') as HTMLElement;
    
    modalClose?.addEventListener('click', () => this.closeModal());
    
    modalOverlay?.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        this.closeModal();
      }
    });

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
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

    let parsedData: TimelineItem | ShowcaseProject;
    try {
      parsedData = typeof data === 'string' ? JSON.parse(data.replace(/&quot;/g, '"')) : data;
    } catch (e) {
      console.error('Error parsing modal data:', e);
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
    const config = this.dataService.getConfig();
    const cvDriveId = config?.cvDriveId || '16eXxJWLCsUib7gZKX48jhT85myOxqh0_';
    const modalContent: ModalContent = {
      title: 'Resume / CV',
      description: 'View my complete resume and professional background.',
      iframe: `https://drive.google.com/file/d/${cvDriveId}/preview`
    };

    // Create a temporary project object for the modal
    const tempProject: ShowcaseProject = {
      id: 'cv',
      title: 'Resume / CV',
      backgroundImage: '',
      modalContent
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
      html += '<div style="margin-bottom: 1rem; font-family: monospace; line-height: 1.8;">';
      content.details.forEach(detail => {
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
    }
    
    if (content.links && content.links.length > 0) {
      html += '<div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem;">';
      content.links.forEach(link => {
        const icon = link.text.toLowerCase().includes('live') || link.text.toLowerCase().includes('view') ? 'fa-external-link-alt' : 'fa-code';
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
    }
    
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
      certification: 'fas fa-certificate'
    };
    return icons[category] || 'fas fa-circle';
  }
}

// Global portfolio instance for onclick handlers
declare global {
  interface Window {
    portfolio: ModernPortfolio;
  }
}

// Initialize the portfolio when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.portfolio = new ModernPortfolio();
});

// Handle window resize
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
  smoothScrollPolyfill.src = 'https://cdn.jsdelivr.net/gh/iamdustan/smoothscroll@master/src/smoothscroll.js';
  document.head.appendChild(smoothScrollPolyfill);
}