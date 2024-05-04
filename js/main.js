
// const contact = document.querySelector('#contact');
// const contactContent = document.querySelector('#contact-content');
const project = document.querySelector('#project');
const projectContent = document.querySelector('#project-content');
const cv = document.querySelector('#cv');
const cvContent = document.querySelector('#cv-content');
const timeline = document.querySelector('#timeline');
const timelineContent = document.querySelector('#timeline-content');


function openWinBox(title, mountContent,width = '100%',height='100%', top = 'center', right = 'center', bottom = 'center', left = 'center') {
    return new WinBox({
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
    });
}

project.addEventListener('click', () => {
    openWinBox('Project', projectContent);
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

document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const timelineItemsContainer = document.querySelector('.timeline-items');
    const timelineItems = Array.from(document.querySelectorAll('.timeline-item'));

    // Function to handle sorting and displaying of timeline items
    function displayFilteredItems(filteredItems) {
        // Sort items based on the data-order attribute, in descending order (newest first)
        filteredItems.sort((a, b) => parseInt(b.getAttribute('data-order')) - parseInt(a.getAttribute('data-order')));

        // Clear the container and append sorted and filtered items
        timelineItemsContainer.innerHTML = '';
        filteredItems.forEach(item => {
            timelineItemsContainer.appendChild(item);
        });
    }

    // Event listener for filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            let filteredItems = [];

            timelineItems.forEach(item => {
                if (filter === 'all' || item.getAttribute('data-category') === filter) {
                    item.classList.add('active');  // Add 'active' to class list for CSS visibility
                    filteredItems.push(item);     // Add to the array to be sorted and displayed
                } else {
                    item.classList.remove('active');  // Remove 'active' from class list if not matched
                }
            });

            // Display sorted and filtered items
            displayFilteredItems(filteredItems);
        });
    });

    // Initial display and sort on page load
    displayFilteredItems(timelineItems);  // This line will sort and display items when the page is loaded
});

function openModal(id) {
    const content = document.getElementById(id);
    content.style.display = "block"; // Make the content visible

    new WinBox({
        title: id,
        width: '80%',
        height: '80%',
        mount: content,
        onfocus: function () {
            this.setBackground('#00aa00');
        },
        onblur: function () {
            this.setBackground('#777');
        },
        modal: true,
        onclose: function () {
            content.style.display = "none"; // Hide the content again when the WinBox is closed
        }
    });
}