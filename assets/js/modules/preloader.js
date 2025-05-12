$(window).on('load', function() {
    $('body').imagesLoaded(function() {
        document.fonts.ready.then(function() {
            $('.spinner').fadeOut();
            $('.preloader').delay(350).fadeOut('slow');
            $('body').delay(350).css({'overflow':'visible'});
        });
    });
});
