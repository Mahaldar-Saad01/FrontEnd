/**
 * Navbar Component
 * Loads navbar HTML, populates user info from session,
 * and fetches unread notification count from the API.
 */
document.addEventListener("DOMContentLoaded", async () => {
    const navbarContainer = document.getElementById("navbar-container");
    if (!navbarContainer) return;

    try {
        const response = await fetch("navbar.html");
        if (!response.ok) throw new Error("Navbar file not found");

        navbarContainer.innerHTML = await response.text();

        const currentUser = WorkHubAPI.getCurrentUser();
        if (!currentUser) return;

        const avatarImg    = document.getElementById("nav-user-avatar");
        const nameEl       = document.getElementById("nav-user-name");
        const roleEl       = document.getElementById("nav-user-role");
        const profileLink  = document.getElementById("nav-profile-link");
        const settingsLink = document.getElementById("nav-settings-link");

        if (avatarImg) avatarImg.src = currentUser.avatar || currentUser.avatar_url || '';
        if (nameEl)    nameEl.textContent = currentUser.name || currentUser.full_name || '';
        if (roleEl)    roleEl.textContent = currentUser.role || '';

        // Route links based on role
        if (profileLink) profileLink.href = '#profile';
        if (settingsLink) {
            settingsLink.style.display = 'block';
            settingsLink.href = '#settings';
        }

        // Fetch unread notification count and update badge
        _loadNotifBadge();

    } catch (error) {
        navbarContainer.innerHTML = `
            <header class="p-3 border-bottom border-danger text-danger">
                ${error.message}
            </header>
        `;
    }
});

async function _loadNotifBadge() {
    try {
        const data = await WorkHubAPI.getJSON('/notifications/');
        const items = Array.isArray(data) ? data : (data.results || []);
        const unread = items.filter(n => !n.is_read).length;

        const badge = document.getElementById("nav-notif-badge");
        if (badge) {
            badge.textContent = unread > 0 ? unread : '';
            badge.style.display = unread > 0 ? 'inline-flex' : 'none';
        }
    } catch (e) {
        // Silently fail — badge just won't update
    }
}
