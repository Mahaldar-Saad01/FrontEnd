function logoutUser() {
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
}

// Global hook for logout operations
document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", (e) => {
        if (e.target.closest("#logout-btn") || e.target.closest(".logout-action")) {
            e.preventDefault();
            logoutUser();
        }
    });
});
