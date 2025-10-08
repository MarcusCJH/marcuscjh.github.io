// Modern Portfolio JavaScript
class ModernPortfolio {
    constructor() {
        this.data = null;
        this.currentSection = 'hero';
        this.isLoading = true;
        this.typedTextIndex = 0;
        this.typedMessages = [];
        
        // Cache DOM elements for better performance
        this.cachedElements = {};
        
        this.init();
    }

    async init() {
        this.showLoading();
        await this.loadData();
        this.initializeComponents();
        this.setupEventListeners();
        this.startAnimations();
        await this.hideLoading();
    }

    // Utility function to get DOM elements with caching
    getElement(id) {
        if (!this.cachedElements[id]) {
            this.cachedElements[id] = document.getElementById(id);
        }
        return this.cachedElements[id];
    }

    // Utility function to get DOM elements by selector
    getElements(selector) {
        return document.querySelectorAll(selector);
    }

    // Debounce function for better performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    showLoading() {
        const progressBar = this.getElement('loading-progress');
        if (!progressBar) return;
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 100) {
                progress = 100;
                clearInterval(interval);
            }
            progressBar.style.width = `${progress}%`;
        }, 100);
    }

    async hideLoading() {
        return new Promise(resolve => {
            setTimeout(() => {
                const loadingScreen = this.getElement('loading-screen');
                if (loadingScreen) {
                    loadingScreen.classList.add('hidden');
                }
                resolve();
            }, 2000);
        });
    }

    async loadData() {
    try {
        const response = await fetch('./assets/data/data.json');
            this.data = await response.json();
        } catch (error) {
            console.error('Failed to load data:', error);
            this.data = { social: [], showcase: [], timeline: [] };
        }
    }

    initializeComponents() {
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

    initMatrixBackground() {
        const canvas = document.getElementById('matrix-canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?';
        const charArray = chars.split('');
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops = Array(Math.floor(columns)).fill(1);

        const drawMatrix = () => {
            ctx.fillStyle = 'rgba(10, 10, 10, 0.04)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#00ff88';
            ctx.font = `${fontSize}px JetBrains Mono`;
            
            for (let i = 0; i < drops.length; i++) {
                const text = charArray[Math.floor(Math.random() * charArray.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        setInterval(drawMatrix, 50);

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    initParticleSystem() {
        const container = document.getElementById('particles-container');
        
        const createParticle = () => {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
            particle.style.animationDelay = Math.random() * 2 + 's';
            
            container.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 6000);
        };

        setInterval(createParticle, 300);
    }

    initHeroContent() {
        if (!this.data.config) return;
        
        // Update hero title
        const heroTitle = document.querySelector('.hero-title');
        if (heroTitle) {
            heroTitle.textContent = this.data.config.name;
            heroTitle.setAttribute('data-text', this.data.config.name);
        }
        
        // Update brand name
        const brandText = document.querySelector('.brand-text');
        if (brandText) {
            brandText.textContent = this.data.config.name;
        }
        
        // Update hero description
        const heroDescriptions = document.querySelectorAll('.hero-description p');
        if (heroDescriptions.length >= 2) {
            heroDescriptions[0].textContent = this.data.config.title;
            heroDescriptions[1].textContent = this.data.config.subtitle;
        }
        
        // Set typed messages
        this.typedMessages = this.data.config.typedMessages || [];
    }

    initNavigation() {
        const navMenu = this.getElement('nav-menu');
        const navToggle = this.getElement('nav-toggle');
        
        if (!this.data.navigation || !navMenu) return;

        // Generate navigation items from data
        navMenu.innerHTML = this.data.navigation
            .filter(nav => nav.enabled)
            .map(nav => `
                <div class="nav-item" id="${nav.id}-nav">
                    <i class="${nav.icon}"></i>
                    <span>${nav.title}</span>
                </div>
            `).join('');

        const navItems = this.getElements('.nav-item');

        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const target = e.currentTarget.id.replace('-nav', '');
                this.navigateToSection(target);
                
                // Close mobile menu
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });

        // Scroll spy for nav background only (debounced for performance)
        const debouncedScrollHandler = this.debounce(() => {
            const scrollY = window.scrollY;
            const nav = document.querySelector('.nav-container');
            nav?.classList.toggle('scrolled', scrollY > 50);
        }, 10);
        
        window.addEventListener('scroll', debouncedScrollHandler);
    }

    toggleSections() {
        if (!this.data.navigation) return;
        
        const enabledSections = this.data.navigation
            .filter(nav => nav.enabled)
            .map(nav => nav.id);
        
        // Hide/show sections based on navigation data
        const allSections = ['timeline', 'showcase', 'cv'];
        
        allSections.forEach(sectionId => {
            const section = document.getElementById(`${sectionId}-section`);
            if (section) {
                if (enabledSections.includes(sectionId)) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            }
        });
    }

    navigateToSection(section) {
        let targetElement;
        
        if (section === 'home') {
            targetElement = document.getElementById('hero-section');
        } else {
            targetElement = document.getElementById(`${section}-section`);
        }
        
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
    }

    initSocialLinks() {
        const socialContainer = document.querySelector('.social-links');
        
        if (this.data.social && socialContainer) {
            socialContainer.innerHTML = this.data.social.map(social => `
                <a href="${social.url}" target="_blank" class="social-link">
                    <i class="${social.icon}"></i>
                </a>
            `).join('');
        }
    }

    initTimeline() {
        const timelineContainer = this.getElement('timeline-items');
        const filterButtons = this.getElements('.filter-btn');
        const searchInput = this.getElement('timeline-search');
        const timelineWrapper = this.getElement('timeline-wrapper');
        
        if (!this.data.timeline || !timelineContainer) return;

        this.currentFilter = 'all';
        this.currentSearch = '';
        this.currentIndex = 0;
        this.filteredItems = [];
        this.isScrolling = false; // Prevent multiple simultaneous scrolls

        const renderTimeline = (filter = 'all', search = '') => {
            this.currentFilter = filter;
            this.currentSearch = search.toLowerCase();
            
            this.filteredItems = this.data.timeline
                .filter(item => {
                    const matchesFilter = filter === 'all' || item.category === filter;
                    const matchesSearch = search === '' || 
                        item.company.toLowerCase().includes(this.currentSearch) ||
                        item.title.toLowerCase().includes(this.currentSearch);
                    return matchesFilter && matchesSearch;
                })
                .sort((a, b) => b.order - a.order); // Sort in reverse chronological order (newest first)

            timelineContainer.innerHTML = this.filteredItems.map((item, index) => `
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

            // Update navigation indicators
            this.updateTimelineIndicators();
            
            // Animate timeline items
            this.animateTimelineItems();
            
            // Update progress bar and navigation buttons
            this.updateTimelineProgress();
            this.updateNavigationButtons();
        };

        // Filter functionality
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderTimeline(btn.dataset.filter, this.currentSearch);
            });
        });

        // Search functionality
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                renderTimeline(this.currentFilter, e.target.value);
            });
        }

        // Drag-to-scroll functionality for desktop
        this.initDragToScroll();

        // Scroll progress tracking (debounced for performance)
        if (timelineWrapper) {
            const debouncedTimelineScroll = this.debounce(() => {
                this.updateTimelineProgress();
                this.updateNavigationButtons();
            }, 16); // ~60fps
            
            timelineWrapper.addEventListener('scroll', debouncedTimelineScroll);
        }

        // Keyboard navigation removed for drag-to-scroll experience

        // Touch/swipe support for mobile
        this.initTimelineTouchSupport();

        // Handle window resize for responsive behavior (debounced for performance)
        const debouncedResize = this.debounce(() => {
            this.updateNavigationButtons();
            this.updateTimelineProgress();
        }, 250);
        
        window.addEventListener('resize', debouncedResize);

        renderTimeline();
    }

    navigateTimeline(direction) {
        if (this.isScrolling) return;

        const timelineWrapper = document.getElementById('timeline-wrapper');
        if (!timelineWrapper) return;

        const scrollLeft = timelineWrapper.scrollLeft;
        const maxScroll = timelineWrapper.scrollWidth - timelineWrapper.clientWidth;
        const itemWidth = 300;
        const targetScroll = scrollLeft + (direction * itemWidth);

        // Check bounds
        if (targetScroll < 0 || targetScroll > maxScroll) return;

        this.isScrolling = true;
        
        // Visual feedback
        const prevBtn = document.getElementById('timeline-prev');
        const nextBtn = document.getElementById('timeline-next');
        if (prevBtn) prevBtn.classList.add('scrolling');
        if (nextBtn) nextBtn.classList.add('scrolling');
        
        timelineWrapper.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        });

        setTimeout(() => {
            this.isScrolling = false;
            if (prevBtn) prevBtn.classList.remove('scrolling');
            if (nextBtn) nextBtn.classList.remove('scrolling');
            this.updateNavigationButtons();
        }, 500);
    }

    updateTimelineIndicators() {
        const indicatorContainer = document.getElementById('timeline-indicator');
        if (!indicatorContainer) return;

        const totalItems = this.filteredItems.length;
        const itemsPerPage = Math.floor(window.innerWidth / 300); // Approximate items visible
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        indicatorContainer.innerHTML = Array.from({ length: totalPages }, (_, index) => 
            `<div class="timeline-dot-indicator" data-page="${index}"></div>`
        ).join('');

        // Add click handlers to indicators
        indicatorContainer.querySelectorAll('.timeline-dot-indicator').forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                this.scrollToTimelinePage(index);
            });
        });
    }

    scrollToTimelinePage(pageIndex) {
        // Prevent multiple simultaneous scroll operations
        if (this.isScrolling) {
            return;
        }

        const timelineWrapper = document.getElementById('timeline-wrapper');
        const itemWidth = 280;
        const itemsPerPage = Math.floor(window.innerWidth / 300);
        const scrollPosition = pageIndex * itemsPerPage * itemWidth;
        
        if (timelineWrapper) {
            this.isScrolling = true;
            
            timelineWrapper.scrollTo({
                left: scrollPosition,
                behavior: 'smooth'
            });

            // Reset scroll lock after animation completes
            setTimeout(() => {
                this.isScrolling = false;
            }, 500);
        }
    }

    updateTimelineProgress() {
        const timelineWrapper = this.getElement('timeline-wrapper');
        const progressBar = this.getElement('timeline-progress');
        
        if (!timelineWrapper || !progressBar) return;

        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // Vertical progress for mobile
            const scrollTop = timelineWrapper.scrollTop;
            const scrollHeight = timelineWrapper.scrollHeight - timelineWrapper.clientHeight;
            const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            
            progressBar.style.height = `${progress}%`;
            progressBar.style.width = '2px';
        } else {
            // Horizontal progress for desktop/tablet
            const scrollLeft = timelineWrapper.scrollLeft;
            const scrollWidth = timelineWrapper.scrollWidth - timelineWrapper.clientWidth;
            const progress = scrollWidth > 0 ? (scrollLeft / scrollWidth) * 100 : 0;
            
            progressBar.style.width = `${progress}%`;
            progressBar.style.height = '4px';
        }
    }

    updateNavigationButtons() {
        // Navigation buttons are hidden - no need to update them
        // This function is kept for compatibility but does nothing
    }

    initDragToScroll() {
        const timelineWrapper = this.getElement('timeline-wrapper');
        if (!timelineWrapper) return;

        let isDragging = false;
        let startX = 0;
        let scrollLeft = 0;

        // Mouse events for desktop
        timelineWrapper.addEventListener('mousedown', (e) => {
            if (window.innerWidth <= 768) return; // Only on desktop
            
            isDragging = true;
            timelineWrapper.style.cursor = 'grabbing';
            timelineWrapper.style.userSelect = 'none';
            
            startX = e.pageX - timelineWrapper.offsetLeft;
            scrollLeft = timelineWrapper.scrollLeft;
            
            e.preventDefault();
        });

        timelineWrapper.addEventListener('mouseleave', () => {
            isDragging = false;
            timelineWrapper.style.cursor = 'grab';
            timelineWrapper.style.userSelect = 'auto';
        });

        timelineWrapper.addEventListener('mouseup', () => {
            isDragging = false;
            timelineWrapper.style.cursor = 'grab';
            timelineWrapper.style.userSelect = 'auto';
        });

        timelineWrapper.addEventListener('mousemove', (e) => {
            if (!isDragging || window.innerWidth <= 768) return;
            
            e.preventDefault();
            const x = e.pageX - timelineWrapper.offsetLeft;
            const walk = (x - startX) * 2; // Scroll speed multiplier
            timelineWrapper.scrollLeft = scrollLeft - walk;
        });

        // Set initial cursor
        timelineWrapper.style.cursor = 'grab';
    }

    initTimelineTouchSupport() {
        const timelineWrapper = this.getElement('timeline-wrapper');
        if (!timelineWrapper) return;

        let startX = 0;
        let startY = 0;
        let isScrolling = false;

        timelineWrapper.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isScrolling = false;
        });

        timelineWrapper.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;

            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = Math.abs(startX - currentX);
            const diffY = Math.abs(startY - currentY);

            if (diffX > diffY) {
                isScrolling = true;
            }
        });

        timelineWrapper.addEventListener('touchend', (e) => {
            if (!isScrolling) return;

            const endX = e.changedTouches[0].clientX;
            const diffX = startX - endX;

            if (Math.abs(diffX) > 50) { // Minimum swipe distance
                if (diffX > 0) {
                    this.navigateTimeline(1); // Swipe left - go forward
                } else {
                    this.navigateTimeline(-1); // Swipe right - go backward
                }
            }

            startX = 0;
            startY = 0;
            isScrolling = false;
        });
    }

    initShowcase() {
        const showcaseContainer = this.getElement('showcase-grid');
        
        if (!this.data.showcase || !showcaseContainer) return;

        showcaseContainer.innerHTML = this.data.showcase.map(project => `
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

    initTypedText() {
        const typedElement = this.getElement('typed-text');
        if (!typedElement) return;
        
        let messageIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        const typeText = () => {
            const currentMessage = this.typedMessages[messageIndex];
            
            if (isDeleting) {
                typedElement.textContent = currentMessage.substring(0, charIndex - 1);
                charIndex--;
            } else {
                typedElement.textContent = currentMessage.substring(0, charIndex + 1);
                charIndex++;
            }

            let typeSpeed = isDeleting ? 50 : 100;

            if (!isDeleting && charIndex === currentMessage.length) {
                typeSpeed = 2000;
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                messageIndex = (messageIndex + 1) % this.typedMessages.length;
                typeSpeed = 500;
            }

            setTimeout(typeText, typeSpeed);
        };

        typeText();
    }

    initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        // Observe timeline items and showcase cards
        [...this.getElements('.timeline-item'), ...this.getElements('.showcase-card')]
            .forEach(element => observer.observe(element));
    }

    animateTimelineItems() {
        this.getElements('.timeline-item').forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('visible');
            }, index * 200);
        });
    }

    setupEventListeners() {
        // CV Preview click
        const cvPreview = this.getElement('cv-preview');
        cvPreview?.addEventListener('click', () => this.openCVModal());

        // Scroll indicator
        const scrollArrow = document.querySelector('.scroll-arrow');
        scrollArrow?.addEventListener('click', () => {
            this.getElement('timeline-section')?.scrollIntoView({ behavior: 'smooth' });
        });

        // Modal close
        const modalClose = this.getElement('modal-close');
        const modalOverlay = this.getElement('modal-overlay');
        
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

    startAnimations() {
        // Start fade-in animations for hero content
        this.getElements('.fade-in-up').forEach((element, index) => {
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * 200);
        });
    }

    openModal(title, data) {
        const modal = this.getElement('modal-overlay');
        const modalTitle = this.getElement('modal-title');
        const modalContent = this.getElement('modal-content');

        let parsedData;
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

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    openCVModal() {
        const cvDriveId = this.data.config?.cvDriveId || '16eXxJWLCsUib7gZKX48jhT85myOxqh0_';
        const modalContent = {
            title: 'Resume / CV',
            description: 'View my complete resume and professional background.',
            iframe: `https://drive.google.com/file/d/${cvDriveId}/preview`
        };

        this.openModal('Resume', { modalContent });
    }

    generateModalContent(content) {
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
                // Check if line starts with spaces for indentation
                const trimmedDetail = detail.trim();
                const leadingSpaces = detail.length - detail.trimStart().length;
                
                if (trimmedDetail === '') {
                    // Empty line for spacing
                    html += '<br>';
                } else if (leadingSpaces > 0) {
                    // Indented line - preserve indentation
                    const indentLevel = Math.floor(leadingSpaces / 2); // Every 2 spaces = 1 indent level
                    const indentStyle = `margin-left: ${indentLevel * 1.5}rem;`;
                    
                    if (trimmedDetail.startsWith('•')) {
                        // Bullet point with indentation
                        html += `<div style="${indentStyle} margin-bottom: 0.3rem; color: var(--text-secondary);">${trimmedDetail}</div>`;
                    } else {
                        // Regular indented text
                        html += `<div style="${indentStyle} margin-bottom: 0.3rem; color: var(--text-primary);">${trimmedDetail}</div>`;
                    }
                } else {
                    // Non-indented line (role titles, main descriptions)
                    if (trimmedDetail.includes('(') && trimmedDetail.includes(')')) {
                        // Role title - make it stand out
                        html += `<h3 style="color: var(--primary-color); margin: 1.5rem 0 0.8rem 0; font-size: 1.2rem; font-weight: 600;">${trimmedDetail}</h3>`;
                    } else if (trimmedDetail.endsWith(':')) {
                        // Section header
                        html += `<h4 style="color: var(--secondary-color); margin: 1rem 0 0.5rem 0; font-size: 1rem; font-weight: 500;">${trimmedDetail}</h4>`;
                    } else {
                        // Regular description
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

    closeModal() {
        const modal = this.getElement('modal-overlay');
        modal?.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    getTimelineIcon(category) {
        const icons = {
            work: 'fas fa-briefcase',
            education: 'fas fa-graduation-cap',
            certification: 'fas fa-certificate'
        };
        return icons[category] || 'fas fa-circle';
    }
}

// Initialize the portfolio when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.portfolio = new ModernPortfolio();
});

// Handle window resize
window.addEventListener('resize', () => {
    const canvas = document.getElementById('matrix-canvas');
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