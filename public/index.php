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
    </head>
    <body>
        <!-- Three.js background container -->
        <div id="threejs-container" style="width: 100%; height: 100vh;"></div>
        
        <!-- Include Navbar -->
        <?php include 'assets/components/navbar.php'; ?>

        <!-- Page Wrapper -->
        <div id="page-wrapper">
            <?php include 'assets/components/home.php'; ?>
            <?php include 'assets/components/about.php'; ?>
            <?php include 'assets/components/contact.php'; ?>
        </div>

        <!-- Include Footer -->
        <?php include 'assets/components/footer.php'; ?>

        <!-- Include Scripts -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/simplex-noise/2.4.0/simplex-noise.min.js"></script>
        <script src="assets/js/background.js"></script>
        <script src="assets/js/components/navbar.js"></script>
    </body>
</html>