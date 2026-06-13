// Reports Module Initializer (Handles admin and manager reports views)

const loadReportPreview = (category) => {
    const titleEl = document.getElementById("report-preview-title");
    const headEl = document.getElementById("report-preview-head");
    const bodyEl = document.getElementById("report-preview-body");

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
        const projects = JSON.parse(localStorage.getItem("workhub_projects")) || [];
        bodyEl.innerHTML = projects.map(p => `
            <tr>
                <td class="fw-bold text-white">${p.name}</td>
                <td>${p.manager}</td>
                <td>${p.dept}</td>
                <td>${p.progress}%</td>
                <td><span class="badge-custom ${p.status === 'Completed' ? 'badge-status-done' : 'badge-status-progress'}">${p.status}</span></td>
            </tr>
        `).join("");
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
        const employees = JSON.parse(localStorage.getItem("workhub_employees")) || [];
        const tasks = JSON.parse(localStorage.getItem("workhub_tasks")) || [];

        bodyEl.innerHTML = employees.map(emp => {
            const empTasks = tasks.filter(t => t.assignedTo === emp.name);
            const doneCount = empTasks.filter(t => t.status === 'done').length;
            const pct = empTasks.length > 0 ? Math.round((doneCount / empTasks.length) * 100) : 0;
            return `
                <tr>
                    <td class="fw-bold text-white">${emp.name}</td>
                    <td>${emp.dept}</td>
                    <td>${empTasks.length} Active</td>
                    <td>${pct}% Done</td>
                </tr>
            `;
        }).join("");
    } else {
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
                <td class="fw-bold text-white">Saad Mahaldar (Admin)</td>
                <td>Loaded Department Configuration registry</td>
                <td class="text-muted">192.168.1.42</td>
            </tr>
            <tr>
                <td class="text-secondary">2026-06-11 20:44:12</td>
                <td class="fw-bold text-white">Sarah Miller (Manager)</td>
                <td>Completed task "Configure MySQL schemas"</td>
                <td class="text-muted">192.168.1.18</td>
            </tr>
            <tr>
                <td class="text-secondary">2026-06-11 19:12:05</td>
                <td class="fw-bold text-white">Alex Mercer (Employee)</td>
                <td>Opened in-call Standup simulator</td>
                <td class="text-muted">192.168.1.9</td>
            </tr>
        `;
    }
};

const setupReportGenerator = () => {
    const typeSelect = document.getElementById("report-type");
    const form = document.getElementById("report-generator-form");

    if (typeSelect) {
        typeSelect.addEventListener("change", (e) => {
            loadReportPreview(e.target.value);
        });
        loadReportPreview(typeSelect.value);
    }

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const type = document.getElementById("report-type").value;
            const format = document.getElementById("report-format").value;
            const submitBtn = document.getElementById("export-report-btn");

            if (!submitBtn) return;

            // Trigger download simulation loading state
            const origHtml = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Exporting...`;

            setTimeout(() => {
                // Generate download files
                let content = "";
                let filename = `workhub_report_${type}_${Date.now()}`;

                if (type === "projects") {
                    const projects = JSON.parse(localStorage.getItem("workhub_projects")) || [];
                    if (format === "CSV") {
                        content = "Project Name,Manager,Department,Progress,Status\n" + 
                            projects.map(p => `"${p.name}","${p.manager}","${p.dept}",${p.progress},"${p.status}"`).join("\n");
                        filename += ".csv";
                    } else if (format === "JSON") {
                        content = JSON.stringify(projects, null, 2);
                        filename += ".json";
                    } else {
                        content = "WorkHub System Report\n===================\nReport type: Projects Summary\n\n" + 
                            projects.map(p => `- ${p.name} | Lead: ${p.manager} | Status: ${p.status} | Progress: ${p.progress}%`).join("\n");
                        filename += ".txt";
                    }
                } else if (type === "workload") {
                    const employees = JSON.parse(localStorage.getItem("workhub_employees")) || [];
                    if (format === "CSV") {
                        content = "Name,Email,Department,Status\n" + 
                            employees.map(e => `"${e.name}","${e.email}","${e.dept}","${e.status}"`).join("\n");
                        filename += ".csv";
                    } else if (format === "JSON") {
                        content = JSON.stringify(employees, null, 2);
                        filename += ".json";
                    } else {
                        content = "WorkHub System Report\n===================\nReport type: Team Workload Summary\n\n" + 
                            employees.map(e => `- ${e.name} | Dept: ${e.dept} | Status: ${e.status}`).join("\n");
                        filename += ".txt";
                    }
                } else {
                    content = "WorkHub Audit Logs Export\n\n- [2026-06-11 22:15] Saad Mahaldar: Access Department Registry\n- [2026-06-11 20:44] Sarah Miller: Finished Task mysql config\n";
                    filename += format === "JSON" ? ".json" : (format === "CSV" ? ".csv" : ".txt");
                }

                // Browser file download trigger
                const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                link.click();
                URL.revokeObjectURL(link.href);

                // Restore button
                submitBtn.disabled = false;
                submitBtn.innerHTML = origHtml;
            }, 1500);
        });
    }
};

// Admin Reports view
window.PageModules['admin-reports'] = function() {
    setupReportGenerator();
};

// Manager Reports view
window.PageModules['manager-reports'] = function() {
    setupReportGenerator();
};
