/**
 * Global Application Controller
 * Guards all app pages behind JWT authentication.
 * Initializes window.currentUser from localStorage after verifying token exists.
 */
window.PageModules = {}; // Registration bucket for module initializers

document.addEventListener("DOMContentLoaded", () => {
    // Check both JWT token and user session
    const token = localStorage.getItem("wh_access");
    const sessionUserRaw = localStorage.getItem("currentUser");

    if (!token || !sessionUserRaw) {
        // Clear any stale data and redirect to login
        WorkHubAPI.clearAuth();
        window.location.href = "login.html";
        return;
    }

    const currentUser = JSON.parse(sessionUserRaw);
    window.currentUser = currentUser;

    console.log(`WorkHub Bootstrapped: ${currentUser.full_name} (${currentUser.role})`);
});
