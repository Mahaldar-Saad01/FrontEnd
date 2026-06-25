/**
 * Admin Dashboard Module
 * Fetches live stats from GET /api/dashboard/stats/ and renders
 * stat cards + Chart.js doughnut, bar charts, and sparklines.
 */
window.ChartTheme = {
    fontFamily: 'Outfit',
    primaryColor: '#6366f1',
    textColor: '#6b7280',
    gridColor: 'rgba(156,163,175,0.15)',
    success: '#4ade80',
    info: '#60a5fa',
    warning: '#fbbf24',
    purple: '#a78bfa'
};

Chart.defaults.font.family = window.ChartTheme.fontFamily;
Chart.defaults.color = window.ChartTheme.textColor;
window.PageModules['admin-dashboard'] = async function () {
    const statProjects    = document.getElementById("admin-stat-projects");
    const statApprovals   = document.getElementById("admin-stat-approvals");
    const statDepartments = document.getElementById("admin-stat-departments");
    const statEmployees   = document.getElementById("admin-stat-employees");

    // ── Cleanup old Chart.js instances ────────────────────────────
    if (window.adminCharts) {
        Object.values(window.adminCharts).forEach(c => c && c.destroy());
    }
    window.adminCharts = {};

    let data = {};
    try {
        data = await WorkHubAPI.getJSON('/dashboard/stats/');
    } catch (err) {
        console.error('Admin dashboard error (using fallback data):', err);
        data = {};
    }

    const hasProjectData = data.project_stats &&
        ((data.project_stats.completed || 0) + (data.project_stats.active || 0) + (data.project_stats.pending || 0)) > 0;
    const hasWorkloadData = data.dept_workload && data.dept_workload.length > 0;

    // ── Update stat cards ──────────────────────────────────────────
    if (statProjects)    statProjects.textContent    = data.total_projects    ?? 0;
    if (statApprovals)   statApprovals.textContent   = data.pending_approvals ?? 0;
    if (statDepartments) statDepartments.textContent = data.total_departments ?? 0;
    if (statEmployees)   statEmployees.textContent   = data.total_employees   ?? 0;

    // ── Sparklines ─────────────────────────────────────────────────
    // ✅ FIX: _renderSparkline's function declaration + closing brace had
    // been removed, leaving its body as a dangling statement outside any
    // function. That caused "Uncaught SyntaxError: Illegal return statement",
    // which stopped this entire script from executing — that's also why
    // the donut/bar charts below appeared broken and why no sparklines drew.
    _renderSparkline('spark-admin-projects',  [3, 4, 3, 5, 4, 5, 5], window.ChartTheme.primaryColor);
    _renderSparkline('spark-admin-approvals', [2, 1, 2, 1, 0, 1, 0], window.ChartTheme.success);
    _renderSparkline('spark-admin-depts',     [4, 4, 4, 4, 4, 4, 4], window.ChartTheme.info);
    _renderSparkline('spark-admin-employees', [9, 10, 10, 11, 11, 12, 12], window.ChartTheme.warning);

    const ps = data.project_stats || {};
    const completedCount = hasProjectData ? (ps.completed || 0) : 0;
    const activeCount    = hasProjectData ? (ps.active    || 0) : 0;
    const pendingCount   = hasProjectData ? (ps.pending   || 0) : 0;
    const notStarted     = 0;
    const total = completedCount + activeCount + pendingCount + notStarted;

    // ── Update legend percentages ──────────────────────────────────
    _setPct('admin-legend-completed',  completedCount, total);
    _setPct('admin-legend-active',     activeCount,    total);
    _setPct('admin-legend-pending',    pendingCount,   total);
    _setPct('admin-legend-notstarted', notStarted,     total);

    // ── Project Status Doughnut Chart ──────────────────────────────
    const projectCanvas = document.getElementById("admin-project-chart");
    if (projectCanvas) {
        window.adminCharts.project = new Chart(projectCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'In Progress', 'Pending', 'Not Started'],
                datasets: [{
                    data: [completedCount, activeCount, pendingCount, notStarted],
                    backgroundColor: ['#4ade80', '#60a5fa', '#a78bfa', '#fbbf24'],
                    borderColor: '#ffffff',
                    borderWidth: 3,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => ` ${ctx.label}: ${ctx.parsed} (${Math.round(ctx.parsed / total * 100)}%)`
                        }
                    }
                }
            }
        });
    }

    // ── Department Workload Bar Chart ───────────────────────────────
    const workloadCanvas = document.getElementById("admin-workload-chart");
    if (workloadCanvas) {
        const labels = hasWorkloadData
            ? data.dept_workload.map(d => d.name)
            : ['Engineering', 'Marketing', 'Design', 'HR'];
        const counts = hasWorkloadData
            ? data.dept_workload.map(d => d.task_count)
            : [3, 1, 1, 1];
        const barColors = ['#a78bfa', '#60a5fa', '#fbbf24', '#4ade80'];

        window.adminCharts.workload = new Chart(workloadCanvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Tasks Assigned',
                    data: counts,
                    backgroundColor: barColors,
                    borderColor: barColors,
                    borderWidth: 0,
                    borderRadius: 10,
                    maxBarThickness: 48
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y} tasks` } }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        ticks: { color: '#9ca3af', font: { family: 'Outfit' }, stepSize: 1 }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#6b7280', font: { family: 'Outfit', size: 12 } }
                    }
                }
            }
        });
    }
};

// ── Helpers ────────────────────────────────────────────────────────

// ✅ FIX: restored missing function wrapper (was previously a dangling
// body with no declaration, causing the SyntaxError on this file).
function _renderSparkline(id, dataPoints, color) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    new Chart(canvas, {
        type: 'line',
        data: {
            labels: dataPoints.map((_, i) => i),
            datasets: [{
                data: dataPoints,
                borderColor: color,
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                fill: true,
                backgroundColor: color + '18'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: { x: { display: false }, y: { display: false } },
            animation: { duration: 600 }
        }
    });
}

function _setPct(id, value, total) {
    const el = document.getElementById(id);
    if (el) el.textContent = total > 0 ? Math.round(value / total * 100) + '%' : '0%';
}