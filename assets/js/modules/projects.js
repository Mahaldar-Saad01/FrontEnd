/**
 * Projects Module — Full CRUD via /api/projects/
 * Handles admin projects page and manager projects page.
 * All rendering logic and element IDs preserved from original design.
 */

// ── Shared Render Function ─────────────────────────────────────────────────
const getOriginalDocumentUrl = (proj) => proj.original_document_url || proj.project_document_url || proj.original_document || proj.project_document || '';
const getPreviewDocumentUrl = (proj) => proj.preview_document_url || proj.preview_document || '';

const renderProjectDocumentCell = (proj) => {
    const originalUrl = getOriginalDocumentUrl(proj);
    const previewUrl = getPreviewDocumentUrl(proj);
    if (!originalUrl) {
        return '<span class="text-secondary-custom">No docs</span>';
    }
    const fileName = proj.original_document_name || proj.project_document_name || originalUrl.split('/').pop() || 'Project document';
    const safeTitle = String(fileName).replace(/"/g, '&quot;');
    return `
        <div class="d-flex flex-wrap align-items-center gap-2">
            <button class="btn btn-sm btn-primary-custom view-project-doc-btn"
                    type="button"
                    ${previewUrl ? '' : 'disabled'}
                    data-preview-url="${previewUrl}"
                    data-original-url="${originalUrl}"
                    data-doc-title="${safeTitle}">
                <i class="fa-regular fa-eye me-1"></i>View Document
            </button>
            <a href="${originalUrl}" target="_blank" rel="noopener" download
               class="btn btn-sm btn-secondary-custom">
                <i class="fa-solid fa-download me-1"></i>Download Original
            </a>
        </div>
    `;
};

const parseProjectError = async (resp) => {
    try {
        const err = await resp.json();
        return err.name?.[0] || err.detail || err.original_document?.[0] || err.project_document?.[0] || 'Failed to create project.';
    } catch {
        return 'Failed to create project.';
    }
};

const closeProjectModal = () => {
    const modalEl = document.getElementById('addProjectModal');
    if (!modalEl || !window.bootstrap) return;
    bootstrap.Modal.getOrCreateInstance(modalEl).hide();
    document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove());
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
};


const bindProjectModalCleanup = () => {
    const modalEl = document.getElementById('addProjectModal');
    if (!modalEl || modalEl.dataset.cleanupBound) return;
    modalEl.dataset.cleanupBound = 'true';
    modalEl.addEventListener('hidden.bs.modal', () => {
        document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove());
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('padding-right');
    });
};

const bindProjectDocumentPreview = () => {
    const modalEl = document.getElementById('projectDocumentPreviewModal');
    const iframe = document.getElementById('projectDocumentPreviewFrame');
    const titleEl = document.getElementById('projectDocumentPreviewTitle');
    const loadingEl = document.getElementById('projectDocumentPreviewLoading');
    const downloadLink = document.getElementById('projectDocumentDownloadLink');
    const openLink = document.getElementById('projectDocumentOpenLink');
    if (!modalEl || !iframe || !window.bootstrap) return;
    if (modalEl.parentElement !== document.body) {
        document.body.appendChild(modalEl);
    }

    document.querySelectorAll('.view-project-doc-btn').forEach(btn => {
        if (btn.dataset.previewBound) return;
        btn.dataset.previewBound = 'true';
        btn.addEventListener('click', () => {
            const url = btn.dataset.previewUrl;
            if (!url) return;
            if (loadingEl) {
                loadingEl.classList.remove('d-none');
            }
            iframe.src = url;
            if (downloadLink) {
                downloadLink.href = btn.dataset.originalUrl || url;
            }
            if (openLink) {
                openLink.href = url;
            }
            if (titleEl) {
                titleEl.textContent = btn.dataset.docTitle || 'Project document';
            }
            modalEl.style.display = '';
            bootstrap.Modal.getOrCreateInstance(modalEl).show();
        });
    });

    if (!modalEl.dataset.previewCleanupBound) {
        modalEl.dataset.previewCleanupBound = 'true';
        modalEl.addEventListener('hidden.bs.modal', () => {
            iframe.src = '';
            if (loadingEl) {
                loadingEl.classList.remove('d-none');
            }
        });
    }

    if (!iframe.dataset.previewLoadBound) {
        iframe.dataset.previewLoadBound = 'true';
        iframe.addEventListener('load', () => {
            if (loadingEl) {
                loadingEl.classList.add('d-none');
            }
        });
    }
};

const postProjectPayload = (payload, docFile) => {
    if (!docFile) {
        return WorkHubAPI.post('/projects/', payload);
    }

    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            formData.append(key, value);
        }
    });
    formData.append('original_document', docFile);
    return WorkHubAPI.postForm('/projects/', formData);
};

const renderProjectsCommon = async (containerId, filterManagerId = null) => {
    const tableBody = document.getElementById(containerId);
    if (!tableBody) return;

    tableBody.innerHTML = `
        <tr><td colspan="7" class="text-center text-secondary py-4">
            <div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading projects...
        </td></tr>
    `;

    try {
        const data = await WorkHubAPI.getJSON('/projects/');
        let projects = Array.isArray(data) ? data : (data.results || []);

        // For manager view: filter to only their projects
        if (filterManagerId) {
            projects = projects.filter(p => p.lead_manager === filterManagerId);
        }

        tableBody.innerHTML = '';

        if (projects.length === 0) {
            tableBody.innerHTML = `
                <tr><td colspan="7" class="text-center text-secondary py-4">No projects found.</td></tr>
            `;
            return;
        }

        projects.forEach(proj => {
            let statusBadge = 'badge-status-todo';
            if (proj.status === 'Active')     statusBadge = 'badge-status-progress';
            if (proj.status === 'Completed')  statusBadge = 'badge-status-done';

            let progressColor = 'bg-primary';
            if (proj.status === 'Completed') progressColor = 'bg-success';
            if (proj.status === 'Pending')   progressColor = 'bg-secondary';

            const managerName = proj.lead_manager_name || 'Unassigned';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-bold text-white">${proj.name}</td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(managerName)}&background=random"
                             class="rounded-circle" style="width:24px; height:24px;" alt="Manager">
                        <span>${managerName}</span>
                    </div>
                </td>
                <td><span class="text-secondary-custom">${proj.department_name || '—'}</span></td>
                <td>${renderProjectDocumentCell(proj)}</td>
                <td><span class="badge-custom ${statusBadge}">${proj.status}</span></td>
                <td style="width: 200px;">
                    <div class="d-flex align-items-center gap-2">
                        <div class="progress flex-grow-1" style="height: 6px; background-color: var(--bg-input);">
                            <div class="progress-bar ${progressColor}" role="progressbar"
                                 style="width: ${proj.progress}%;" aria-valuenow="${proj.progress}"
                                 aria-valuemin="0" aria-valuemax="100"
                                 aria-label="${proj.name} progress" title="${proj.name} progress: ${proj.progress}%"></div>
                        </div>
                        <span class="small font-weight-semibold" style="width:30px;">${proj.progress}%</span>
                    </div>
                </td>
                <td class="text-end">
                    <button class="btn btn-link text-secondary-custom p-0 edit-project-btn me-2"
                            type="button" title="Update ${proj.name} progress" aria-label="Update ${proj.name} progress"
                            data-id="${proj.id}" data-progress="${proj.progress}" data-status="${proj.status}">
                        <i class="fa-regular fa-edit"></i>
                    </button>
                    <button class="btn btn-link text-danger p-0 delete-project-btn" type="button"
                            title="Delete ${proj.name}" aria-label="Delete ${proj.name}" data-id="${proj.id}">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // ── Delete handler ─────────────────────────────────────────
        document.querySelectorAll('.delete-project-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Delete this project?')) return;
                const id = btn.dataset.id;
                try {
                    await WorkHubAPI.delete(`/projects/${id}/`);
                    renderProjectsCommon(containerId, filterManagerId);
                } catch (e) {
                    alert('Failed to delete project.');
                }
            });
        });

        // ── Edit (increment progress) handler ──────────────────────
        document.querySelectorAll('.edit-project-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                let progress = parseInt(btn.dataset.progress) || 0;
                progress = Math.min(progress + 10, 100);
                const newStatus = progress >= 100 ? 'Completed' : (progress > 0 ? 'Active' : 'Pending');

                try {
                    await WorkHubAPI.patch(`/projects/${id}/`, {
                        progress,
                        status: newStatus
                    });
                    renderProjectsCommon(containerId, filterManagerId);
                } catch (e) {
                    alert('Failed to update project.');
                }
            });
        });

        bindProjectDocumentPreview();

    } catch (err) {
        console.error('Projects load error:', err);
        tableBody.innerHTML = `
            <tr><td colspan="7" class="text-center text-danger py-4">
                Failed to load projects. Check API connection.
            </td></tr>
        `;
    }
};

// ── Load Project Dropdown Options ──────────────────────────────────────────
const loadProjectDropdown = async (selectId) => {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    try {
        const data = await WorkHubAPI.getJSON('/projects/');
        const projects = Array.isArray(data) ? data : (data.results || []);
        sel.innerHTML = projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    } catch (e) { /* keep default options */ }
};

// ── Admin Projects Page ────────────────────────────────────────────────────
// ── Admin Projects Page ────────────────────────────────────────────────────
window.PageModules['admin-projects'] = async function () {
    bindProjectModalCleanup();
    await renderProjectsCommon('projects-table-body');

    // Load Lead Managers dropdown
    const managerSelect = document.getElementById('projectManager');
    if (managerSelect) {
        try {
            const empData = await WorkHubAPI.getJSON('/employees/');
            const employees = Array.isArray(empData) ? empData : (empData.results || []);
            managerSelect.innerHTML = '<option value="" disabled selected>Select Lead Manager...</option>';

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
                managerSelect.appendChild(option);
            });
        } catch (e) {
            console.error('Failed to load project lead managers:', e);
        }
    }

    // Load Departments dropdown
    const deptSelect = document.getElementById('projectDept');
    if (deptSelect) {
        try {
            const deptData = await WorkHubAPI.getJSON('/departments/');
            const departments = Array.isArray(deptData) ? deptData : (deptData.results || []);
            deptSelect.innerHTML = '<option value="" disabled selected>Select Department...</option>';
            departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.id;
                option.textContent = dept.name;
                deptSelect.appendChild(option);
            });
        } catch (e) {
            console.error('Failed to load project departments:', e);
        }
    }

    const addForm = document.getElementById('addProjectForm');
    if (addForm && !addForm.dataset.bound) {
        addForm.dataset.bound = 'true';
        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = addForm.querySelector('button[type="submit"]');
            const originalText = submitBtn?.innerHTML;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating...';
            }

            const name       = document.getElementById('projectName').value;
            const managerId  = document.getElementById('projectManager').value;
            const deptId     = document.getElementById('projectDept').value;
            const statusVal  = document.getElementById('projectStatus').value;
            const docFile    = document.getElementById('projectDocument')?.files?.[0];
            const payload = {
                name,
                lead_manager: managerId || null,
                department: deptId || null,
                status: statusVal,
                progress: statusVal === 'Completed' ? 100 : (statusVal === 'Active' ? 10 : 0)
            };

            try {
                const resp = await postProjectPayload(payload, docFile);

                if (!resp.ok) {
                    alert(await parseProjectError(resp));
                    return;
                }

                addForm.reset();
                closeProjectModal();
                await renderProjectsCommon('projects-table-body');

            } catch (err) {
                console.error('Add project error:', err);
                alert('Network error.');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            }
        });
    }
};

// ── Manager Projects Page ──────────────────────────────────────────────────
window.PageModules['manager-projects'] = async function () {
    bindProjectModalCleanup();
    const activeUser = window.currentUser || WorkHubAPI.getCurrentUser();
    const managerId  = activeUser?.id;

    const renderManagerProjects = async () => {
        const runningBody = document.getElementById('projects-table-body-running');
        const pendingBody = document.getElementById('projects-table-body-pending');
        if (!runningBody || !pendingBody) return;

        runningBody.innerHTML = `
            <tr><td colspan="7" class="text-center text-secondary py-4">
                <div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading running projects...
            </td></tr>
        `;
        pendingBody.innerHTML = `
            <tr><td colspan="7" class="text-center text-secondary py-4">
                <div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading pending projects...
            </td></tr>
        `;

        try {
            const data = await WorkHubAPI.getJSON('/projects/');
            let projects = Array.isArray(data) ? data : (data.results || []);

            // Filter by manager id
            projects = projects.filter(p => p.lead_manager === managerId);

            const runningProj = projects.filter(p => p.status === 'Active' || p.status === 'Completed');
            const pendingProj = projects.filter(p => p.status === 'Pending');

            // ── Render Running Projects ──────────────────────────────────
            runningBody.innerHTML = '';
            if (runningProj.length === 0) {
                runningBody.innerHTML = `
                    <tr><td colspan="7" class="text-center text-secondary py-4">No active or completed projects found.</td></tr>
                `;
            } else {
                runningProj.forEach(proj => {
                    let statusBadge = proj.status === 'Completed' ? 'badge-status-done' : 'badge-status-progress';
                    let progressColor = proj.status === 'Completed' ? 'bg-success' : 'bg-primary';
                    const managerName = proj.lead_manager_name || 'Unassigned';

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="fw-bold text-white">${proj.name}</td>
                        <td>
                            <div class="d-flex align-items-center gap-2">
                                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(managerName)}&background=random"
                                     class="rounded-circle" style="width:24px; height:24px;" alt="Manager">
                                <span>${managerName}</span>
                            </div>
                        </td>
                        <td><span class="text-secondary-custom">${proj.department_name || '—'}</span></td>
                        <td>${renderProjectDocumentCell(proj)}</td>
                        <td><span class="badge-custom ${statusBadge}">${proj.status}</span></td>
                        <td style="width: 200px;">
                            <div class="d-flex align-items-center gap-2">
                                <div class="progress flex-grow-1" style="height: 6px; background-color: var(--bg-input);">
                                    <div class="progress-bar ${progressColor}" role="progressbar"
                                         style="width: ${proj.progress}%;" aria-valuenow="${proj.progress}"
                                         aria-valuemin="0" aria-valuemax="100"
                                         aria-label="${proj.name} progress" title="${proj.name} progress: ${proj.progress}%"></div>
                                </div>
                                <span class="small font-weight-semibold" style="width:30px;">${proj.progress}%</span>
                            </div>
                        </td>
                        <td class="text-end">
                            <button class="btn btn-link text-secondary-custom p-0 edit-project-btn me-2"
                                    type="button" title="Update ${proj.name} progress" aria-label="Update ${proj.name} progress"
                                    data-id="${proj.id}" data-progress="${proj.progress}" data-status="${proj.status}">
                                <i class="fa-regular fa-edit"></i>
                            </button>
                            <button class="btn btn-link text-danger p-0 delete-project-btn" type="button"
                            title="Delete ${proj.name}" aria-label="Delete ${proj.name}" data-id="${proj.id}">
                                <i class="fa-regular fa-trash-can"></i>
                            </button>
                        </td>
                    `;
                    runningBody.appendChild(tr);
                });
            }

            // ── Render Pending Projects ──────────────────────────────────
            pendingBody.innerHTML = '';
            if (pendingProj.length === 0) {
                pendingBody.innerHTML = `
                    <tr><td colspan="7" class="text-center text-secondary py-4">No project requests awaiting approval.</td></tr>
                `;
            } else {
                pendingProj.forEach(proj => {
                    const managerName = proj.lead_manager_name || 'Unassigned';
                    const createdDate = proj.created_at ? new Date(proj.created_at).toLocaleDateString() : '—';

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="fw-bold text-white">${proj.name}</td>
                        <td>
                            <div class="d-flex align-items-center gap-2">
                                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(managerName)}&background=random"
                                     class="rounded-circle" style="width:24px; height:24px;" alt="Manager">
                                <span>${managerName}</span>
                            </div>
                        </td>
                        <td><span class="text-secondary-custom">${proj.department_name || '—'}</span></td>
                        <td>${renderProjectDocumentCell(proj)}</td>
                        <td><span class="badge-custom badge-status-todo">Pending Approval</span></td>
                        <td><span class="text-secondary-custom">${createdDate}</span></td>
                        <td class="text-end">
                            <button class="btn btn-link text-danger p-0 delete-project-btn" type="button"
                            title="Delete ${proj.name}" aria-label="Delete ${proj.name}" data-id="${proj.id}">
                                <i class="fa-regular fa-trash-can"></i>
                            </button>
                        </td>
                    `;
                    pendingBody.appendChild(tr);
                });
            }

            // ── Bind Edit Handlers for Running ───────────────────────────
            document.querySelectorAll('#projects-table-body-running .edit-project-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.dataset.id;
                    let progress = parseInt(btn.dataset.progress) || 0;
                    progress = Math.min(progress + 10, 100);
                    const newStatus = progress >= 100 ? 'Completed' : (progress > 0 ? 'Active' : 'Pending');

                    try {
                        await WorkHubAPI.patch(`/projects/${id}/`, {
                            progress,
                            status: newStatus
                        });
                        renderManagerProjects();
                    } catch (e) {
                        alert('Failed to update project.');
                    }
                });
            });

            // ── Bind Delete Handlers for Both ────────────────────────────
            document.querySelectorAll('.delete-project-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (!confirm('Delete this project?')) return;
                    const id = btn.dataset.id;
                    try {
                        await WorkHubAPI.delete(`/projects/${id}/`);
                        renderManagerProjects();
                    } catch (e) {
                        alert('Failed to delete project.');
                    }
                });
            });

            bindProjectDocumentPreview();

        } catch (err) {
            console.error('Manager projects load error:', err);
            runningBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Failed to load running projects.</td></tr>`;
            pendingBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Failed to load pending projects.</td></tr>`;
        }
    };

    await renderManagerProjects();

    // Prefill and lock manager field
    const managerSelect = document.getElementById('projectManager');
    if (managerSelect && activeUser) {
        managerSelect.innerHTML = `<option value="${managerId}">${activeUser.full_name || activeUser.name}</option>`;
        managerSelect.disabled = true;
    }

    // Load Departments dropdown for manager project launching
    const deptSelect = document.getElementById('projectDept');
    if (deptSelect) {
        try {
            const deptData = await WorkHubAPI.getJSON('/departments/');
            const departments = Array.isArray(deptData) ? deptData : (deptData.results || []);
            deptSelect.innerHTML = '<option value="" disabled selected>Select Department...</option>';
            departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.id;
                option.textContent = dept.name;
                deptSelect.appendChild(option);
            });
        } catch (e) {
            console.error('Failed to load project departments:', e);
        }
    }

    const addForm = document.getElementById('addProjectForm');
    if (addForm && !addForm.dataset.bound) {
        addForm.dataset.bound = 'true';
        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = addForm.querySelector('button[type="submit"]');
            const originalText = submitBtn?.innerHTML;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating...';
            }

            const name    = document.getElementById('projectName').value;
            const deptId  = document.getElementById('projectDept').value;
            const docFile = document.getElementById('projectDocument')?.files?.[0];
            const payload = {
                name,
                lead_manager: managerId,
                department: deptId || null,
                status: 'Pending',
                progress: 0
            };

            try {
                const resp = await postProjectPayload(payload, docFile);
                if (!resp.ok) {
                    alert(await parseProjectError(resp));
                    return;
                }
                addForm.reset();
                closeProjectModal();
                await renderManagerProjects();
            } catch (err) {
                console.error('Manager add project error:', err);
                alert('Network error.');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            }
        });
    }
};

// ── Employee My Projects Page ──────────────────────────────────────────────
window.PageModules['employee-myprojects'] = async function () {
    await renderProjectsCommon('projects-table-body');

    // Hide edit/delete column for read-only access
    setTimeout(() => {
        document.querySelectorAll('.table-custom th:last-child, .table-custom td:last-child')
            .forEach(el => { el.style.display = 'none'; });
    }, 100);
};
