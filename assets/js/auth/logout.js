/**
 * Logout Module
 * Calls POST /api/auth/logout/ to blacklist the refresh token,
 * then clears all local auth data and redirects to login.
 */
async function workHubLogout() {
    try {
        const refresh = WorkHubAPI.getRefreshToken();
        if (refresh) {
            // Attempt to blacklist the refresh token server-side
            await WorkHubAPI.post('/auth/logout/', { refresh });
        }
    } catch (e) {
        // Proceed with local logout even if server call fails
        console.warn('Server logout failed, proceeding with local logout.', e);
    } finally {
        WorkHubAPI.clearAuth();
        window.location.href = 'login.html';
    }
}

// Attach to all logout triggers via event delegation to support dynamically loaded components
document.addEventListener("click", (e) => {
    const btn = e.target.closest(".logout-btn, #logout-btn, .logout-action");
    if (btn) {
        e.preventDefault();
        workHubLogout();
    }
});
