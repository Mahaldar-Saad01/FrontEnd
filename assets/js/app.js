// Global Application Controller
window.PageModules = {}; // Registration bucket for modules initializers

document.addEventListener("DOMContentLoaded", () => {
    // Check local session
    const sessionUserRaw = localStorage.getItem("currentUser");
    if (!sessionUserRaw) {
        window.location.href = "login.html";
        return;
    }

    const currentUser = JSON.parse(sessionUserRaw);
    window.currentUser = currentUser;

    // Output load confirmation
    console.log(`WorkHub Client Bootstrapped: ${currentUser.name} (${currentUser.role})`);
});
