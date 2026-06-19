/**
 * Tasks Module — Full CRUD via /api/tasks/
 * Handles admin tasks, manager assignments, and employee my-tasks views.
 * Role-based rendering: admin gets delete, employee gets status select, manager gets assignee select.
 */

// ── Shared Render ──────────────────────────────────────────────────────────
const renderTasksCommon = async (tableBodyId, searchInputId, priorityFilterId, statusFilterId) => {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;

    const query    = document.getElementById(searchInputId)?.value.toLowerCase()  || '';
    const priority = document.getElementById(priorityFilterId)?.value             || 'all';
    const status   = document.getElementById(statusFilterId)?.value               || 'all';
    const role     = window.currentUser?.role || 'employee';

    tableBody.innerHTML = `
        <tr><td colspan="6" class="text-center text-secondary py-4">
            <div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading tasks...
        </td></tr>
    `;

    try {
        const data = await WorkHubAPI.getJSON('/tasks/');
        let tasks = Array.isArray(data) ? data : (data.results || []);

        // Client-side filter
        const filtered = tasks.filter(task => {
            const matchQ = task.title.toLowerCase().includes(query) ||
                           (task.project_name || '').toLowerCase().includes(query);
            const matchP = priority === 'all' || task.priority === priority;
            const matchS = status   === 'all' || task.status   === status;
            return matchQ && matchP && matchS;
        });

        tableBody.innerHTML = '';

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr><td colspan="6" class="text-center text-secondary py-4">No tasks found.</td></tr>
            `;
            return;
        }

        // Cache employees for manager assignee dropdown
        let employeeOptions = '<option value="">Unassigned</option>';
        if (role === 'manager') {
            try {
                const empData = await WorkHubAPI.getJSON('/employees/');
                const emps = Array.isArray(empData) ? empData : (empData.results || []);
                employeeOptions += emps
                    .filter(e => e.role !== 'admin')
                    .map(e => `<option value="${e.id}">${e.full_name}</option>`)
                    .join('');
            } catch (e) { /* use placeholder */ }
        }

        filtered.forEach(task => {
            let pBadge = 'badge-priority-low';
            if (task.priority === 'high')   pBadge = 'badge-priority-high';
            if (task.priority === 'medium') pBadge = 'badge-priority-medium';

            let sBadge = 'badge-status-todo';
            let statusLabel = 'To Do';
            if (task.status === 'progress') { sBadge = 'badge-status-progress'; statusLabel = 'In Progress'; }
            if (task.status === 'review')   { sBadge = 'badge-status-review';   statusLabel = 'In Review'; }
            if (task.status === 'done')     { sBadge = 'badge-status-done';     statusLabel = 'Completed'; }

            let actionColumn = '';
            if (role === 'admin') {
                actionColumn = `
                    <td class="text-end">
                        <button class="btn btn-link text-danger p-0 delete-task-btn" data-id="${task.id}">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </td>
                `;
            } else if (role === 'employee') {
                actionColumn = `
                    <td class="text-end">
                        <select class="form-select form-select-custom py-1 px-2 font-size-xs task-status-select"
                                data-id="${task.id}" style="width:120px; display:inline-block;">
                            <option value="todo"     ${task.status === 'todo'     ? 'selected' : ''}>To Do</option>
                            <option value="progress" ${task.status === 'progress' ? 'selected' : ''}>In Progress</option>
                            <option value="review"   ${task.status === 'review'   ? 'selected' : ''}>In Review</option>
                            <option value="done"     ${task.status === 'done'     ? 'selected' : ''}>Completed</option>
                        </select>
                        <button class="btn btn-primary-custom py-1 px-2 font-size-xs ms-2 submit-review-btn"
                                data-id="${task.id}" data-title="${task.title}"
                                ${task.status === 'review' || task.status === 'done' ? 'disabled' : ''}>
                            <i class="fa-solid fa-file-export"></i> Review
                        </button>
                    </td>
                `;
            } else { // manager
                actionColumn = `
                    <td class="text-end">
                        <select class="form-select form-select-custom py-1 px-2 font-size-xs task-assignee-select"
                                data-id="${task.id}" style="width:150px; display:inline-block;">
                            ${employeeOptions.replace(
                                `value="${task.assignee}"`,
                                `value="${task.assignee}" selected`
                            )}
                        </select>
                    </td>
                `;
            }

            const tr = document.createElement('tr');
            let proceedBadge = '';
            if (task.proceed_flag) {
                proceedBadge = `<span class="badge bg-success text-white ms-2" style="font-size:0.7rem;"><i class="fa-solid fa-flag"></i> Proceed</span>`;
            }
            tr.innerHTML = `
                <td class="fw-semibold text-white">${task.title}${proceedBadge}</td>
                <td><span class="text-secondary-custom">${task.project_name || '—'}</span></td>
                <td><span class="text-muted-custom font-size-sm">${task.department_name || '—'}</span></td>
                <td><span class="badge-custom ${pBadge}">${task.priority}</span></td>
                <td><span class="badge-custom ${sBadge}">${statusLabel}</span></td>
                ${actionColumn}
            `;
            tableBody.appendChild(tr);
        });
    //}
        // ── Event Handlers ─────────────────────────────────────────

        // Admin delete
        document.querySelectorAll('.delete-task-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Delete this task?')) return;
                try {
                    await WorkHubAPI.delete(`/tasks/${btn.dataset.id}/`);
                    renderTasksCommon(tableBodyId, searchInputId, priorityFilterId, statusFilterId);
                } catch (e) { alert('Failed to delete task.'); }
            });
        });

        // Employee status change
        document.querySelectorAll('.task-status-select').forEach(sel => {
            sel.addEventListener('change', async () => {
                try {
                    await WorkHubAPI.patch(`/tasks/${sel.dataset.id}/`, { status: sel.value });
                    renderTasksCommon(tableBodyId, searchInputId, priorityFilterId, statusFilterId);
                } catch (e) { alert('Failed to update status.'); }
            });
        });

        // Manager assignee change
        document.querySelectorAll('.task-assignee-select').forEach(sel => {
            sel.addEventListener('change', async () => {
                try {
                    await WorkHubAPI.patch(`/tasks/${sel.dataset.id}/`, {
                        assignee: sel.value || null
                    });
                    renderTasksCommon(tableBodyId, searchInputId, priorityFilterId, statusFilterId);
                } catch (e) { alert('Failed to update assignee.'); }
            });
        });
        // Employee Review request
        document.querySelectorAll('.submit-review-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const taskId = btn.dataset.id;
                const taskTitle = btn.dataset.title;

                const reviewTaskIdEl = document.getElementById('reviewTaskId');
                const reviewTaskTitleEl = document.getElementById('reviewTaskTitle');
                const reviewReportEl = document.getElementById('reviewReport');

                if (reviewTaskIdEl) reviewTaskIdEl.value = taskId;
                if (reviewTaskTitleEl) reviewTaskTitleEl.value = taskTitle;
                if (reviewReportEl) reviewReportEl.value = '';

                const modalEl = document.getElementById('submitReviewModal');
                if (modalEl) {
                    const modal = new bootstrap.Modal(modalEl);
                    modal.show();
                }
            });
        });

    } catch (err) {
        console.error('Tasks load error:', err);
        tableBody.innerHTML = `
            <tr><td colspan="6" class="text-center text-danger py-4">Failed to load tasks.</td></tr>
        `;
    }
};

// ── Filter listeners ───────────────────────────────────────────────────────
const setupTaskFilterListeners = (tableBodyId, searchInputId, priorityFilterId, statusFilterId) => {
    const queryEl = document.getElementById(searchInputId);
    const prioEl  = document.getElementById(priorityFilterId);
    const statEl  = document.getElementById(statusFilterId);

    if (queryEl) queryEl.addEventListener('input',  () => renderTasksCommon(tableBodyId, searchInputId, priorityFilterId, statusFilterId));
    if (prioEl)  prioEl.addEventListener('change',  () => renderTasksCommon(tableBodyId, searchInputId, priorityFilterId, statusFilterId));
    if (statEl)  statEl.addEventListener('change',  () => renderTasksCommon(tableBodyId, searchInputId, priorityFilterId, statusFilterId));
};

// ── Admin Tasks Page ───────────────────────────────────────────────────────
window.PageModules['admin-tasks'] = async function () {
    renderTasksCommon('tasks-table-body', 'task-search-input', 'filter-priority', 'filter-status');
    setupTaskFilterListeners('tasks-table-body', 'task-search-input', 'filter-priority', 'filter-status');
};

// ── Employee My Tasks Page ─────────────────────────────────────────────────
window.PageModules['employee-mytasks'] = function () {
    renderTasksCommon('mytasks-table-body', 'mytask-search-input', 'myfilter-priority', 'myfilter-status');
    setupTaskFilterListeners('mytasks-table-body', 'mytask-search-input', 'myfilter-priority', 'myfilter-status');

    const form = document.getElementById('submitReviewForm');
    if (form && !form.dataset.bound) {
        form.dataset.bound = 'true';
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const taskId = document.getElementById('reviewTaskId').value;
            const report = document.getElementById('reviewReport').value;

            try {
                const resp = await WorkHubAPI.patch(`/tasks/${taskId}/`, {
                    status: 'review',
                    report: report
                });

                if (!resp.ok) {
                    const errText = await resp.text();
                    alert(`Failed to submit review: ${errText}`);
                    return;
                }

                form.reset();
                const modalEl = document.getElementById('submitReviewModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();

                renderTasksCommon('mytasks-table-body', 'mytask-search-input', 'myfilter-priority', 'myfilter-status');
            } catch (err) {
                console.error(err);
                alert('Network error.');
            }
        });
    }
};

// ── Manager Assignments Page ───────────────────────────────────────────────
window.PageModules['manager-assignments'] = async function () {
    renderTasksCommon('assignments-table-body', 'assign-search-input', 'assign-filter-priority', 'assign-filter-status');
    setupTaskFilterListeners('assignments-table-body', 'assign-search-input', 'assign-filter-priority', 'assign-filter-status');

    const form = document.getElementById('addTaskForm');
    if (form && !form.dataset.bound) {
        form.dataset.bound = 'true';

        const deptSelect = document.getElementById('taskDept');
        const projSelect = document.getElementById('taskProj');
        const assigneeSelect = document.getElementById('taskAssignee');

        let allProjects = [];

        // 1. Fetch available departments and populate the dropdown
        try {
            const dData = await WorkHubAPI.getJSON('/departments/');
            const departments = Array.isArray(dData) ? dData : (dData.results || []);
            if (deptSelect) {
                deptSelect.innerHTML = '<option value="" disabled selected>Select Department...</option>';
                departments.forEach(d => {
                    deptSelect.innerHTML += `<option value="${d.id}">${d.name}</option>`;
                });
            }
        } catch (e) {
            console.error('Failed to load departments', e);
        }

        // 2. Fetch projects and keep a copy in memory
        try {
            const pData = await WorkHubAPI.getJSON('/projects/');
            allProjects = Array.isArray(pData) ? pData : (pData.results || []);
        } catch (e) {
            console.error('Failed to load projects', e);
        }

        // 3. Handle department selection to update projects dropdown
        if (deptSelect && projSelect) {
            deptSelect.addEventListener('change', () => {
                const selectedDeptId = deptSelect.value;
                if (!selectedDeptId) {
                    projSelect.innerHTML = '<option value="" disabled selected>Select Department first...</option>';
                    projSelect.disabled = true;
                    return;
                }

                // Filter projects belonging to this department
                // Note: p.department in the ProjectSerializer is the ID of the department
                const deptProjects = allProjects.filter(p => p.department == selectedDeptId);

                if (deptProjects.length === 0) {
                    projSelect.innerHTML = '<option value="" disabled selected>No projects available in this department</option>';
                    projSelect.disabled = true;
                } else {
                    projSelect.innerHTML = '<option value="" disabled selected>Select Project...</option>';
                    deptProjects.forEach(p => {
                        projSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`;
                    });
                    projSelect.disabled = false;
                }
            });
        }

        // 4. Fetch team employees and populate "assigned to" dropdown
        try {
            const empData = await WorkHubAPI.getJSON('/employees/');
            const employees = Array.isArray(empData) ? empData : (empData.results || []);
            const currentUser = WorkHubAPI.getCurrentUser();
            
            // Filter employees working under the current manager
            const teamEmployees = employees.filter(e => e.role === 'employee' && e.team_lead === currentUser.id);

            if (assigneeSelect) {
                assigneeSelect.innerHTML = '<option value="">Unassigned</option>';
                teamEmployees.forEach(e => {
                    assigneeSelect.innerHTML += `<option value="${e.id}">${e.full_name}</option>`;
                });
            }
        } catch (e) {
            console.error('Failed to load team employees', e);
        }

        // 5. Submit form
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('taskTitle').value;
            const projectId = document.getElementById('taskProj').value;
            const deptId = document.getElementById('taskDept').value;
            const priority = document.getElementById('taskPriority').value;
            const status = document.getElementById('taskStatus').value;
            const assigneeId = document.getElementById('taskAssignee').value || null;

            try {
                const resp = await WorkHubAPI.post('/tasks/', {
                    title,
                    project: projectId ? parseInt(projectId) : null,
                    department: deptId ? parseInt(deptId) : null,
                    priority,
                    status,
                    assignee: assigneeId ? parseInt(assigneeId) : null
                });

                if (!resp.ok) {
                    const errText = await resp.text();
                    alert(`Failed to create task: ${errText}`);
                    return;
                }

                form.reset();
                if (projSelect) {
                    projSelect.innerHTML = '<option value="" disabled selected>Select Department first...</option>';
                    projSelect.disabled = true;
                }
                const modal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
                if (modal) modal.hide();
                renderTasksCommon('assignments-table-body', 'assign-search-input', 'assign-filter-priority', 'assign-filter-status');
            } catch (err) {
                console.error(err);
                alert('Network error.');
            }
        });
    }
};
