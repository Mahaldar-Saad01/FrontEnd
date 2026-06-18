/**
 * Register Module — Admin-Only Employee Registration
 * Calls POST /api/auth/register/ with admin's JWT.
 * Backend auto-generates a random password and emails it to the new employee.
 */
document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");

    if (!registerForm) return;

    // Add api.js to this standalone page
    if (typeof WorkHubAPI === 'undefined') {
        const script = document.createElement('script');
        script.src = 'assets/js/api.js';
        document.head.appendChild(script);
    }

    const deptSelect = document.getElementById("department");
    const teamLeadSelect = document.getElementById("teamLead");
    const teamLeadContainer = document.getElementById("teamLeadContainer");
    const roleSelect = document.getElementById("role");

    const loadDepartments = async () => {
        if (!deptSelect) return;
        try {
            const data = await WorkHubAPI.getJSON('/departments/');
            const depts = Array.isArray(data) ? data : (data.results || []);
            deptSelect.innerHTML = '<option value="" disabled selected>Select Department...</option>';
            depts.forEach(dept => {
                const opt = document.createElement("option");
                opt.value = dept.id;
                opt.textContent = dept.name;
                deptSelect.appendChild(opt);
            });
        } catch (e) {
            console.error("Failed to load departments:", e);
        }
    };

    const updateTeamLeadDropdown = async () => {
        if (!teamLeadSelect || !deptSelect || !roleSelect) return;
        
        const selectedDept = deptSelect.value;
        const selectedRole = roleSelect.value;

        if (selectedRole === 'manager' || selectedRole === 'admin') {
            teamLeadContainer.style.display = 'none';
            teamLeadSelect.value = "";
            return;
        }

        if (!selectedDept) {
            teamLeadContainer.style.display = 'none';
            return;
        }

        try {
            const data = await WorkHubAPI.getJSON('/employees/');
            const employees = Array.isArray(data) ? data : (data.results || []);
            
            const managers = employees.filter(emp => emp.role === 'manager' && emp.department == selectedDept);

            teamLeadSelect.innerHTML = '<option value="">None (No Team Lead)</option>';
            managers.forEach(mgr => {
                const opt = document.createElement("option");
                opt.value = mgr.id;
                opt.textContent = `${mgr.full_name} (${mgr.email})`;
                teamLeadSelect.appendChild(opt);
            });

            teamLeadContainer.style.display = 'block';
        } catch (e) {
            console.error("Failed to load team leads:", e);
        }
    };

    if (deptSelect) {
        deptSelect.addEventListener("change", updateTeamLeadDropdown);
    }
    if (roleSelect) {
        roleSelect.addEventListener("change", updateTeamLeadDropdown);
    }

    loadDepartments();

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const fullName   = document.getElementById("fullName").value.trim();
        const email      = document.getElementById("email").value.trim();
        const role       = document.getElementById("role").value;
        const department = document.getElementById("department").value;
        let teamLeadVal  = document.getElementById("teamLead")?.value || null;

        if (role === 'manager') {
            teamLeadVal = 1;
        } else if (role === 'admin') {
            teamLeadVal = null;
        }

        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const origHtml = submitBtn.innerHTML;

        // Validate
        if (!fullName || !email || !role || !department) {
            alert('Please fill all required fields.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Registering...';

        try {
            const response = await WorkHubAPI.post('/auth/register/', {
                full_name: fullName,
                email: email,
                role: role,
                department: department,  // department ID (integer)
                team_lead: teamLeadVal || null
            });

            const data = await response.json();

            if (!response.ok) {
                const errMsg = data.email?.[0] || data.full_name?.[0] || data.detail || 'Registration failed.';
                alert(`Error: ${errMsg}`);
                submitBtn.disabled = false;
                submitBtn.innerHTML = origHtml;
                return;
            }

            // ── Show simulated email modal ─────────────────────────
            const emailTo   = document.getElementById("email-to");
            const emailName = document.getElementById("email-name");
            const emailVal  = document.getElementById("email-val");
            const emailPass = document.getElementById("email-password");

            if (emailTo) emailTo.textContent = email;
            if (emailName) emailName.textContent = fullName;
            if (emailVal) emailVal.textContent = email;
            if (emailPass) emailPass.textContent = '(sent via email — check terminal console)';

            const modal = new bootstrap.Modal(document.getElementById("emailSentModal"));
            modal.show();

            registerForm.reset();

        } catch (err) {
            console.error('Registration error:', err);
            alert('Network error. Ensure backend is running.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origHtml;
        }
    });
});
