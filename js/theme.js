
/* ========================================
   EG GLOBAL THEME MANAGEMENT
======================================== */

// GET SAVED THEME
const savedTheme = localStorage.getItem("egTheme") || "light";


// ========================================
// APPLY THEME
// ========================================

function applyTheme(theme) {

    document.documentElement.setAttribute("data-theme", theme);

    localStorage.setItem("egTheme", theme);

    updateThemeButton(theme);

}


// ========================================
// UPDATE THEME BUTTON
// ========================================

function updateThemeButton(theme) {

    const themeIcon = document.getElementById("themeIcon");
    const themeText = document.getElementById("themeText");

    if (!themeIcon || !themeText) {
        return;
    }

    if (theme === "dark") {

        themeIcon.textContent = "☀️";
        themeText.textContent = "Light Mode";

    } else {

        themeIcon.textContent = "🌙";
        themeText.textContent = "Night Mode";

    }

}


// ========================================
// APPLY SAVED THEME WHEN PAGE LOADS
// ========================================

applyTheme(savedTheme);


// ========================================
// THEME BUTTON EVENT
// ========================================

document.addEventListener("DOMContentLoaded", function() {

    const themeToggle = document.getElementById("themeToggle");

    if (themeToggle) {

        themeToggle.addEventListener("click", function() {

            const currentTheme =
                document.documentElement.getAttribute("data-theme");

            const newTheme =
                currentTheme === "dark" ? "light" : "dark";

            applyTheme(newTheme);

        });

    }

});