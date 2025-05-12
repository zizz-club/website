$(window).on("load", function () {
    $("body").imagesLoaded(function () {
        document.fonts.ready.then(function () {
            setTimeout(function () {
                $(".spinner").fadeOut();
                $(".preloader").delay(350).fadeOut("slow");
                $("body").delay(350).css({ overflow: "visible" });
            }, 5000); // Fallback timeout to ensure preloader doesn't block indefinitely
        });
    });
});
