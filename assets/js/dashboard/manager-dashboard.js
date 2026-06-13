// Manager Dashboard Module Initializer
window.PageModules['manager-dashboard'] = function() {
    const statProjects = document.getElementById("mgr-stat-projects");
    const statTasks = document.getElementById("mgr-stat-tasks");
    const statSize = document.getElementById("mgr-stat-size");
    const statReviews = document.getElementById("mgr-stat-reviews");

    const activeUser = window.currentUser || JSON.parse(localStorage.getItem("currentUser"));
    const managerName = activeUser ? activeUser.name : "Sarah Miller";

    // Retrieve datasets
    const projects = JSON.parse(localStorage.getItem("workhub_projects")) || [];
    const tasks = JSON.parse(localStorage.getItem("workhub_tasks")) || [];
    const employees = JSON.parse(localStorage.getItem("workhub_employees")) || [];

    // Filter projects lead by this manager
    const teamProjects = projects.filter(p => p.manager.toLowerCase() === managerName.toLowerCase());
    const projectNames = teamProjects.map(p => p.name);

    // Filter tasks belonging to team projects
    const teamTasks = tasks.filter(t => projectNames.includes(t.project));

    // Filter employees in same department (e.g. Engineering)
    const teamSize = employees.filter(e => e.dept === "Engineering" && e.role !== "admin").length;

    // Filter reviews needed
    const reviewCount = teamTasks.filter(t => t.status === "review").length;

    // Update stats counters
    if (statProjects) statProjects.textContent = teamProjects.length;
    if (statTasks) statTasks.textContent = teamTasks.length;
    if (statSize) statSize.textContent = teamSize;
    if (statReviews) statReviews.textContent = reviewCount;

    // Count team task status
    let doneCount = teamTasks.filter(t => t.status === 'done').length;
    let progressCount = teamTasks.filter(t => t.status === 'progress').length;
    let reviewTasks = teamTasks.filter(t => t.status === 'review').length;
    let todoCount = teamTasks.filter(t => t.status === 'todo').length;

    // Cleanup previous Chart.js instances
    if (window.mgrCharts) {
        if (window.mgrCharts.task) window.mgrCharts.task.destroy();
        if (window.mgrCharts.velocity) window.mgrCharts.velocity.destroy();
    } else {
        window.mgrCharts = { task: null, velocity: null };
    }

    // Team task doughnut chart
    const taskCanvas = document.getElementById("mgr-task-chart");
    if (taskCanvas) {
        window.mgrCharts.task = new Chart(taskCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'In Progress', 'In Review', 'To Do'],
                datasets: [{
                    data: [doneCount, progressCount, reviewTasks, todoCount],
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
                        labels: {
                            color: '#9ca3af',
                            font: { family: 'Outfit', size: 12 }
                        }
                    }
                }
            }
        });
    }

    // Sprint burndown velocity chart
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
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    tension: 0.3,
                    fill: true,
                    borderWidth: 2
                }, {
                    label: 'Ideal Burndown',
                    data: [15, 12.8, 10.6, 8.4, 6.2, 4, 1.8],
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    borderDash: [5, 5],
                    tension: 0,
                    fill: false,
                    borderWidth: 1.5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#9ca3af',
                            font: { family: 'Outfit', size: 11 }
                        }
                    }
                },
                scales: {
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
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
};
