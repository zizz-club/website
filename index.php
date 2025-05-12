<?php
    $default_page = 'home';
    $page = isset($_GET['page']) ? $_GET['page'] : $default_page;
    $valid_pages = ['home', 'about'];
    if (!in_array($page, $valid_pages)) {
        $page = $default_page;
    }
    $title = 'zizz.club - ' . ucfirst($page);
    $favicon = 'assets/img/favicon.ico';
?>

<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title><?php echo $title; ?></title>
        <link rel="stylesheet" href="assets/css/imports.css">
        <link rel="icon" href="<?php echo $favicon; ?>" type="image/x-icon">
        <link rel="apple-touch-icon" href="<?php echo $favicon; ?>" type="image/x-icon">
    </head>
    <body>
        <div id="threejs-container"></div>
        <?php include 'modules/navbar.php'; ?>
        <?php include 'pages/' . $page . '.php'; ?>
        <?php include 'assets/js/imports.php'; ?>
        <?php include 'modules/footer.php'; ?>
    </body>
</html>
