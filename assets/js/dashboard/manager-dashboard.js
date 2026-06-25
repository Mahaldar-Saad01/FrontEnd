/**
 * Manager Dashboard Module
 * Fetches live stats from GET /api/dashboard/stats/ (manager-scoped).
 */
window.PageModules['manager-dashboard'] = async function () {
    const statProjects = document.getElementById("mgr-stat-projects");
    const statTasks    = document.getElementById("mgr-stat-tasks");
    const statSize     = document.getElementById("mgr-stat-size");
    const statReviews  = document.getElementById("mgr-stat-reviews");

    // ── Cleanup old Chart.js instances ────────────────────────────
    if (window.mgrCharts) {
        Object.values(window.mgrCharts).forEach(c => c && c.destroy());
    }
    window.mgrCharts = {};

    let data = {};
    try {
        data = await WorkHubAPI.getJSON('/dashboard/stats/');
    } catch (err) {
        console.error('Manager dashboard error (using fallback data):', err);
        data = {};
    }

    const ts = data.task_stats || {};
    const rawData = [ts.done || 0, ts.progress || 0, ts.review || 0, ts.todo || 0];
    const total = rawData.reduce((s, v) => s + (Number(v) || 0), 0);
    const displayData = rawData;
    const displayTotal = displayData.reduce((s, v) => s + v, 0);

    // ── Update stat cards ──────────────────────────────────────────
    if (statProjects) statProjects.textContent = data.total_projects  ?? 0;
    if (statTasks)    statTasks.textContent    = data.total_tasks     ?? 0;
    if (statSize)     statSize.textContent     = data.team_size       ?? 0;
    if (statReviews)  statReviews.textContent  = data.reviews_pending ?? (ts.review || 0);

    // ── Sparklines ─────────────────────────────────────────────────
    // ✅ FIX: same restored _renderSparkline function as the other
    // dashboards (was previously broken, causing SyntaxError + no sparklines).
    _renderSparkline('spark-mgr-projects', [2, 2, 2, 2, 2, 2, 2], window.ChartTheme?.primaryColor || '#6366f1');
    _renderSparkline('spark-mgr-tasks',    [9, 10, 10, 11, 12, 12, 12], window.ChartTheme?.success || '#4ade80');
    _renderSparkline('spark-mgr-size',     [3, 3, 3, 3, 3, 3, 3], window.ChartTheme?.info || '#60a5fa');
    _renderSparkline('spark-mgr-reviews',  [2, 1, 2, 1, 1, 1, 1], window.ChartTheme?.warning || '#fbbf24');

    // ── Update legend percentages ──────────────────────────────────
    const legendIds = ['mgr-legend-done','mgr-legend-progress','mgr-legend-review','mgr-legend-todo'];
    legendIds.forEach((id, i) => _setPct(id, displayData[i], displayTotal));

    // ── Team Task Doughnut Chart ────────────────────────────────────
    const taskCanvas = document.getElementById("mgr-task-chart");
    if (taskCanvas) {
        window.mgrCharts.task = new Chart(taskCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'In Progress', 'In Review', 'To Do'],
                datasets: [{
                    data: displayData,
                    backgroundColor: ['#4ade80', '#60a5fa', '#a78bfa', '#9ca3af'],
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

    // ── Sprint Burndown Velocity Chart ──────────────────────────────
    const velocityCanvas = document.getElementById("mgr-velocity-chart");
    if (velocityCanvas) {
        window.mgrCharts.velocity = new Chart(velocityCanvas, {
            type: 'line',
            data: {
                labels: ['Day 1', 'Day 3', 'Day 5', 'Day 7', 'Day 9', 'Day 11', 'Day 13'],
                datasets: [{
                    label: 'Remaining Tasks',
                    data: [15, 12, 10, 8, 4, 3, 1],
                    borderColor: '#a78bfa',
                    backgroundColor: 'rgba(167, 139, 250, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2.5,
                    pointBackgroundColor: '#a78bfa',
                    pointRadius: 4
                }, {
                    label: 'Ideal Burndown',
                    data: [15, 12.8, 10.6, 8.4, 6.2, 4, 1.8],
                    borderColor: 'rgba(156, 163, 175, 0.5)',
                    borderDash: [5, 5],
                    tension: 0,
                    fill: false,
                    borderWidth: 1.5,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#6b7280', font: { family: 'Outfit', size: 11 }, usePointStyle: true, pointStyleWidth: 8 }
                    }
                },
                scales: {
                    y: {
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        ticks: { color: '#9ca3af', font: { family: 'Outfit' } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#6b7280', font: { family: 'Outfit', size: 11 } }
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