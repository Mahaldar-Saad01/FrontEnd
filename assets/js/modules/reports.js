/**
 * Reports Module — via /api/projects/ and /api/employees/
 * Renders report preview table and enables file export (CSV/JSON/TXT).
 * Preserves all UI structure and IDs from original design.
 */

const loadReportPreview = async (category) => {
    const titleEl = document.getElementById("report-preview-title");
    const headEl  = document.getElementById("report-preview-head");
    const bodyEl  = document.getElementById("report-preview-body");

    if (!headEl || !bodyEl) return;

    if (category === "projects") {
        if (titleEl) titleEl.textContent = "Project Status Summary Preview";
        headEl.innerHTML = `
            <tr>
                <th>Project Name</th>
                <th>Manager</th>
                <th>Department</th>
                <th>Progress</th>
                <th>Status</th>
            </tr>
        `;
        bodyEl.innerHTML = '<tr><td colspan="5" class="text-center text-secondary py-3"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading...</td></tr>';

        try {
            const data = await WorkHubAPI.getJSON('/projects/');
            const projects = Array.isArray(data) ? data : (data.results || []);

            bodyEl.innerHTML = projects.map(p => `
                <tr>
                    <td class="fw-bold text-white">${p.name}</td>
                    <td>${p.lead_manager_name || '—'}</td>
                    <td>${p.department_name || '—'}</td>
                    <td>${p.progress}%</td>
                    <td>
                        <span class="badge-custom ${p.status === 'Completed' ? 'badge-status-done' : 'badge-status-progress'}">
                            ${p.status}
                        </span>
                    </td>
                </tr>
            `).join('');

        } catch (err) {
            bodyEl.innerHTML = '<tr><td colspan="5" class="text-danger text-center py-3">Failed to load projects.</td></tr>';
        }

    } else if (category === "workload") {
        if (titleEl) titleEl.textContent = "Resource Allocation & Workloads Preview";
        headEl.innerHTML = `
            <tr>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Assigned Tasks</th>
                <th>Completeness</th>
            </tr>
        `;
        bodyEl.innerHTML = '<tr><td colspan="4" class="text-center text-secondary py-3"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading...</td></tr>';

        try {
            const [empData, taskData] = await Promise.all([
                WorkHubAPI.getJSON('/employees/'),
                WorkHubAPI.getJSON('/tasks/')
            ]);

            const employees = Array.isArray(empData) ? empData : (empData.results || []);
            const tasks     = Array.isArray(taskData) ? taskData : (taskData.results || []);

            bodyEl.innerHTML = employees.map(emp => {
                const empTasks  = tasks.filter(t => t.assignee === emp.id);
                const doneCount = empTasks.filter(t => t.status === 'done').length;
                const pct       = empTasks.length > 0 ? Math.round((doneCount / empTasks.length) * 100) : 0;
                return `
                    <tr>
                        <td class="fw-bold text-white">
                            <div class="d-flex align-items-center gap-2">
                                <img src="${emp.avatar_url}" class="rounded-circle"
                                     style="width:24px; height:24px;" alt="Avatar">
                                <span>${emp.full_name}</span>
                            </div>
                        </td>
                        <td>${emp.department_name || '—'}</td>
                        <td>${empTasks.length} Active</td>
                        <td>${pct}% Done</td>
                    </tr>
                `;
            }).join('');

        } catch (err) {
            bodyEl.innerHTML = '<tr><td colspan="4" class="text-danger text-center py-3">Failed to load workload data.</td></tr>';
        }

    } else {
        // Audit logs — static simulation
        if (titleEl) titleEl.textContent = "System Activity Audit Logs Preview";
        headEl.innerHTML = `
            <tr>
                <th>Timestamp</th>
                <th>User profile</th>
                <th>Action details</th>
                <th>IP Address</th>
            </tr>
        `;
        bodyEl.innerHTML = `
            <tr>
                <td class="text-secondary">2026-06-11 22:15:34</td>
                <td class="fw-bold text-white">Admin (${WorkHubAPI.getCurrentUser()?.name || 'Admin'})</td>
                <td>Loaded Department Configuration registry</td>
                <td class="text-muted">192.168.1.42</td>
            </tr>
            <tr>
                <td class="text-secondary">2026-06-11 20:44:12</td>
                <td class="fw-bold text-white">Manager (System)</td>
                <td>Updated task status: In Progress → Completed</td>
                <td class="text-muted">192.168.1.18</td>
            </tr>
            <tr>
                <td class="text-secondary">2026-06-11 19:12:05</td>
                <td class="fw-bold text-white">Employee (System)</td>
                <td>Opened in-call Standup simulator</td>
                <td class="text-muted">192.168.1.9</td>
            </tr>
        `;
    }
};

const setupReportGenerator = async () => {
    const typeSelect = document.getElementById("report-type");
    const form       = document.getElementById("report-generator-form");

    if (typeSelect) {
        typeSelect.addEventListener("change", (e) => {
            loadReportPreview(e.target.value);
        });
        loadReportPreview(typeSelect.value);
    }

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const type      = document.getElementById("report-type").value;
            const format    = document.getElementById("report-format").value;
            const submitBtn = document.getElementById("export-report-btn");

            if (!submitBtn) return;

            const origHtml = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>Exporting...`;

            let content  = "";
            let filename = `workhub_report_${type}_${Date.now()}`;

            try {
                if (type === "projects") {
                    const data     = await WorkHubAPI.getJSON('/projects/');
                    const projects = Array.isArray(data) ? data : (data.results || []);

                    if (format === "CSV") {
                        content  = "Project Name,Manager,Department,Progress,Status\n" +
                            projects.map(p => `"${p.name}","${p.lead_manager_name || ''}","${p.department_name || ''}",${p.progress},"${p.status}"`).join("\n");
                        filename += ".csv";
                    } else if (format === "JSON") {
                        content  = JSON.stringify(projects, null, 2);
                        filename += ".json";
                    } else {
                        content  = "WorkHub System Report\n===================\nReport type: Projects Summary\n\n" +
                            projects.map(p => `- ${p.name} | Lead: ${p.lead_manager_name || '—'} | Status: ${p.status} | Progress: ${p.progress}%`).join("\n");
                        filename += ".txt";
                    }

                } else if (type === "workload") {
                    const [empData, taskData] = await Promise.all([
                        WorkHubAPI.getJSON('/employees/'),
                        WorkHubAPI.getJSON('/tasks/')
                    ]);
                    const employees = Array.isArray(empData) ? empData : (empData.results || []);
                    const tasks     = Array.isArray(taskData) ? taskData : (taskData.results || []);

                    if (format === "CSV") {
                        content  = "Name,Email,Department,Role,Status,Active Tasks\n" +
                            employees.map(emp => {
                                const active = tasks.filter(t => t.assignee === emp.id && t.status !== 'done').length;
                                return `"${emp.full_name}","${emp.email}","${emp.department_name || ''}","${emp.role}","${emp.status}",${active}`;
                            }).join("\n");
                        filename += ".csv";
                    } else if (format === "JSON") {
                        content  = JSON.stringify(employees, null, 2);
                        filename += ".json";
                    } else {
                        content  = "WorkHub System Report\n===================\nReport type: Team Workload Summary\n\n" +
                            employees.map(emp => `- ${emp.full_name} | Dept: ${emp.department_name || '—'} | Status: ${emp.status}`).join("\n");
                        filename += ".txt";
                    }

                } else {
                    content  = "WorkHub Audit Logs Export\n\n- [2026-06-11 22:15] Admin: Access Department Registry\n- [2026-06-11 20:44] Manager: Finished Task update\n";
                    filename += format === "JSON" ? ".json" : (format === "CSV" ? ".csv" : ".txt");
                }

            } catch (err) {
                console.error('Report export error:', err);
                content  = "Export failed — please try again.";
                filename += ".txt";
            }

            // ── Trigger download ───────────────────────────────────
            setTimeout(() => {
                const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                const link = document.createElement("a");
                link.href  = URL.createObjectURL(blob);
                link.download = filename;
                link.click();
                URL.revokeObjectURL(link.href);

                submitBtn.disabled = false;
                submitBtn.innerHTML = origHtml;
            }, 600);
        });
    }
};

// ── Admin Reports view ─────────────────────────────────────────────────────
window.PageModules['admin-reports'] = function () {
    setupReportGenerator();
};

// ── Manager Reports view ───────────────────────────────────────────────────
window.PageModules['manager-reports'] = function () {
    setupReportGenerator();
};
