/**
 * Admin Dashboard Module
 * Fetches live stats from GET /api/dashboard/stats/ and renders
 * stat cards + Chart.js doughnut and bar charts.
 */
window.PageModules['admin-dashboard'] = async function () {
    const statProjects    = document.getElementById("admin-stat-projects");
    const statApprovals   = document.getElementById("admin-stat-approvals");
    const statDepartments = document.getElementById("admin-stat-departments");
    const statEmployees   = document.getElementById("admin-stat-employees");

    // ── Cleanup old Chart.js instances ────────────────────────────
    if (window.adminCharts) {
        if (window.adminCharts.project)  window.adminCharts.project.destroy();
        if (window.adminCharts.workload) window.adminCharts.workload.destroy();
    }
    window.adminCharts = { project: null, workload: null };

    try {
        const data = await WorkHubAPI.getJSON('/dashboard/stats/');

        // ── Update stat cards ──────────────────────────────────────
        if (statProjects)    statProjects.textContent    = data.total_projects    ?? 0;
        if (statApprovals)   statApprovals.textContent   = data.pending_approvals ?? 0;
        if (statDepartments) statDepartments.textContent = data.total_departments ?? 0;
        if (statEmployees)   statEmployees.textContent   = data.total_employees   ?? 0;

        const ps = data.project_stats || {};
        const completedCount = ps.completed || 0;
        const activeCount    = ps.active    || 0;
        const pendingCount   = ps.pending   || 0;

        // ── Project Status Doughnut Chart ──────────────────────────
        const projectCanvas = document.getElementById("admin-project-chart");
        if (projectCanvas) {
            window.adminCharts.project = new Chart(projectCanvas, {
                type: 'doughnut',
                data: {
                    labels: ['Completed', 'Active', 'Pending'],
                    datasets: [{
                        data: [completedCount, activeCount, pendingCount],
                        backgroundColor: ['#10b981', '#6366f1', '#f59e0b'],
                        borderColor: '#111827',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#9ca3af', font: { family: 'Outfit', size: 12 } }
                        }
                    }
                }
            });
        }

        // ── Department Workload Bar Chart ──────────────────────────
        const workloadCanvas = document.getElementById("admin-workload-chart");
        if (workloadCanvas && data.dept_workload && data.dept_workload.length > 0) {
            const labels = data.dept_workload.map(d => d.name);
            const counts = data.dept_workload.map(d => d.task_count);

            window.adminCharts.workload = new Chart(workloadCanvas, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Tasks Assigned',
                        data: counts,
                        backgroundColor: 'rgba(99, 102, 241, 0.65)',
                        borderColor: '#6366f1',
                        borderWidth: 1,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { color: '#9ca3af', font: { family: 'Outfit' }, stepSize: 1 }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#9ca3af', font: { family: 'Outfit' } }
                        }
                    }
                }
            });
        }

    } catch (err) {
        console.error('Admin dashboard error:', err);
        // Stat cards show 0 if API unavailable — charts stay empty
    }
};
