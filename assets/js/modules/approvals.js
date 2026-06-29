/**
 * Approvals Module
 * Admin only: fetches pending projects, displays details, and handles approval/rejection.
 */

const escapeApprovalAttr = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const getApprovalOriginalDocumentUrl = (proj) => proj.original_document_url || proj.project_document_url || proj.original_document || proj.project_document || '';
const getApprovalPreviewDocumentUrl = (proj) => proj.preview_document_url || proj.preview_document || getApprovalOriginalDocumentUrl(proj);

const renderApprovalDocumentCell = (proj) => {
    const originalUrl = getApprovalOriginalDocumentUrl(proj);
    const previewUrl = getApprovalPreviewDocumentUrl(proj);
    if (!originalUrl) {
        return '<span class="text-secondary-custom">No docs</span>';
    }
    const fileName = proj.original_document_name || proj.project_document_name || originalUrl.split('/').pop() || 'Project document';
    return `
        <div class="d-flex flex-wrap align-items-center gap-2">
            <button class="btn btn-sm btn-primary-custom view-approval-doc-btn"
                    type="button"
                    data-preview-url="${escapeApprovalAttr(previewUrl)}"
                    data-original-url="${escapeApprovalAttr(originalUrl)}"
                    data-doc-title="${escapeApprovalAttr(fileName)}">
                <i class="fa-regular fa-eye me-1"></i>View Document
            </button>
            <a href="${escapeApprovalAttr(originalUrl)}" target="_blank" rel="noopener" download
               class="btn btn-sm btn-secondary-custom">
                <i class="fa-solid fa-download me-1"></i>Download Original
            </a>
        </div>
    `;
};

const bindApprovalDocumentPreview = () => {
    const previewModals = Array.from(document.querySelectorAll('#approvalDocumentPreviewModal'));
    const modalEl = previewModals[0];
    previewModals.slice(1).forEach(el => el.remove());
    const iframe = document.getElementById('approvalDocumentPreviewFrame');
    const titleEl = document.getElementById('approvalDocumentPreviewTitle');
    const loadingEl = document.getElementById('approvalDocumentPreviewLoading');
    const downloadLink = document.getElementById('approvalDocumentDownloadLink');
    const openLink = document.getElementById('approvalDocumentOpenLink');
    if (!modalEl || !iframe || !window.bootstrap) return;

    if (modalEl.parentElement !== document.body) {
        document.body.appendChild(modalEl);
    }

    document.querySelectorAll('.view-approval-doc-btn').forEach(btn => {
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

window.PageModules['admin-approvals'] = async function () {
    const tableBody = document.getElementById('approvals-table-body');
    if (!tableBody) return;

    const renderApprovals = async () => {
        tableBody.innerHTML = `
            <tr><td colspan="7" class="text-center text-secondary py-4">
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
                    <tr><td colspan="7" class="text-center text-secondary py-4">No project requests awaiting approval.</td></tr>
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
                    <td>${renderApprovalDocumentCell(proj)}</td>
                    <td><span class="badge-custom badge-status-todo">Pending Approval</span></td>
                    <td><span class="text-secondary-custom">${createdDate}</span></td>
                    <td class="text-end">
                        <div class="d-flex align-items-center justify-content-end gap-2">
                            <button class="btn btn-sm btn-success approve-btn px-3 py-1" data-id="${proj.id}">
                                <i class="fa-solid fa-check me-1"></i> Approve
                            </button>
                            <button class="btn btn-sm btn-danger reject-btn px-3 py-1" data-id="${proj.id}">
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
                    if (!id) {
                        alert('Cannot approve this project because its ID is missing. Please refresh and try again.');
                        return;
                    }
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
                    if (!id) {
                        alert('Cannot reject this project because its ID is missing. Please refresh and try again.');
                        return;
                    }
                    if (!confirm('Are you sure you want to reject and delete this project request?')) return;
                    try {
                        await WorkHubAPI.delete(`/projects/${id}/`);
                        renderApprovals();
                    } catch (e) {
                        alert('Failed to reject project request.');
                    }
                });
            });

            bindApprovalDocumentPreview();

        } catch (err) {
            console.error('Approvals load error:', err);
            tableBody.innerHTML = `
                <tr><td colspan="7" class="text-center text-danger py-4">
                    Failed to load pending projects. Check API connection.
                </td></tr>
            `;
        }
    };

    await renderApprovals();
};
