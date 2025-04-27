// Wait for the DOM to load before executing the script
document.addEventListener('DOMContentLoaded', () => {
    // Select all navigation links and page sections
    const navLinks = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    // Add click event listeners to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href').substring(1); // Get the target section ID
            const targetPage = document.getElementById(targetId);

            if (targetPage) {
                e.preventDefault(); // Prevent default anchor behavior

                // Hide all pages
                pages.forEach(page => page.classList.remove('active'));

                // Show the target page
                targetPage.classList.add('active');
            }
        });
    });

    // Show the first page (Home) by default
    if (pages.length > 0) {
        pages[0].classList.add('active');
    }
});