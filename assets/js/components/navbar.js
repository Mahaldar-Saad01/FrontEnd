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
        document.body.classList.add("saas-theme");
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

        // ── PROFILE DROPDOWN Z-INDEX FIX ─────────────────────────
        // The dropdown was appearing under the dashboard content because
        // the dashboard-page div creates a new stacking context.
        // We force the dropdown to always render on top.
        const profileTrigger = document.getElementById("profileDropdown");
        if (profileTrigger) {
            profileTrigger.addEventListener("shown.bs.dropdown", () => {
                const menu = profileTrigger.nextElementSibling
                    || profileTrigger.closest('.dropdown')?.querySelector('.dropdown-menu');
                if (menu) {
                    menu.style.zIndex = '9999';
                    menu.style.position = 'absolute';
                }
            });
        }

        // Also fix any dropdown toggles generically
        document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach(trigger => {
            trigger.addEventListener('shown.bs.dropdown', () => {
                const menu = trigger.nextElementSibling
                    || trigger.closest('.dropdown')?.querySelector('.dropdown-menu');
                if (menu) menu.style.zIndex = '9999';
            });
        });

        // Fetch unread notification count and update badge
        _loadNotifBadge();

    } catch (error) {
        navbarContainer.innerHTML = `
            <header class="p-3 border-bottom border-danger text-danger">
                ${error.message}
            </header>
        `;
    }

    // ── Inject Motivation Widget into sidebar ─────────────────────
    _injectMotivationWidget();
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

/**
 * Injects the "Keep going 🚀" motivation widget at the bottom of the sidebar.
 * Picks a motivational message based on hour of day.
 */
function _injectMotivationWidget() {
    const sidebar = document.querySelector('.app-sidebar');
    if (!sidebar) return;
    if (sidebar.querySelector('.motivation-widget')) return; // already injected

    const hour = new Date().getHours();
    const messages = [
        { title: 'Keep going! 🚀', sub: "You're doing great" },
        { title: 'Stay focused! 💪', sub: 'You\'re on a roll' },
        { title: 'Almost there! ⭐', sub: 'Great progress today' },
        { title: 'Morning grind! ☀️', sub: 'Let\'s crush today' },
    ];
    const msg = hour < 12 ? messages[3] : hour < 17 ? messages[0] : messages[2];

    // Progress: random-ish but consistent per day
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const pct = 55 + (dayOfYear % 30);

    const widget = document.createElement('div');
    widget.className = 'motivation-widget';
    widget.innerHTML = `
        <div class="d-flex align-items-center gap-2 mb-1">
            <span style="font-size:1.3rem;">🚀</span>
            <div>
                <div class="mw-title">${msg.title}</div>
                <div class="mw-sub">${msg.sub}</div>
            </div>
        </div>
        <div class="mw-progress-track">
            <div class="mw-progress-fill" style="width: ${pct}%;"></div>
        </div>
        <div class="mw-pct">${pct}%</div>
    `;

    sidebar.appendChild(widget);
}