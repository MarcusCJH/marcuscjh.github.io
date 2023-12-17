const about = document.querySelector('#about');
const contact = document.querySelector('#contact');
const aboutContent = document.querySelector('#about-content');
const contactContent = document.querySelector('#contact-content');
const cv = document.querySelector('#cv');
const cvContent = document.querySelector('#cv-content');


function openWinBox(title, mountContent,width = '50%',height='50%', top = 'center', right = 'center', bottom = 'center', left = 'center') {
    return new WinBox({
        title: title,
        width: width,
        height: height,
        top: top,
        right: right,
        bottom: bottom,
        left: left,
        mount: mountContent,
        onfocus: function () {
            this.setBackground('#00aa00');
        },
        onblur: function () {
            this.setBackground('#777');
        },
    });
}

about.addEventListener('click', () => {
    openWinBox('About Me', aboutContent);
});

contact.addEventListener('click', () => {
    openWinBox('Contact Me', contactContent);
});

cv.addEventListener('click', () => {
    openWinBox('Curriculum Vitae', cvContent);

    // Replace 'YOUR_GOOGLE_DRIVE_FILE_ID' with the actual ID of your PDF file on Google Drive
    const pdfDriveFileId = '123';

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


function popOut(text) {
    // UWU UWUUWUUWUUWUUWUUWUUWUUWUUWUUWUUWUUWUUWUUWUUWUUWUUWUUWUUWU
    const uwuSpan = document.createElement('span');
    uwuSpan.innerText = text;
    uwuSpan.classList.add('pop-out');

    // Append uwu span to the body
    document.body.appendChild(uwuSpan);

    setTimeout(() => {
        uwuSpan.remove();
    }, 500);
}
