/**
 * Manager Reviews Module
 * Fetches all project tasks and filters those in 'review' status.
 * Allows managers to read the employee's submitted report and raise the proceed flag.
 */
(function () {
    'use strict';

    const renderReviews = async () => {
        const tableBody = document.getElementById('reviews-table-body');
        if (!tableBody) return;

        tableBody.innerHTML = `
            <tr><td colspan="6" class="text-center text-secondary py-4">
                <div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading reviews...
            </td></tr>
        `;

        try {
            const data = await WorkHubAPI.getJSON('/tasks/');
            const tasks = Array.isArray(data) ? data : (data.results || []);
            
            // Filter tasks that are in 'review' status
            const reviews = tasks.filter(t => t.status === 'review');

            tableBody.innerHTML = '';

            if (reviews.length === 0) {
                tableBody.innerHTML = `
                    <tr><td colspan="6" class="text-center text-secondary py-4">No reviews pending.</td></tr>
                `;
                return;
            }

            reviews.forEach(task => {
                const tr = document.createElement('tr');
                
                // Format dates or use raw date
                const dateStr = task.updated_at ? new Date(task.updated_at).toLocaleDateString() : '—';
                
                // Truncate report for display
                const rawReport = task.report || '';
                const displayReport = rawReport.length > 60 ? rawReport.substring(0, 60) + '...' : rawReport;

                tr.innerHTML = `
                    <td class="fw-semibold text-white">${task.title}</td>
                    <td><span class="text-white">${task.assignee_name || 'Unassigned'}</span></td>
                    <td><span class="text-secondary-custom">${task.project_name || '—'}</span></td>
                    <td>
                        <span class="text-muted-custom font-size-sm">${displayReport || '<em class="text-muted">No report provided</em>'}</span>
                        ${rawReport.length > 60 ? `<button class="btn btn-link text-primary p-0 ms-1 font-size-xs view-report-link" data-id="${task.id}" data-title="${task.title}" data-assignee="${task.assignee_name}" data-report="${encodeURIComponent(rawReport)}">Read more</button>` : ''}
                    </td>
                    <td><span class="text-muted-custom font-size-sm">${dateStr}</span></td>
                    <td class="text-end">
                        <div class="d-flex justify-content-end gap-2">
                            ${rawReport.length <= 60 && rawReport.length > 0 ? `
                                <button class="btn btn-secondary-custom btn-sm py-1 px-2 font-size-xs view-report-link" data-id="${task.id}" data-title="${task.title}" data-assignee="${task.assignee_name}" data-report="${encodeURIComponent(rawReport)}">
                                    <i class="fa-regular fa-file-lines"></i> View Report
                                </button>
                            ` : ''}
                            <button class="btn btn-success-custom btn-sm py-1 px-2 font-size-xs raise-flag-btn" data-id="${task.id}" data-title="${task.title}">
                                <i class="fa-solid fa-flag"></i> Proceed
                            </button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(tr);
            });

            // Add event listeners for Read more / View Report buttons
            document.querySelectorAll('.view-report-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const taskId = link.dataset.id;
                    const title = link.dataset.title;
                    const assignee = link.dataset.assignee;
                    const report = decodeURIComponent(link.dataset.report);

                    document.getElementById('reportModalTaskTitle').textContent = title;
                    document.getElementById('reportModalAssignee').textContent = assignee;
                    document.getElementById('reportModalContent').textContent = report;
                    
                    // Set dataset of proceed button inside modal
                    const modalProceedBtn = document.getElementById('reportModalProceedBtn');
                    if (modalProceedBtn) {
                        modalProceedBtn.dataset.id = taskId;
                        modalProceedBtn.dataset.title = title;
                    }

                    const modal = new bootstrap.Modal(document.getElementById('viewReportModal'));
                    modal.show();
                });
            });

            // Add event listeners for Raise Proceed Flag buttons
            document.querySelectorAll('.raise-flag-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const taskId = btn.dataset.id;
                    const title = btn.dataset.title;
                    if (!confirm(`Are you sure you want to raise the proceed flag and approve the task "${title}"?`)) return;
                    
                    try {
                        const resp = await WorkHubAPI.patch(`/tasks/${taskId}/`, {
                            proceed_flag: true,
                            status: 'done'
                        });
                        
                        if (!resp.ok) {
                            const err = await resp.text();
                            alert(`Failed to approve task: ${err}`);
                            return;
                        }
                        
                        renderReviews();
                    } catch (e) {
                        alert('Network error.');
                    }
                });
            });

        } catch (err) {
            console.error('Reviews load error:', err);
            tableBody.innerHTML = `
                <tr><td colspan="6" class="text-center text-danger py-4">Failed to load reviews.</td></tr>
            `;
        }
    };

    window.PageModules['manager-reviews'] = function () {
        renderReviews();
        
        // Bind modal proceed button once
        const modalProceedBtn = document.getElementById('reportModalProceedBtn');
        if (modalProceedBtn && !modalProceedBtn.dataset.bound) {
            modalProceedBtn.dataset.bound = 'true';
            modalProceedBtn.addEventListener('click', async () => {
                const taskId = modalProceedBtn.dataset.id;
                const title = modalProceedBtn.dataset.title;
                
                try {
                    const resp = await WorkHubAPI.patch(`/tasks/${taskId}/`, {
                        proceed_flag: true,
                        status: 'done'
                    });
                    
                    if (!resp.ok) {
                        const err = await resp.text();
                        alert(`Failed to approve task: ${err}`);
                        return;
                    }
                    
                    // Close modal
                    const modalEl = document.getElementById('viewReportModal');
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                    
                    renderReviews();
                } catch (e) {
                    alert('Network error.');
                }
            });
        }
    };

})();
