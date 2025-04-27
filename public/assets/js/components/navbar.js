// Wait for the DOM to load before executing the script
document.addEventListener('DOMContentLoaded', () => {
    // Select all navigation links
    const navLinks = document.querySelectorAll('.nav-item');
    const pageWrapper = document.getElementById('page-wrapper');

    // Function to reinitialize scripts for dynamically loaded content
    function reinitializeScripts() {
        console.log('Reinitializing scripts for dynamically loaded content'); // Debugging

        // Reinitialize account.js if the account page is loaded
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            console.log('Reinitializing account.js for the account page'); // Debugging

            registerForm.addEventListener('submit', (e) => {
                e.preventDefault(); // Prevent default form submission
                console.log('Form submission intercepted'); // Debugging

                const formData = new FormData(registerForm);
                console.log('Form data:', Object.fromEntries(formData.entries())); // Debugging

                fetch('/private/register.php', {
                    method: 'POST',
                    body: formData,
                })
                    .then((response) => {
                        console.log('Fetch response:', response); // Debugging
                        return response.json();
                    })
                    .then((data) => {
                        console.log('Server response:', data); // Debugging
                        const registerResponse = document.getElementById('register-response');
                        if (data.status === 'success') {
                            registerResponse.textContent = data.message;
                            registerResponse.style.color = 'green';
                            registerForm.reset();
                        } else {
                            registerResponse.textContent = data.message;
                            registerResponse.style.color = 'red';
                        }
                    })
                    .catch((error) => {
                        console.error('Error:', error); // Debugging
                        const registerResponse = document.getElementById('register-response');
                        registerResponse.textContent = 'An error occurred. Please try again.';
                        registerResponse.style.color = 'red';
                    });
            });
        }
    }

    // Add click event listeners to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Prevent default behavior only for navigation links
            const targetPage = link.getAttribute('href');
            console.log('Navbar link clicked:', targetPage); // Debugging
            e.preventDefault(); // Prevent default anchor behavior

            console.log(`Fetching content from: ${targetPage}`); // Debugging

            // Add fade-out effect
            pageWrapper.classList.add('fade-out');

            setTimeout(() => {
                // Fetch the content of the target page
                fetch(targetPage)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Failed to load page: ${response.statusText}`);
                        }
                        return response.text();
                    })
                    .then(html => {
                        // Extract the content inside the <section> tag
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        const newContent = doc.querySelector('.page');

                        if (newContent) {
                            console.log('Page content loaded successfully:', newContent.outerHTML); // Debugging
                            // Replace the content of the page wrapper
                            pageWrapper.innerHTML = '';
                            pageWrapper.appendChild(newContent);

                            // Ensure the new page is visible
                            newContent.classList.add('active');

                            // Reinitialize scripts for the new content
                            reinitializeScripts();
                        } else {
                            console.error('Error: Page content not found.'); // Debugging
                            pageWrapper.innerHTML = '<p>Error: Page content not found.</p>';
                        }

                        // Remove fade-out and add fade-in
                        pageWrapper.classList.remove('fade-out');
                        pageWrapper.classList.add('fade-in');
                    })
                    .catch(error => {
                        console.error(error);
                        pageWrapper.innerHTML = '<p>Error: Failed to load the page.</p>';
                        pageWrapper.classList.remove('fade-out');
                    });
            }, 300); // Match the fade-out duration
        });
    });

    // Load the default page (Home) on initial load
    const defaultPage = 'index.php?page=home';
    console.log(`Loading default page: ${defaultPage}`); // Debugging
    fetch(defaultPage)
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const defaultContent = doc.querySelector('.page');
            if (defaultContent) {
                console.log('Default page content loaded successfully.'); // Debugging
                pageWrapper.innerHTML = '';
                pageWrapper.appendChild(defaultContent);

                // Ensure the default page is visible
                defaultContent.classList.add('active');

                // Reinitialize scripts for the default content
                reinitializeScripts();
            } else {
                console.error('Error: Default page content not found.'); // Debugging
                pageWrapper.innerHTML = '<p>Error: Failed to load the default page.</p>';
            }
        })
        .catch(error => {
            console.error(error);
            pageWrapper.innerHTML = '<p>Error: Failed to load the default page.</p>';
        });
});