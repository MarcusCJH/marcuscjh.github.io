// Modern Portfolio JavaScript
class ModernPortfolio {
    constructor() {
        this.data = null;
        this.currentSection = 'hero';
        this.isLoading = true;
        this.typedTextIndex = 0;
        this.typedMessages = [];
        
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

    showLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        const progressBar = document.getElementById('loading-progress');
        
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
                const loadingScreen = document.getElementById('loading-screen');
                loadingScreen.classList.add('hidden');
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
        const navMenu = document.getElementById('nav-menu');
        const navToggle = document.getElementById('nav-toggle');
        
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

        const navItems = document.querySelectorAll('.nav-item');

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

        // Scroll spy for nav background only
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            
            // Add scrolled class to nav
            const nav = document.querySelector('.nav-container');
            if (scrollY > 50) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        });
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
        const timelineContainer = document.getElementById('timeline-items');
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        if (!this.data.timeline || !timelineContainer) return;

        const renderTimeline = (filter = 'all') => {
            const filteredItems = this.data.timeline
                .filter(item => filter === 'all' || item.category === filter)
                .sort((a, b) => b.order - a.order);

            timelineContainer.innerHTML = filteredItems.map(item => `
                <div class="timeline-item" data-category="${item.category}" onclick="portfolio.openModal('${item.company}', ${JSON.stringify(item).replace(/"/g, '&quot;')})">
                    <div class="timeline-dot">
                        <i class="${this.getTimelineIcon(item.category)}"></i>
                </div>
                    <div class="timeline-content">
                        <div class="timeline-date">${item.startDate}${item.endDate ? ` - ${item.endDate}` : ''}</div>
                        <h3>${item.company}</h3>
                        <p>${item.title}</p>
            </div>
        </div>
    `).join('');

            // Animate timeline items
            this.animateTimelineItems();
        };

        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                renderTimeline(btn.dataset.filter);
            });
        });

        renderTimeline();
    }

    initShowcase() {
        const showcaseContainer = document.getElementById('showcase-grid');
        
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
        const typedElement = document.getElementById('typed-text');
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

        // Observe timeline items
        document.querySelectorAll('.timeline-item').forEach(item => {
            observer.observe(item);
        });

        // Observe showcase cards
        document.querySelectorAll('.showcase-card').forEach(card => {
            observer.observe(card);
        });
    }

    animateTimelineItems() {
        const timelineItems = document.querySelectorAll('.timeline-item');
        timelineItems.forEach((item, index) => {
            setTimeout(() => {
            item.classList.add('visible');
            }, index * 200);
        });
    }

    setupEventListeners() {
        // CV Preview click
        const cvPreview = document.getElementById('cv-preview');
        if (cvPreview) {
            cvPreview.addEventListener('click', () => {
                this.openCVModal();
            });
        }

        // Scroll indicator
        const scrollArrow = document.querySelector('.scroll-arrow');
        if (scrollArrow) {
            scrollArrow.addEventListener('click', () => {
                document.getElementById('timeline-section').scrollIntoView({ behavior: 'smooth' });
            });
        }

        // Modal close
        const modalClose = document.getElementById('modal-close');
        const modalOverlay = document.getElementById('modal-overlay');
        
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }
        
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.closeModal();
                }
            });
        }

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    startAnimations() {
        // Start fade-in animations for hero content
        const fadeElements = document.querySelectorAll('.fade-in-up');
        fadeElements.forEach((element, index) => {
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * 200);
        });
    }

    openModal(title, data) {
        const modal = document.getElementById('modal-overlay');
        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content');

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
            html += '<ul style="margin-bottom: 1rem; padding-left: 1rem;">';
            content.details.forEach(detail => {
                html += `<li style="margin-bottom: 0.5rem;">${detail}</li>`;
            });
            html += '</ul>';
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
        const modal = document.getElementById('modal-overlay');
        modal.classList.remove('active');
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