// DOM Elements
// const contact = document.querySelector('#contact');
// const contactContent = document.querySelector('#contact-content');
const showcase = document.querySelector('#showcase');
const showcaseContent = document.querySelector('#showcase-content');
const cv = document.querySelector('#cv');
const cvContent = document.querySelector('#cv-content');
const timeline = document.querySelector('#timeline');
const timelineContent = document.querySelector('#timeline-content');

// Configuration
const CV_DRIVE_ID = '16eXxJWLCsUib7gZKX48jhT85myOxqh0_';
const WINBOX_COLORS = {
    active: '#00aa00',
    inactive: '#777'
};

// State Management
let winBoxStack = [];
let globalTimelineData = [];
let currentFilter = 'all';

// WinBox Management
function openWinBox(title, mountContent, width = '100%', height = '100%', top = 'center', right = 'center', bottom = 'center', left = 'center') {
    let newWinBox = new WinBox({
        title,
        width,
        height,
        top,
        right,
        bottom,
        left,
        mount: mountContent,
        modal: true,
        onfocus: function() {
            this.setBackground(WINBOX_COLORS.active);
        },
        onblur: function() {
            this.setBackground(WINBOX_COLORS.inactive);
        },
        onclose: function() {
            winBoxStack = winBoxStack.filter(wb => wb !== newWinBox);
            if (winBoxStack.length > 0) {
                winBoxStack[winBoxStack.length - 1].focus();
            }
        }
    });
    winBoxStack.push(newWinBox);
    return newWinBox;
}

// Event Listeners
showcase.addEventListener('click', () => openWinBox('Showcase', showcaseContent));
timeline.addEventListener('click', () => openWinBox('Timeline', timelineContent));
// contact.addEventListener('click', () => {
//     openWinBox('Contact Me', contactContent);
// });
cv.addEventListener('click', () => {
    openWinBox('Curriculum Vitae', cvContent);
    const pdfIframe = document.createElement('iframe');
    pdfIframe.src = `https://drive.google.com/file/d/${CV_DRIVE_ID}/preview`;
    Object.assign(pdfIframe.style, {
        width: '100%',
        height: '90%',
        border: 'none'
    });
    
    const container = document.getElementById('cv-pdf-container');
    container.innerHTML = '';
    container.appendChild(pdfIframe);
});

// Data Loading and Initialization
async function loadPortfolioData() {
    try {
        const response = await fetch('./data/data.json');
        if (!response.ok) {
            throw new Error(`Failed to load portfolio data (Status: ${response.status})`);
        }
        
        const data = await response.json();
        initializePortfolio(data);
    } catch (error) {
        handleError('Failed to load portfolio data', error);
    }
}

function initializePortfolio(data) {
    globalTimelineData = data.timeline;
    initializeSocialLinks(data.social);
    filterAndDisplayTimeline('all');
    initializeNavigation(data.navigation);
    if (data.showcase) {
        initializeShowcase(data.showcase);
    }
    setupFilterButtons();
}

function handleError(message, error) {
    console.error(message, error);
    document.querySelector('.social-icons').innerHTML = 
        `<li>${message}. Please refresh the page or try again later.</li>`;
}

function initializeShowcase(showcaseData) {
    const showcaseContainer = document.querySelector('.showcase-grid');
    if (!showcaseContainer) return;

    showcaseContainer.innerHTML = showcaseData.map(project => `
        <div class="showcase-box" 
             style="background-image: url('${project.backgroundImage}');"
             onclick="openModal('${project.id}')">
            <div class="showcase-content">
                <h4>${project.title}</h4>
                ${project.technologies ? 
                    `<div class="tech-stack">
                        ${project.technologies.map(tech => 
                            `<span class="tech-badge">${tech}</span>`
                        ).join('')}
                    </div>` : ''
                }
            </div>
            <div id="${project.id}" style="display: none;">
                <div class="modal-header">
                    <h1>${project.modalContent.title}</h1>
                    ${project.technologies ? 
                        `<div class="tech-stack">
                            ${project.technologies.map(tech => 
                                `<span class="tech-badge">${tech}</span>`
                            ).join('')}
                        </div>` : ''
                    }
                </div>
                <div class="modal-content">
                    ${project.modalContent.image ? 
                        `<div class="modal-image">
                            <img src="${project.modalContent.image}" alt="${project.title}">
                        </div>` : ''}
                    ${project.modalContent.video ? 
                        `<div class="modal-video">
                            <video width="100%" controls>
                                <source src="${project.modalContent.video.src}" type="${project.modalContent.video.type}">
                            </video>
                        </div>` : ''}
                    <div class="modal-description">
                        <p>${project.modalContent.description}</p>
                        ${project.modalContent.links ? 
                            `<div class="modal-links">
                                ${project.modalContent.links.map(link => 
                                    `<a href="${link.url}" class="modal-link" target="_blank">
                                        <i class="fas ${link.text.toLowerCase().includes('live') ? 'fa-external-link-alt' : 'fa-code'}"></i>
                                        ${link.text}
                                    </a>`
                                ).join('')}
                            </div>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            filterAndDisplayTimeline(filter);
            
            // Update active button state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function filterAndDisplayTimeline(filter) {
    currentFilter = filter;
    const filteredItems = globalTimelineData.filter(item => 
        filter === 'all' || item.category === filter
    ).sort((a, b) => b.order - a.order);
    
    const timelineItemsContainer = document.querySelector('.timeline-items');
    timelineItemsContainer.innerHTML = filteredItems.map(item => `
        <div class="timeline-item" data-category="${item.category}" data-order="${item.order}" onclick="openModal('${item.company}')">
            <div class="timeline-dot">
                <i class="${item.category === 'work' ? 'fas fa-briefcase' : 'fas fa-graduation-cap'}"></i>
            </div>
            <div class="timeline-content">
                <div class="timeline-date">
                    <i class="${item.category === 'work' ? 'fas fa-briefcase' : 'fas fa-graduation-cap'}"></i>
                    ${item.startDate} - ${item.endDate}
                </div>
                <h3>${item.company}</h3>
                <p>${item.title}</p>
                <div id="${item.company}" style="display: none;">
                    ${item.modalContent.subtitle ? `<h2>${item.modalContent.subtitle}</h2>` : ''}
                    ${item.modalContent.location ? `<p>Location: ${item.modalContent.location}</p>` : ''}
                    ${item.modalContent.details ? `<ul>${item.modalContent.details.map(detail => `<li>${detail}</li>`).join('')}</ul>` : ''}
                </div>
            </div>
        </div>
    `).join('');

    // Add intersection observer for fade-in animation
    const timelineItems = document.querySelectorAll('.timeline-item');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    timelineItems.forEach(item => {
        observer.observe(item);
        // Add initial visible class if item is already in view
        if (item.getBoundingClientRect().top < window.innerHeight) {
            item.classList.add('visible');
        }
    });
}

function initializeSocialLinks(socialData) {
    const socialIconsList = document.querySelector('.social-icons');
    socialIconsList.innerHTML = socialData.map(social => `
        <li>
            <i class="${social.icon}"></i>
            <a href="${social.url}" target="_blank">${social.platform}</a>
        </li>
    `).join('');
}

function initializeNavigation(navData) {
    navData.forEach(nav => {
        const element = document.getElementById(nav.id);
        if (element) {
            if (nav.display) {
                element.style.display = nav.display;
            }
            // Use the title instead of path
            element.textContent = nav.title;
            // Add icon if present
            if (nav.icon) {
                element.innerHTML = `<i class="${nav.icon}"></i> ${nav.title}`;
            }
        }
    });
}

function openModal(id) {
    const content = document.getElementById(id);
    content.style.display = "block"; // Make the content visible

    let modalWinBox = new WinBox({
        title: id,
        width: '80%',
        height: '80%',
        mount: content,
        class: ["winbox-content"],
        onfocus: function () {
            this.setBackground(WINBOX_COLORS.active);
        },
        onblur: function () {
            this.setBackground(WINBOX_COLORS.inactive);
        },
        modal: true,
        onclose: function () {
            content.style.display = "none"; // Hide the content when the WinBox is closed
            // Remove this WinBox from the stack
            winBoxStack = winBoxStack.filter(wb => wb !== modalWinBox);
            if (winBoxStack.length > 0) {
                // Focus the last WinBox in the stack
                winBoxStack[winBoxStack.length - 1].focus();
            }
        }
    });
    winBoxStack.push(modalWinBox); // Add new WinBox to the stack
}

// Event Listeners
document.addEventListener('DOMContentLoaded', loadPortfolioData);
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && winBoxStack.length > 0) {
        winBoxStack[winBoxStack.length - 1].close();
    }
});