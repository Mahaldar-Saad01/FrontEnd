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
        if (window.mgrCharts.task)     window.mgrCharts.task.destroy();
        if (window.mgrCharts.velocity) window.mgrCharts.velocity.destroy();
    }
    window.mgrCharts = { task: null, velocity: null };

    try {
        const data = await WorkHubAPI.getJSON('/dashboard/stats/');

        const ts = data.task_stats || {};
        const doneCount     = ts.done     || 0;
        const progressCount = ts.progress || 0;
        const reviewCount   = ts.review   || 0;
        const todoCount     = ts.todo     || 0;

        // ── Update stat cards ──────────────────────────────────────
        if (statProjects) statProjects.textContent = data.total_projects   ?? 0;
        if (statTasks)    statTasks.textContent    = data.total_tasks      ?? 0;
        if (statSize)     statSize.textContent     = data.team_size        ?? 0;
        if (statReviews)  statReviews.textContent  = data.reviews_pending  ?? reviewCount;

        // ── Team Task Doughnut Chart ───────────────────────────────
        const taskCanvas = document.getElementById("mgr-task-chart");
        if (taskCanvas) {
            const rawData = [doneCount, progressCount, reviewCount, todoCount];
            const total = rawData.reduce((s, v) => s + (Number(v) || 0), 0);
            const displayData = total === 0 ? [4, 3, 2, 1] : rawData; // Fallback

            window.mgrCharts.task = new Chart(taskCanvas, {
                type: 'doughnut',
                data: {
                    labels: ['Completed', 'In Progress', 'In Review', 'To Do'],
                    datasets: [{
                        data: displayData,
                        backgroundColor: ['#10b981', '#06b6d4', '#6366f1', '#6b7280'],
                        borderColor: '#0b0f19',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#9ca3af', font: { family: 'Outfit', size: 12 } }
                        },
                        tooltip: {
                            callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}` }
                        }
                    }
                }
            });
        }

        // ── Sprint Burndown Velocity Chart (static shape) ──────────
        const velocityCanvas = document.getElementById("mgr-velocity-chart");
        if (velocityCanvas) {
            window.mgrCharts.velocity = new Chart(velocityCanvas, {
                type: 'line',
                data: {
                    labels: ['Day 1', 'Day 3', 'Day 5', 'Day 7', 'Day 9', 'Day 11', 'Day 13'],
                    datasets: [{
                        label: 'Remaining Tasks',
                        data: [15, 12, 10, 8, 4, 3, 1],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16,185,129,0.05)',
                        tension: 0.3, fill: true, borderWidth: 2
                    }, {
                        label: 'Ideal Burndown',
                        data: [15, 12.8, 10.6, 8.4, 6.2, 4, 1.8],
                        borderColor: 'rgba(255,255,255,0.15)',
                        borderDash: [5, 5],
                        tension: 0, fill: false, borderWidth: 1.5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#9ca3af', font: { family: 'Outfit', size: 11 } }
                        }
                    },
                    scales: {
                        y: {
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { color: '#9ca3af', font: { family: 'Outfit' } }
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
        console.error('Manager dashboard error:', err);
    }
};
