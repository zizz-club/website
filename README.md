# zizz.club

A modern, responsive website with a dynamic Three.js background and modular components.

## Project Structure

```public/  
├── assets/  
│ ├── components/           # Reusable components (PHP files)  
│ │ ├── navbar.php  
│ │ ├── footer.php  
│ │ ├── home.php  
│ │ ├── about.php  
│ │ ├── contact.php  
│ ├── css/ # Stylesheets  
│ │ ├── base.css  
│ │ ├── navbar.css  
│ │ ├── footer.css  
│ │ ├── pages.css  
│ │ ├── typography.css  
│ ├── js/                   # JavaScript files  
│ │ ├── background.js  
│ │ ├── components/  
│ │ │ ├── navbar.js  
│ ├── images/               # Images and icons  
│ │ ├── favicon.ico  
├── index.php               # Main entry point
```

## Features

- **Three.js Background**: A dynamic, animated background using Perlin noise.
- **Modular Components**: Navbar, footer, and pages are reusable and easy to manage.
- **Responsive Design**: Fully responsive across devices.

## How to Add a New Page

1. Create a new PHP file in `assets/components/`.
2. Add the page content inside a `<section>` with the class `page`.
3. Update the navbar in `navbar.php` to include a link to the new page.

## How to Run

1. Clone the repository.
2. Open `index.php` in a local server (e.g., XAMPP, WAMP, or PHP's built-in server).
3. Enjoy the website!
