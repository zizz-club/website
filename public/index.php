<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
include 'assets/helpers/error_handler.php';

// Get the 'page' query parameter, default to 'home'
$page = $_GET['page'] ?? 'home';

// List of allowed pages
$allowed_pages = ['home', 'account'];

// Check if the requested page is allowed
if (in_array($page, $allowed_pages)) {
    $page_file = "assets/components/$page.php";
    if (file_exists($page_file)) {
        include $page_file;
    } else {
        log_error('The requested page file is missing: ' . $page_file);
        $page_content = '<p>Error: The requested page file is missing.</p>';
    }
} else {
    // Show a 404 page if the requested page is not allowed
    if (file_exists('assets/components/404.php')) {
        include 'assets/components/404.php';
    } else {
        log_error('404 page is missing.');
        $page_content = '<p>Error: 404 page is missing.</p>';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>zizz.club</title>
        <!-- Include global styles -->
        <link rel="stylesheet" href="assets/css/base.css">
        <link rel="stylesheet" href="assets/css/navbar.css">
        <link rel="stylesheet" href="assets/css/pages.css">
        <link rel="stylesheet" href="assets/css/footer.css">
        <link rel="stylesheet" href="assets/css/typography.css">
        <!-- Favicon -->
        <link rel="icon" type="image/x-icon" href="assets/images/favicon.ico">
        <meta name="description" content="zizz.club - A modern, responsive website with a dynamic Three.js background.">
        <meta name="keywords" content="zizz.club, Three.js, responsive, modern, web design">
        <meta name="author" content="Mathias Toft Svenningsen">
    </head>
    <body>
        <!-- Three.js background container -->
        <div id="threejs-container" style="width: 100%; height: 100vh;"></div>
        
        <noscript>
            <p style="color: red; text-align: center;">JavaScript is disabled or failed to load. Please enable JavaScript for the best experience.</p>
        </noscript>

        <!-- Include Navbar -->
        <?php
        if (file_exists('assets/components/navbar.php')) {
            include 'assets/components/navbar.php';
        } else {
            log_error('Navbar component is missing.');
            echo '<p>Error: Navbar component is missing.</p>';
        }
        ?>

        <!-- Page Wrapper -->
        <div id="page-wrapper">
            <?php
            // The page content is already included above
            ?>
        </div>

        <!-- Include Footer -->
        <?php
        if (file_exists('assets/components/footer.php')) {
            include 'assets/components/footer.php';
        } else {
            log_error('Footer component is missing.');
            echo '<p>Error: Footer component is missing.</p>';
        }
        ?>

        <!-- Include Scripts -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/simplex-noise/2.4.0/simplex-noise.min.js"></script>
        <script src="assets/js/background.js"></script>
        <script src="assets/js/components/navbar.js"></script>
        <script src="assets/js/components/account.js"></script>
    </body>
</html>