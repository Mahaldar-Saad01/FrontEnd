/**
 * WorkHub API Module
 * Central API layer: base URL, JWT token management, authenticated fetch wrapper.
 * All modules use window.WorkHubAPI.fetch() instead of raw fetch().
 */

(function () {
    'use strict';

    const API_BASE = 'http://localhost:8000/api';

    const WorkHubAPI = {

        // ── Token Storage ─────────────────────────────────────────
        getAccessToken() {
            return localStorage.getItem('wh_access');
        },
        getRefreshToken() {
            return localStorage.getItem('wh_refresh');
        },
        setTokens(access, refresh) {
            if (access) localStorage.setItem('wh_access', access);
            if (refresh) localStorage.setItem('wh_refresh', refresh);
        },
        clearAuth() {
            localStorage.removeItem('wh_access');
            localStorage.removeItem('wh_refresh');
            localStorage.removeItem('currentUser');
        },

        // ── Refresh Access Token ───────────────────────────────────
        async refreshAccessToken() {
            const refresh = this.getRefreshToken();
            if (!refresh) throw new Error('No refresh token available');

            const resp = await fetch(`${API_BASE}/auth/token/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh })
            });

            if (!resp.ok) {
                this.clearAuth();
                window.location.href = 'login.html';
                throw new Error('Session expired. Please log in again.');
            }

            const data = await resp.json();
            this.setTokens(data.access, null);
            return data.access;
        },

        // ── Authenticated Fetch ────────────────────────────────────
        /**
         * Makes an authenticated API request.
         * Automatically attaches Authorization header and retries once on 401.
         *
         * @param {string} endpoint - API path e.g. '/projects/'
         * @param {RequestInit} options - Fetch options (method, body, etc.)
         * @returns {Response}
         */
        async fetch(endpoint, options = {}) {
            let token = this.getAccessToken();

            const buildHeaders = (tkn) => {
                const headers = {
                    ...(tkn ? { 'Authorization': `Bearer ${tkn}` } : {}),
                    ...(options.headers || {})
                };
                if (!(options.body instanceof FormData)) {
                    headers['Content-Type'] = 'application/json';
                }
                return headers;
            };

            let response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers: buildHeaders(token)
            });

            // Auto-refresh on 401 (expired access token)
            if (response.status === 401) {
                try {
                    token = await this.refreshAccessToken();
                    response = await fetch(`${API_BASE}${endpoint}`, {
                        ...options,
                        headers: buildHeaders(token)
                    });
                } catch {
                    window.location.href = 'login.html';
                    throw new Error('Unauthorized');
                }
            }

            return response;
        },

        // ── Convenience Helpers ───────────────────────────────────
        async get(endpoint) {
            return this.fetch(endpoint, { method: 'GET' });
        },

        async post(endpoint, body) {
            return this.fetch(endpoint, {
                method: 'POST',
                body: JSON.stringify(body)
            });
        },

        async put(endpoint, body) {
            return this.fetch(endpoint, {
                method: 'PUT',
                body: JSON.stringify(body)
            });
        },

        async patch(endpoint, body) {
            return this.fetch(endpoint, {
                method: 'PATCH',
                body: JSON.stringify(body)
            });
        },

        async delete(endpoint) {
            return this.fetch(endpoint, { method: 'DELETE' });
        },

        // ── Response Helpers ──────────────────────────────────────
        async getJSON(endpoint) {
            const resp = await this.get(endpoint);
            if (!resp.ok) throw new Error(`API error ${resp.status}`);
            return resp.json();
        },

        // ── Current User Helpers ──────────────────────────────────
        getCurrentUser() {
            const raw = localStorage.getItem('currentUser');
            return raw ? JSON.parse(raw) : null;
        },

        setCurrentUser(userObj) {
            localStorage.setItem('currentUser', JSON.stringify(userObj));
            window.currentUser = userObj;
        },

        isLoggedIn() {
            return !!this.getAccessToken() && !!this.getCurrentUser();
        },

        getUserRole() {
            const u = this.getCurrentUser();
            return u ? u.role : null;
        }
    };

    window.WorkHubAPI = WorkHubAPI;
    window.API_BASE = API_BASE;

})();
