/**
 * Employee Dashboard Module
 * Fetches live stats from GET /api/dashboard/stats/ (employee-scoped).
 */
window.PageModules['employee-dashboard'] = async function () {
    const statProjects  = document.getElementById("emp-stat-projects");
    const statTasks     = document.getElementById("emp-stat-tasks");
    const statCompleted = document.getElementById("emp-stat-completed");
    const statHours     = document.getElementById("emp-stat-hours");

    // ── Cleanup old Chart.js instances ────────────────────────────
    if (window.empCharts) {
        Object.values(window.empCharts).forEach(c => c && c.destroy());
    }
    window.empCharts = {};

    let data = {};
    try {
        data = await WorkHubAPI.getJSON('/dashboard/stats/');
    } catch (err) {
        console.error('Employee dashboard error (using fallback data):', err);
        data = {};
    }

    const ts = data.task_stats || {};
    const rawData = [ts.done || 0, ts.progress || 0, ts.review || 0, ts.todo || 0];
    const total = rawData.reduce((s, v) => s + (Number(v) || 0), 0);
    const displayData = rawData;
    const displayTotal = displayData.reduce((s, v) => s + v, 0);

    // ── Update stat cards ──────────────────────────────────────────
    if (statProjects)  statProjects.textContent  = data.total_projects  ?? 0;
    if (statTasks)     statTasks.textContent     = data.total_tasks     ?? 0;
    if (statCompleted) statCompleted.textContent = data.completed_tasks ?? (ts.done || 0);
    if (statHours)     statHours.textContent     = 0;

    // ── Sparklines ─────────────────────────────────────────────────
    // ✅ FIX: same restored _renderSparkline function as admin/manager
    // dashboards (was previously broken, causing SyntaxError + no sparklines).
    _renderSparkline('spark-emp-projects',  [1, 2, 2, 2, 2, 2, 2], window.ChartTheme?.primaryColor || '#6366f1');
    _renderSparkline('spark-emp-tasks',     [1, 2, 2, 3, 3, 3, 3], window.ChartTheme?.success || '#4ade80');
    _renderSparkline('spark-emp-completed', [0, 0, 1, 1, 1, 1, 1], window.ChartTheme?.info || '#60a5fa');
    _renderSparkline('spark-emp-hours',     [6, 7, 8, 7, 8, 8, 8], window.ChartTheme?.warning || '#fbbf24');

    // ── Update legend percentages ──────────────────────────────────
    const legendIds = ['emp-legend-done','emp-legend-progress','emp-legend-review','emp-legend-todo'];
    legendIds.forEach((id, i) => _setPct(id, displayData[i], displayTotal));

    // ── Task Status Doughnut Chart ──────────────────────────────────
    const taskCanvas = document.getElementById("emp-task-chart");
    if (taskCanvas) {
        window.empCharts.task = new Chart(taskCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'In Progress', 'In Review', 'To Do'],
                datasets: [{
                    data: displayData,
                    backgroundColor: ['#4ade80', '#22d3ee', '#a78bfa', '#9ca3af'],
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
                            label: (ctx) => ` ${ctx.label}: ${ctx.parsed}`
                        }
                    }
                }
            }
        });
    }

    // ── Work Hours Bar Chart ─────────────────────────────────────────
    const hoursCanvas = document.getElementById("emp-hours-chart");
    if (hoursCanvas) {
        const barColors = ['#a78bfa', '#60a5fa', '#4ade80', '#fbbf24', '#f87171'];
        window.empCharts.hours = new Chart(hoursCanvas, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                datasets: [{
                    label: 'Hours Logged',
                    data: [8, 8.5, 9, 8, 4.5],
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
                    tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y}h logged` } }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        ticks: { color: '#9ca3af', font: { family: 'Outfit' } }
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

// ✅ FIX: restored missing function wrapper.
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