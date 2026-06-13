document.addEventListener("DOMContentLoaded", async () => {
    const navbarContainer = document.getElementById("navbar-container");

    if (!navbarContainer) return;

    try {
        const response = await fetch("navbar.html");

        if (!response.ok) {
            throw new Error("Navbar file not found");
        }

        navbarContainer.innerHTML = await response.text();

        // Populate details from current user session
        const sessionUserRaw = localStorage.getItem("currentUser");
        if (sessionUserRaw) {
            const currentUser = JSON.parse(sessionUserRaw);
            
            const avatarImg = document.getElementById("nav-user-avatar");
            const nameEl = document.getElementById("nav-user-name");
            const roleEl = document.getElementById("nav-user-role");
            const profileLink = document.getElementById("nav-profile-link");
            const settingsLink = document.getElementById("nav-settings-link");

            if (avatarImg) avatarImg.src = currentUser.avatar;
            if (nameEl) nameEl.textContent = currentUser.name;
            if (roleEl) roleEl.textContent = currentUser.role;

            // Route setup based on user role
            if (currentUser.role === 'admin') {
                if (settingsLink) settingsLink.href = '#settings';
                if (profileLink) profileLink.href = '#dashboard'; // Admin doesn't have a profile page in design, point to dashboard
            } else if (currentUser.role === 'manager') {
                if (settingsLink) settingsLink.style.display = 'none'; // Managers don't edit system settings
                if (profileLink) profileLink.href = '#dashboard';
            } else { // Employee
                if (settingsLink) settingsLink.style.display = 'none'; // Employees don't edit system settings
                if (profileLink) profileLink.href = '#profile';
            }
        }
    } catch (error) {
        navbarContainer.innerHTML = `
            <header class="p-3 border-bottom border-danger text-danger">
                ${error.message}
            </header>
        `;
    }
});
