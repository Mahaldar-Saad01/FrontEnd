/**
 * Departments Module — Full CRUD via /api/departments/
 * Renders department grid cards. Clicking a card opens member detail modal.
 */
window.PageModules['admin-departments'] = async function () {
    const gridContainer = document.getElementById('departments-grid-container');
    const addForm = document.getElementById('addDeptForm');

    let departments = [];

    const renderDepartments = () => {
        if (!gridContainer) return;
        gridContainer.innerHTML = '';

        if (departments.length === 0) {
            gridContainer.innerHTML = '<p class="text-secondary text-center py-4">No departments found.</p>';
            return;
        }

        departments.forEach(dept => {
            const card = document.createElement('div');
            card.className = 'col-xl-3 col-lg-4 col-md-6 col-sm-12';
            card.innerHTML = `
                <div class="card-custom h-100 d-flex flex-column justify-content-between p-4 dept-card"
                     data-dept-id="${dept.id}" data-dept-name="${dept.name}" style="cursor:pointer;">
                    <div>
                        <div class="d-flex align-items-center justify-content-center rounded-3 bg-dark border mb-3 text-primary"
                             style="width:48px; height:48px; border-color:var(--border-color) !important;">
                            <i class="fa-solid fa-building fs-5"></i>
                        </div>
                        <h5 class="fw-bold text-white mb-1">${dept.name}</h5>
                        <span class="badge bg-secondary rounded-pill font-size-xs px-2.5 py-1 mb-3">
                            ${dept.member_count ?? dept.headcount} Members
                        </span>
                    </div>
                    <div class="border-top pt-3 d-flex align-items-center justify-content-between"
                         style="border-color:var(--border-color) !important;">
                        <div class="d-flex align-items-center gap-2">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(dept.lead_manager_name || 'TBD')}&background=random"
                                 class="rounded-circle" style="width:28px; height:28px;" alt="Lead">
                            <div>
                                <div class="text-white small fw-semibold">${dept.lead_manager_name || '—'}</div>
                                <div class="text-muted" style="font-size:0.7rem;">Lead Manager</div>
                            </div>
                        </div>
                        <button class="btn btn-link text-danger p-0 delete-dept-btn" data-id="${dept.id}">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;
            gridContainer.appendChild(card);

            // Click to open dept detail modal
            const deptEl = card.querySelector('.dept-card');
            deptEl.addEventListener('click', (e) => {
                if (e.target.closest('.delete-dept-btn')) return;
                showDeptDetails(dept);
            });
        });

        // Delete handler
        document.querySelectorAll('.delete-dept-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Delete this department?')) return;
                try {
                    const resp = await WorkHubAPI.delete(`/departments/${btn.dataset.id}/`);
                    if (resp.ok) {
                        departments = departments.filter(d => d.id != btn.dataset.id);
                        renderDepartments();
                    } else {
                        alert('Failed to delete department.');
                    }
                } catch (e) { alert('Network error.'); }
            });
        });
    };

    // ── Show Department Detail Modal ───────────────────────────────
    async function showDeptDetails(dept) {
        const detailName  = document.getElementById('dept-detail-name');
        const detailCount = document.getElementById('dept-detail-count');
        const membersBody = document.getElementById('dept-members-body');

        if (!membersBody) return;

        if (detailName)  detailName.textContent  = dept.name;
        if (detailCount) detailCount.textContent = `${dept.member_count ?? dept.headcount} Members`;

        membersBody.innerHTML = `
            <tr><td colspan="5" class="text-center text-secondary py-3">
                <div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading members...
            </td></tr>
        `;

        try {
            const [empData, projData, taskData] = await Promise.all([
                WorkHubAPI.getJSON('/employees/'),
                WorkHubAPI.getJSON('/projects/'),
                WorkHubAPI.getJSON('/tasks/')
            ]);

            const employees = Array.isArray(empData) ? empData : (empData.results || []);
            const projects  = Array.isArray(projData) ? projData : (projData.results || []);
            const tasks     = Array.isArray(taskData) ? taskData : (taskData.results || []);

            const members = employees.filter(e => e.department === dept.id || e.department_name === dept.name);

            membersBody.innerHTML = '';

            if (members.length === 0) {
                membersBody.innerHTML = '<tr><td colspan="5" class="text-center text-secondary py-3">No members found.</td></tr>';
            } else {
                members.forEach(member => {
                    const assignedTask = tasks.find(t => t.assignee === member.id);
                    const proj = assignedTask ? projects.find(p => p.id === assignedTask.project) : null;
                    const projectName = proj ? proj.name : '—';
                    const managerName = proj ? (proj.lead_manager_name || '—') : '—';

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>
                            <div class="d-flex align-items-center gap-2">
                                <img src="${member.avatar_url}" class="rounded-circle"
                                     style="width:28px; height:28px;" alt="Avatar">
                                <div>
                                    <div class="fw-bold text-white">${member.full_name}</div>
                                    <div class="text-secondary small">${member.email}</div>
                                </div>
                            </div>
                        </td>
                        <td class="text-white">${projectName}</td>
                        <td>
                            <div class="d-flex align-items-center gap-2">
                                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(managerName)}&background=random"
                                     class="rounded-circle" style="width:28px; height:28px;" alt="Manager">
                                <span class="text-white small fw-semibold">${managerName}</span>
                            </div>
                        </td>
                        <td class="text-capitalize small fw-semibold">${member.role}</td>
                        <td>
                            <span class="badge-custom ${member.status === 'Active' ? 'badge-status-progress' : 'badge-status-todo'}">
                                ${member.status}
                            </span>
                        </td>
                    `;
                    membersBody.appendChild(tr);
                });
            }
        } catch (e) {
            membersBody.innerHTML = '<tr><td colspan="5" class="text-danger text-center py-3">Failed to load members.</td></tr>';
        }

        const modalEl = document.getElementById('deptDetailModal');
        if (modalEl) {
            const instance = new bootstrap.Modal(modalEl);
            instance.show();
        }
    }

    // ── Load Initial Departments ───────────────────────────────────
    try {
        const data = await WorkHubAPI.getJSON('/departments/');
        departments = Array.isArray(data) ? data : (data.results || []);
        renderDepartments();
    } catch (e) {
        if (gridContainer) {
            gridContainer.innerHTML = '<p class="text-danger text-center py-4">Failed to load departments.</p>';
        }
    }

    // ── Load Employees for Lead Manager Dropdown ───────────────────
    const deptLeadSelect = document.getElementById('deptLead');
    if (deptLeadSelect) {
        try {
            const empData = await WorkHubAPI.getJSON('/employees/');
            const employees = Array.isArray(empData) ? empData : (empData.results || []);

            deptLeadSelect.innerHTML = '<option value="" disabled selected>Select Lead Manager...</option>';

            const calculateExperience = (dateJoinedStr) => {
                if (!dateJoinedStr) return '0 days';
                const joined = new Date(dateJoinedStr);
                const now = new Date();
                const diffTime = Math.abs(now - joined);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays < 30) {
                    return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
                }
                const diffMonths = Math.floor(diffDays / 30);
                if (diffMonths < 12) {
                    return `${diffMonths} month${diffMonths === 1 ? '' : 's'}`;
                }
                const diffYears = Math.floor(diffMonths / 12);
                const remainingMonths = diffMonths % 12;
                return `${diffYears} year${diffYears === 1 ? '' : 's'}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths === 1 ? '' : 's'}` : ''}`;
            };

            employees.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.id;
                const exp = calculateExperience(emp.date_joined);
                const roleFormatted = emp.role ? emp.role.charAt(0).toUpperCase() + emp.role.slice(1) : 'Unknown';
                option.textContent = `${emp.full_name} (${emp.email}) - ${roleFormatted} - Exp: ${exp}`;
                deptLeadSelect.appendChild(option);
            });
        } catch (e) {
            console.error('Failed to load lead manager options:', e);
        }
    }

    // ── Add Department Form ────────────────────────────────────────
    if (addForm && !addForm.dataset.bound) {
        addForm.dataset.bound = 'true';
        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name  = document.getElementById('deptName').value;
            const lead  = document.getElementById('deptLead').value;  // user ID
            const count = parseInt(document.getElementById('deptCount').value);

            try {
                const resp = await WorkHubAPI.post('/departments/', {
                    name,
                    lead_manager: lead || null,
                    headcount: count || 0
                });
                if (!resp.ok) {
                    const err = await resp.json();
                    alert(err.name?.[0] || 'Failed to create department.');
                    return;
                }
                const newDept = await resp.json();
                departments.push(newDept);

                addForm.reset();
                const modal = bootstrap.Modal.getInstance(document.getElementById('addDeptModal'));
                if (modal) modal.hide();
                renderDepartments();

            } catch (err) { alert('Network error.'); }
        });
    }
};
