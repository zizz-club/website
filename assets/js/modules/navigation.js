document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll("#navbar a[data-page]");
    const logoLink = document.querySelector("#logo-link");
    const homeButton = document.querySelector("#home-button");

    links.forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            const page = link.getAttribute("data-page");

            fetch(`pages/${page}.php`)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    return response.text();
                })
                .then((html) => {
                    const parser = new DOMParser();
                    const newDocument = parser.parseFromString(
                        html,
                        "text/html"
                    );
                    const newContent = newDocument.querySelector(".wrapper");

                    if (newContent) {
                        document
                            .querySelector(".wrapper")
                            .replaceWith(newContent);
                    }

                    links.forEach((l) => l.classList.remove("active"));
                    link.classList.add("active");

                    history.pushState({ page }, "", `?page=${page}`);
                })
                .catch((error) => {
                    console.error("Error fetching page:", error);
                });
        });
    });

    if (logoLink && homeButton) {
        logoLink.addEventListener("click", (event) => {
            event.preventDefault();

            fetch("pages/home.php")
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    return response.text();
                })
                .then((html) => {
                    const parser = new DOMParser();
                    const newDocument = parser.parseFromString(
                        html,
                        "text/html"
                    );
                    const newContent = newDocument.querySelector(".wrapper");

                    if (newContent) {
                        document
                            .querySelector(".wrapper")
                            .replaceWith(newContent);
                    }

                    links.forEach((l) => l.classList.remove("active"));
                    homeButton.classList.add("active");

                    history.pushState({ page: "home" }, "", "?page=home");
                })
                .catch((error) => {
                    console.error("Error fetching home page:", error);
                });
        });
    }

    window.addEventListener("popstate", (event) => {
        if (event.state && event.state.page) {
            const page = event.state.page;

            fetch(`pages/${page}.php`)
                .then((response) => response.text())
                .then((html) => {
                    const parser = new DOMParser();
                    const newDocument = parser.parseFromString(
                        html,
                        "text/html"
                    );
                    const newContent = newDocument.querySelector(".wrapper");

                    if (newContent) {
                        document
                            .querySelector(".wrapper")
                            .replaceWith(newContent);
                    }

                    links.forEach((link) => {
                        if (link.getAttribute("data-page") === page) {
                            link.classList.add("active");
                        } else {
                            link.classList.remove("active");
                        }
                    });
                })
                .catch((error) => {
                    console.error("Error fetching page:", error);
                });
        }
    });
});
