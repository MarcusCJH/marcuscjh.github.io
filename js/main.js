// const contact = document.querySelector('#contact');
// const contactContent = document.querySelector('#contact-content');
const showcase = document.querySelector('#showcase');
const showcaseContent = document.querySelector('#showcase-content');
const cv = document.querySelector('#cv');
const cvContent = document.querySelector('#cv-content');
const timeline = document.querySelector('#timeline');
const timelineContent = document.querySelector('#timeline-content');

// Global variables to store the currently active WinBox instance
let winBoxStack = [];

// Global variables to store timeline data and current filter
let globalTimelineData = [];
let currentFilter = 'all';

function openWinBox(title, mountContent, width = '100%', height = '100%', top = 'center', right = 'center', bottom = 'center', left = 'center') {
    let newWinBox = new WinBox({
        title: title,
        width: width,
        height: height,
        top: top,
        right: right,
        bottom: bottom,
        left: left,
        mount: mountContent,
        modal: true,
        onfocus: function () {
            this.setBackground('#00aa00');
        },
        onblur: function () {
            this.setBackground('#777');
        },
        onclose: function () {
            // Remove this WinBox from the stack
            winBoxStack = winBoxStack.filter(wb => wb !== newWinBox);
            if (winBoxStack.length > 0) {
                // Focus the last WinBox in the stack
                winBoxStack[winBoxStack.length - 1].focus();
            }
        }
    });
    winBoxStack.push(newWinBox); // Add new WinBox to the stack
    return newWinBox;
}

showcase.addEventListener('click', () => {
    openWinBox('showcase', showcaseContent);
});

timeline.addEventListener('click', () => {
    openWinBox('Timeline', timelineContent);
});

// contact.addEventListener('click', () => {
//     openWinBox('Contact Me', contactContent);
// });

cv.addEventListener('click', () => {
    openWinBox('Curriculum Vitae', cvContent);

    // Replace 'YOUR_GOOGLE_DRIVE_FILE_ID' with the actual ID of your PDF file on Google Drive
    const pdfDriveFileId = '16eXxJWLCsUib7gZKX48jhT85myOxqh0_';

    // Create an <iframe> tag for the PDF hosted on Google Drive
    const pdfIframe = document.createElement('iframe');
    pdfIframe.src = `https://drive.google.com/file/d/${pdfDriveFileId}/preview`;
    pdfIframe.style.width = '100%';
    pdfIframe.style.height = '90%';
    pdfIframe.style.border = 'none';

    // Replace the existing content in the cv-pdf-container with the PDF viewer
    document.getElementById('cv-pdf-container').innerHTML = '';
    document.getElementById('cv-pdf-container').appendChild(pdfIframe);
});

// Load and initialize data
async function loadPortfolioData() {
    try {
        console.log('Fetching data from ./data/data.json');
        const response = await fetch('./data/data.json');
        console.log('Fetch response:', response);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Loaded data:', data);
        
        // Store timeline data globally
        globalTimelineData = data.timeline;
        
        // Initialize social links
        console.log('Initializing social links');
        initializeSocialLinks(data.social);
        
        // Initialize timeline with all items
        console.log('Initializing timeline');
        filterAndDisplayTimeline('all');
        
        // Initialize navigation
        console.log('Initializing navigation');
        initializeNavigation(data.navigation);

        // Initialize showcase
        if (data.showcase) {
            console.log('Initializing showcase');
            initializeShowcase(data.showcase);
        }
        
        // Set up filter buttons
        setupFilterButtons();
    } catch (error) {
        console.error('Detailed error:', error);
        console.error('Error stack:', error.stack);
        document.querySelector('.social-icons').innerHTML = '<li>Error loading data. Please check console for details.</li>';
    }
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
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <div class="timeline-date">${item.startDate} - ${item.endDate}</div>
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
            this.setBackground('#00aa00');
        },
        onblur: function () {
            this.setBackground('#777');
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

document.addEventListener('DOMContentLoaded', function() {
    loadPortfolioData();
});

document.addEventListener('keydown', function (event) {
    if (event.keyCode === 27 && winBoxStack.length > 0) {
        winBoxStack[winBoxStack.length - 1].close(); // Close the topmost WinBox
    }
});