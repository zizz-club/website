<nav id="navbar" role="navigation">
    <div id="logo-container">
        <a href="?page=home" accesskey="h" data-page="home" id="logo-link">
            <img src="assets/img/logo.svg" alt="Logo">
        </a>
    </div>
    <div id="spacer"></div>
    <ul>
        <li><a href="?page=home" id="home-button" class="<?php echo $page === 'home' ? 'active' : ''; ?>" accesskey="h" data-page="home">Home</a></li>
        <li><a href="?page=about" id="about-button" class="<?php echo $page === 'about' ? 'active' : ''; ?>" accesskey="a" data-page="about">About</a></li>
            <!-- External Links -->
        <li><a href="https://panel.zizz.club/" accesskey="p">Panel</a></li>
    </ul>
</nav>
