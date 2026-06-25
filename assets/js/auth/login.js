/**
 * Login Module — Real API Authentication
 * Calls POST /api/auth/login/ and stores JWT tokens + user session.
 * Handles first-login redirect to change_password.html.
 */
document.addEventListener("DOMContentLoaded", () => {
    const roleBtns = document.querySelectorAll(".role-btn");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const loginForm = document.getElementById("loginForm");
    const alertContainer = document.getElementById("loginAlert") || document.createElement('div');

    // ── Role switcher (pre-fills demo credentials) ─────────────────
    // const demoCredentials = {
    //     admin:    { email: "admin@gmail.com",    pass: "admin123" },
    //     manager:  { email: "saraa@gmail.com",  pass: "newpass123" },
    //     employee: { email: "samad@mits.com", pass: "samad123" }
    // };

    roleBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            roleBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const role = btn.dataset.role;
            if (demoCredentials[role]) {
                emailInput.value = "";
                passwordInput.value = "";
            }
        });
    });

    // ── Show alert helper ──────────────────────────────────────────
    function showAlert(message, type = 'danger') {
        const container = document.getElementById("loginAlert");
        if (!container) return;
        container.innerHTML = `
            <div class="alert d-flex align-items-center mb-4" role="alert"
                 style="background-color: rgba(${type === 'danger' ? '244,63,94' : '16,185,129'}, 0.15);
                        border-color: var(--color-${type === 'danger' ? 'danger' : 'success'});
                        color: var(--color-${type === 'danger' ? 'danger' : 'success'});">
                <i class="fa-solid fa-circle-${type === 'danger' ? 'exclamation' : 'check'} me-2"></i>
                <div>${message}</div>
            </div>
        `;
    }

    function setLoading(btn, loading) {
        if (loading) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing in...';
        } else {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket me-2"></i>Sign In';
        }
    }

    // ── Form Submission ────────────────────────────────────────────
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        if (!email || !password) {
            showAlert('Please enter your email and password.');
            return;
        }

        setLoading(submitBtn, true);

        try {
            const response = await fetch(`${window.API_BASE}/auth/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                const msg = data.detail || data.email?.[0] || data.password?.[0] || 'Invalid credentials.';
                showAlert(msg);
                setLoading(submitBtn, false);
                return;
            }

            // ── Store JWT tokens ──────────────────────────────────
            WorkHubAPI.setTokens(data.access, data.refresh);

            // ── Build session user object (compatible with frontend) ──
            const user = data.user;
            const sessionUser = {
                id: user.id,
                email: user.email,
                name: user.full_name,
                full_name: user.full_name,
                role: user.role,
                status: user.status,
                avatar: user.avatar_url,
                avatar_url: user.avatar_url,
                dept: user.department,
                department: user.department,
                department_id: user.department_id,
                is_first_login: user.is_first_login
            };

            WorkHubAPI.setCurrentUser(sessionUser);

            // ── First-login redirect ──────────────────────────────
            if (user.is_first_login) {
                localStorage.setItem("changePasswordEmail", email);
                window.location.href = "change_password.html";
                return;
            }

            // ── Redirect to main app ──────────────────────────────
            window.location.href = "index.html";

        } catch (err) {
            console.error('Login error:', err);
            showAlert('Unable to connect to server. Make sure the backend is running on port 8000.');
            setLoading(submitBtn, false);
        }
    });
});
