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
        if (window.empCharts.task)  window.empCharts.task.destroy();
        if (window.empCharts.hours) window.empCharts.hours.destroy();
    }
    window.empCharts = { task: null, hours: null };

    try {
        const data = await WorkHubAPI.getJSON('/dashboard/stats/');

        const ts = data.task_stats || {};
        const doneCount     = ts.done     || 0;
        const progressCount = ts.progress || 0;
        const reviewCount   = ts.review   || 0;
        const todoCount     = ts.todo     || 0;

        // ── Update stat cards ──────────────────────────────────────
        if (statProjects)  statProjects.textContent  = data.total_projects  ?? 0;
        if (statTasks)     statTasks.textContent     = data.total_tasks     ?? 0;
        if (statCompleted) statCompleted.textContent = data.completed_tasks ?? doneCount;
        if (statHours)     statHours.textContent     = 38; // Placeholder — no hours model yet

        // ── Task Status Doughnut Chart ─────────────────────────────
        const taskCanvas = document.getElementById("emp-task-chart");
        if (taskCanvas) {
            window.empCharts.task = new Chart(taskCanvas, {
                type: 'doughnut',
                data: {
                    labels: ['Completed', 'In Progress', 'In Review', 'To Do'],
                    datasets: [{
                        data: [doneCount, progressCount, reviewCount, todoCount],
                        backgroundColor: ['#10b981', '#06b6d4', '#6366f1', '#6b7280'],
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

        // ── Work Hours Bar Chart (static placeholder) ──────────────
        const hoursCanvas = document.getElementById("emp-hours-chart");
        if (hoursCanvas) {
            window.empCharts.hours = new Chart(hoursCanvas, {
                type: 'bar',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                    datasets: [{
                        label: 'Hours Logged',
                        data: [8, 8.5, 9, 8, 4.5],
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
        console.error('Employee dashboard error:', err);
    }
};
