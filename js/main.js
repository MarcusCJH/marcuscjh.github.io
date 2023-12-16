const about = document.querySelector('#about');
const contact = document.querySelector('#contact');
const aboutContent = document.querySelector('#about-content');
const contactContent = document.querySelector('#contact-content');

function openWinBox(title, mountContent, top, right, bottom, left) {
    return new WinBox({
        title: title,
        width: '400px',
        height: '400px',
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
    openWinBox('About Me', aboutContent, 50, 50, 50, 50);
});

contact.addEventListener('click', () => {
    openWinBox('Contact Me', contactContent, 150, 50, 50, 250);
});