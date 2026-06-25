/**
 * Approvals Module
 * Admin only: fetches pending projects, displays details, and handles approval/rejection.
 */
window.PageModules['admin-approvals'] = async function () {
    const tableBody = document.getElementById('approvals-table-body');
    if (!tableBody) return;

    const renderApprovals = async () => {
        tableBody.innerHTML = `
            <tr><td colspan="6" class="text-center text-secondary py-4">
                <div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading pending projects...
            </td></tr>
        `;

        try {
            const data = await WorkHubAPI.getJSON('/projects/');
            const projects = Array.isArray(data) ? data : (data.results || []);
            
            // Filter to only Pending projects
            const pendingProjects = projects.filter(p => p.status === 'Pending');

            tableBody.innerHTML = '';

            if (pendingProjects.length === 0) {
                tableBody.innerHTML = `
                    <tr><td colspan="6" class="text-center text-secondary py-4">No project requests awaiting approval.</td></tr>
                `;
                return;
            }

            pendingProjects.forEach(proj => {
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
                    <td><span class="badge-custom badge-status-todo">Pending Approval</span></td>
                    <td><span class="text-secondary-custom">${createdDate}</span></td>
                    <td class="text-end">
                        <div class="d-flex align-items-center justify-content-end gap-2">
                            <button class="btn btn-sm btn-success approve-btn px-3 py-1" ...>
                                <i class="fa-solid fa-check me-1"></i> Approve
                            </button>
                            <button class="btn btn-sm btn-danger reject-btn px-3 py-1" ...>
                                <i class="fa-solid fa-xmark me-1"></i> Reject
                            </button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(tr);
            });

            // Bind click handlers
            document.querySelectorAll('.approve-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.dataset.id;
                    if (!confirm('Are you sure you want to approve and launch this project?')) return;
                    try {
                        const resp = await WorkHubAPI.patch(`/projects/${id}/`, { status: 'Active' });
                        if (resp.ok || resp.status < 300) {
                            renderApprovals();
                        } else {
                            alert('Failed to approve project.');
                        }
                    } catch (e) {
                        alert('Failed to approve project.');
                    }
                });
            });

            document.querySelectorAll('.reject-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.dataset.id;
                    if (!confirm('Are you sure you want to reject and delete this project request?')) return;
                    try {
                        await WorkHubAPI.delete(`/projects/${id}/`);
                        renderApprovals();
                    } catch (e) {
                        alert('Failed to reject project request.');
                    }
                });
            });

        } catch (err) {
            console.error('Approvals load error:', err);
            tableBody.innerHTML = `
                <tr><td colspan="6" class="text-center text-danger py-4">
                    Failed to load pending projects. Check API connection.
                </td></tr>
            `;
        }
    };

    await renderApprovals();
};
