(async function () {
    const navbar = document.createElement("div");
    navbar.setAttribute("id", "navbar");
    navbar.setAttribute("class", "mb-4");
    navbar.innerHTML = (await (await fetch("/nav.html")).text());

    $(document.body).prepend(navbar);
})();