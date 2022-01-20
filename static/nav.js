(async function () {
    const nav = await fetch("/nav.html");
    const navbarHTML = await nav.text();

    $("#navbar").html(navbarHTML);
})();