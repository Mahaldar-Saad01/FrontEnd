/**
 * Employees Module — Full CRUD via /api/employees/
 * Admin employee table, Manager team workload grid, Employee profile page.
 */

// ── Render Employee Table (Admin) ──────────────────────────────────────────
const renderEmployeesTable = async () => {
    const tableBody  = document.getElementById('employees-table-body');
    const countBadge = document.getElementById('employee-count-badge');
    if (!tableBody) return;

    const query = document.getElementById('employee-search-input')?.value.toLowerCase() || '';

    tableBody.innerHTML = `
        <tr><td colspan="6" class="text-center text-secondary py-4">
            <div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading employees...
        </td></tr>
    `;

    try {
        const data = await WorkHubAPI.getJSON('/employees/');
        let employees = Array.isArray(data) ? data : (data.results || []);

        // Client-side search filter
        const filtered = employees.filter(emp =>
            emp.full_name.toLowerCase().includes(query) ||
            emp.email.toLowerCase().includes(query) ||
            (emp.department_name || '').toLowerCase().includes(query)
        );

        if (countBadge) countBadge.textContent = filtered.length;

        tableBody.innerHTML = '';

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr><td colspan="6" class="text-center text-secondary py-4">No employees matching search criteria.</td></tr>
            `;
            return;
        }

        const currentUser = WorkHubAPI.getCurrentUser();

        filtered.forEach(emp => {
            const isSelf = emp.email === currentUser?.email;
            let statusBadge = 'badge-status-progress';
            if (emp.status === 'On Leave') statusBadge = 'badge-status-todo';

            const roleIcon = emp.role === 'admin'
                ? 'fa-user-shield text-danger'
                : (emp.role === 'manager' ? 'fa-user-tie text-warning' : 'fa-user text-primary');

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-bold text-white">
                    <div class="d-flex align-items-center gap-2">
                        <img src="${emp.avatar_url}" class="rounded-circle" style="width:28px; height:28px;" alt="Avatar">
                        <span>${emp.full_name} ${isSelf ? '<small class="text-muted-custom font-size-xs">(You)</small>' : ''}</span>
                    </div>
                </td>
                <td><span class="text-secondary-custom">${emp.email}</span></td>
                <td class="text-capitalize small fw-semibold">
                    <i class="fa-solid ${roleIcon} me-1"></i>${emp.role}
                </td>
                <td><span class="text-muted-custom font-size-sm">${emp.department_name || '—'}</span></td>
                <td><span class="badge-custom ${statusBadge}">${emp.status}</span></td>
                <td class="text-end">
                    <button class="btn btn-link text-secondary-custom p-0 toggle-status-btn me-2"
                            data-id="${emp.id}" title="Toggle Leave Status">
                        <i class="fa-solid fa-plane-departure"></i>
                    </button>
                    <button class="btn btn-link text-danger p-0 delete-emp-btn"
                            data-id="${emp.id}" ${isSelf ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''}>
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // ── Delete Handler ──────────────────────────────────────────
        document.querySelectorAll('.delete-emp-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Delete this employee permanently?')) return;
                try {
                    await WorkHubAPI.delete(`/employees/${btn.dataset.id}/`);
                    renderEmployeesTable();
                } catch (e) { alert('Failed to delete employee.'); }
            });
        });

        // ── Toggle Status Handler ───────────────────────────────────
        document.querySelectorAll('.toggle-status-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                try {
                    await WorkHubAPI.patch(`/employees/${btn.dataset.id}/toggle-status/`, {});
                    renderEmployeesTable();
                } catch (e) { alert('Failed to toggle status.'); }
            });
        });

    } catch (err) {
        console.error('Employees load error:', err);
        tableBody.innerHTML = `
            <tr><td colspan="6" class="text-center text-danger py-4">Failed to load employees.</td></tr>
        `;
    }
};

// ── Admin Employees Page ───────────────────────────────────────────────────
window.PageModules['admin-employees'] = async function () {
    renderEmployeesTable();

    const searchInput = document.getElementById('employee-search-input');
    if (searchInput) searchInput.addEventListener('input', renderEmployeesTable);

    const deptSelect = document.getElementById("empDept");
    const teamLeadSelect = document.getElementById("empTeamLead");
    const teamLeadContainer = document.getElementById("empTeamLeadContainer");
    const roleSelect = document.getElementById("empRole");

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

    if (deptSelect && !deptSelect.dataset.listenerBound) {
        deptSelect.dataset.listenerBound = 'true';
        deptSelect.addEventListener("change", updateTeamLeadDropdown);
    }
    if (roleSelect && !roleSelect.dataset.listenerBound) {
        roleSelect.dataset.listenerBound = 'true';
        roleSelect.addEventListener("change", updateTeamLeadDropdown);
    }

    await loadDepartments();

    const form = document.getElementById('addEmployeeForm');
    if (form && !form.dataset.bound) {
        form.dataset.bound = 'true';
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name   = document.getElementById('empName').value;
            const email  = document.getElementById('empEmail').value;
            const role   = document.getElementById('empRole').value;
            const deptId = document.getElementById('empDept').value;
            let teamLeadVal = document.getElementById('empTeamLead')?.value || null;

            if (role === 'manager') {
                teamLeadVal = 1;
            } else if (role === 'admin') {
                teamLeadVal = null;
            }

            try {
                const resp = await WorkHubAPI.post('/auth/register/', {
                    full_name: name,
                    email,
                    role,
                    department: deptId || null,
                    team_lead: teamLeadVal || null
                });
                if (!resp.ok) {
                    const err = await resp.json();
                    alert(err.email?.[0] || err.full_name?.[0] || 'Failed to add employee.');
                    return;
                }

                form.reset();
                if (teamLeadContainer) teamLeadContainer.style.display = 'none';
                const modal = bootstrap.Modal.getInstance(document.getElementById('addEmployeeModal'));
                if (modal) modal.hide();
                renderEmployeesTable();

            } catch (err) { alert('Network error.'); }
        });
    }
};

// ── Manager Team View ──────────────────────────────────────────────────────
window.PageModules['manager-team'] = async function () {
    const listContainer = document.getElementById('manager-team-grid');
    if (!listContainer) return;

    listContainer.innerHTML = `
        <div class="col-12 text-center text-secondary py-4">
            <div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading team...
        </div>
    `;

    try {
        const [empData, taskData] = await Promise.all([
            WorkHubAPI.getJSON('/employees/'),
            WorkHubAPI.getJSON('/tasks/')
        ]);

        const employees = (Array.isArray(empData) ? empData : (empData.results || [])).filter(e => e.role !== 'admin');
        const tasks     = Array.isArray(taskData) ? taskData : (taskData.results || []);

        listContainer.innerHTML = '';

        employees.forEach(member => {
            const activeTasks    = tasks.filter(t => t.assignee === member.id && t.status !== 'done');
            const completedTasks = tasks.filter(t => t.assignee === member.id && t.status === 'done');
            const workloadIndex  = activeTasks.length;

            let workloadBadge = 'bg-success';
            let workloadLabel = 'Low Workload';
            if (workloadIndex >= 3)      { workloadBadge = 'bg-danger'; workloadLabel = 'High Workload'; }
            else if (workloadIndex >= 1) { workloadBadge = 'bg-warning text-dark'; workloadLabel = 'Medium Workload'; }

            const card = document.createElement('div');
            card.className = 'col-xl-3 col-lg-4 col-md-6 col-sm-12';
            card.innerHTML = `
                <div class="card-custom h-100 d-flex flex-column justify-content-between p-4">
                    <div class="text-center mb-3">
                        <img src="${member.avatar_url}" class="rounded-circle mb-2" style="width:64px; height:64px;" alt="Avatar">
                        <h6 class="fw-bold text-white mb-1">${member.full_name}</h6>
                        <small class="text-muted text-capitalize d-block mb-2">
                            ${member.role} · ${member.department_name || '—'}
                        </small>
                        <span class="badge ${workloadBadge} py-1 px-2.5 font-size-xs">${workloadLabel}</span>
                    </div>
                    <div class="border-top pt-3" style="border-color:var(--border-color) !important;">
                        <div class="d-flex justify-content-between small text-secondary mb-1">
                            <span>Active Tasks:</span>
                            <span class="text-white fw-bold">${workloadIndex}</span>
                        </div>
                        <div class="d-flex justify-content-between small text-secondary mb-2">
                            <span>Completed:</span>
                            <span class="text-success fw-bold">${completedTasks.length}</span>
                        </div>
                        <a href="mailto:${member.email}" class="btn btn-secondary-custom btn-sm w-100 mt-1">
                            <i class="fa-regular fa-envelope me-1.5"></i>Contact
                        </a>
                    </div>
                </div>
            `;
            listContainer.appendChild(card);
        });

    } catch (err) {
        listContainer.innerHTML = '<div class="col-12 text-danger text-center py-4">Failed to load team.</div>';
    }
};

// ── Employee Profile Page ──────────────────────────────────────────────────
window.PageModules['employee-profile'] = async function () {
    const avatarImg = document.getElementById('profile-card-avatar');
    const cardName  = document.getElementById('profile-card-name');
    const cardRole  = document.getElementById('profile-card-role');
    const cardDept  = document.getElementById('profile-card-dept');
    const inputName = document.getElementById('profile-name');
    const inputEmail = document.getElementById('profile-email');
    const inputRole = document.getElementById('profile-role');
    const inputDept = document.getElementById('profile-dept');
    const form       = document.getElementById('profile-details-form');
    const alertCont  = document.getElementById('profile-alert-container');

    // Avatar upload handling
    const editBtn = document.getElementById('profile-avatar-edit-btn');
    const fileInput = document.getElementById('profile-avatar-input');

    if (editBtn && fileInput) {
        editBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', async () => {
            if (fileInput.files.length === 0) return;
            const file = fileInput.files[0];
            const formData = new FormData();
            formData.append('avatar', file);

            try {
                const resp = await WorkHubAPI.fetch('/users/me/avatar/', {
                    method: 'POST',
                    body: formData
                });

                if (!resp.ok) {
                    throw new Error('Upload failed');
                }

                const data = await resp.json();
                const newAvatarUrl = data.avatar_url;

                // Update UI elements
                if (avatarImg) avatarImg.src = newAvatarUrl;
                const navAvatar = document.getElementById('nav-user-avatar');
                if (navAvatar) navAvatar.src = newAvatarUrl;

                // Sync local storage session
                const session = WorkHubAPI.getCurrentUser() || {};
                session.avatar = newAvatarUrl;
                session.avatar_url = newAvatarUrl;
                WorkHubAPI.setCurrentUser(session);

                if (alertCont) {
                    alertCont.innerHTML = `
                        <div class="alert alert-success d-flex align-items-center mb-4 fade-in-view" role="alert"
                             style="background-color:rgba(16,185,129,0.15); border-color:var(--color-success); color:var(--color-success);">
                            <i class="fa-solid fa-circle-check me-2"></i>
                            <div>Avatar updated successfully.</div>
                        </div>
                    `;
                    setTimeout(() => { alertCont.innerHTML = ''; }, 3000);
                }

            } catch (err) {
                console.error(err);
                alert('Failed to upload profile picture. Please try again.');
            } finally {
                fileInput.value = '';
            }
        });
    }

    try {
        const userData = await WorkHubAPI.getJSON('/users/me/');

        if (avatarImg) avatarImg.src = userData.avatar_url || '';
        if (cardName)  cardName.textContent  = userData.full_name;
        if (cardRole)  cardRole.textContent  = userData.role;
        if (cardDept)  cardDept.textContent  = userData.department_name || '';
        if (inputName) inputName.value  = userData.full_name;
        if (inputEmail) inputEmail.value = userData.email;
        if (inputRole) inputRole.value  = userData.role;
        if (inputDept) inputDept.value  = userData.department_name || '';

    } catch (e) {
        // Fallback to localStorage session
        const u = WorkHubAPI.getCurrentUser();
        if (!u) return;
        if (avatarImg) avatarImg.src = u.avatar || '';
        if (cardName)  cardName.textContent = u.name || u.full_name;
        if (cardRole)  cardRole.textContent = u.role;
        if (cardDept)  cardDept.textContent = u.dept || u.department || '';
        if (inputName) inputName.value = u.name || u.full_name;
        if (inputEmail) inputEmail.value = u.email;
        if (inputRole) inputRole.value = u.role;
        if (inputDept) inputDept.value = u.dept || u.department || '';
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const updatedName  = inputName?.value.trim();
            const updatedEmail = inputEmail?.value.trim();
            if (!updatedName || !updatedEmail) return;

            try {
                const resp = await WorkHubAPI.put('/users/me/', {
                    full_name: updatedName,
                    email: updatedEmail
                });
                if (!resp.ok) { alert('Update failed.'); return; }

                const updated = await resp.json();
                const newAvatar = updated.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(updatedName)}&background=6366f1&color=fff`;

                // Sync session
                const session = WorkHubAPI.getCurrentUser() || {};
                session.name = updatedName;
                session.full_name = updatedName;
                session.email = updatedEmail;
                session.avatar = newAvatar;
                session.avatar_url = newAvatar;
                WorkHubAPI.setCurrentUser(session);

                if (avatarImg) avatarImg.src = newAvatar;
                if (cardName) cardName.textContent = updatedName;

                // Update navbar avatar
                const navAvatar = document.getElementById('nav-user-avatar');
                const navName   = document.getElementById('nav-user-name');
                if (navAvatar) navAvatar.src = newAvatar;
                if (navName)   navName.textContent = updatedName;

                if (alertCont) {
                    alertCont.innerHTML = `
                        <div class="alert alert-success d-flex align-items-center mb-4 fade-in-view" role="alert"
                             style="background-color:rgba(16,185,129,0.15); border-color:var(--color-success); color:var(--color-success);">
                            <i class="fa-solid fa-circle-check me-2"></i>
                            <div>Profile updated successfully.</div>
                        </div>
                    `;
                    setTimeout(() => { alertCont.innerHTML = ''; }, 3000);
                }

            } catch (err) { alert('Network error.'); }
        });
    }
};
