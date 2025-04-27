console.log('account.js loaded'); // Debugging

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const registerResponse = document.getElementById('register-response');

    if (registerForm) {
        console.log('Register form found'); // Debugging

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
                })
                .catch((error) => {
                    console.error('Error:', error); // Debugging
                });
        });
    } else {
        console.error('Register form not found'); // Debugging
    }
});