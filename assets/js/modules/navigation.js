document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll("#navbar a");

    links.forEach((link) => {
        link.addEventListener("click", (event) => {
            const page = link.getAttribute("data-page");

            // Allow default behavior for external links
            if (!page) {
                return;
            }

            event.preventDefault();

            fetch(`pages/${page}.php`)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    return response.text();
                })
                .then((html) => {
                    // Replace the main content area dynamically
                    const parser = new DOMParser();
                    const newDocument = parser.parseFromString(
                        html,
                        "text/html"
                    );
                    const newContent = newDocument.querySelector(".wrapper");

                    if (newContent) {
                        const currentContent =
                            document.querySelector(".wrapper");
                        if (currentContent) {
                            currentContent.replaceWith(newContent);
                        }
                    }

                    history.pushState({ page }, "", `?page=${page}`);
                })
                .catch((error) => {
                    console.error("Error fetching page:", error);
                });
        });
    });

    window.addEventListener("popstate", (event) => {
        if (event.state && event.state.page) {
            fetch(`pages/${event.state.page}.php`)
                .then((response) => response.text())
                .then((html) => {
                    const parser = new DOMParser();
                    const newDocument = parser.parseFromString(
                        html,
                        "text/html"
                    );
                    const newContent = newDocument.querySelector(".wrapper");

                    if (newContent) {
                        const currentContent =
                            document.querySelector(".wrapper");
                        if (currentContent) {
                            currentContent.replaceWith(newContent);
                        }
                    }
                });
        }
    });
});
