// Employee Dashboard Module Initializer
window.PageModules['employee-dashboard'] = function() {
    const statProjects = document.getElementById("emp-stat-projects");
    const statTasks = document.getElementById("emp-stat-tasks");
    const statCompleted = document.getElementById("emp-stat-completed");
    const statHours = document.getElementById("emp-stat-hours");

    const activeUser = window.currentUser || JSON.parse(localStorage.getItem("currentUser"));
    const employeeName = activeUser ? activeUser.name : "Alex Mercer";

    // Retrieve datasets
    const tasks = JSON.parse(localStorage.getItem("workhub_tasks")) || [];
    const projects = JSON.parse(localStorage.getItem("workhub_projects")) || [];

    // Filter tasks assigned to this employee
    const myTasks = tasks.filter(t => t.assignedTo && t.assignedTo.toLowerCase() === employeeName.toLowerCase());

    // Filter unique projects assigned
    const myProjectNames = [...new Set(myTasks.map(t => t.project))];
    const myProjectsCount = myProjectNames.length || 1; // Fallback to 1

    const myCompletedCount = myTasks.filter(t => t.status === "done").length;
    const myProgressCount = myTasks.filter(t => t.status === "progress").length;
    const myReviewCount = myTasks.filter(t => t.status === "review").length;
    const myTodoCount = myTasks.filter(t => t.status === "todo").length;

    // Update stats counters
    if (statProjects) statProjects.textContent = myProjectsCount;
    if (statTasks) statTasks.textContent = myTasks.length;
    if (statCompleted) statCompleted.textContent = myCompletedCount;
    if (statHours) statHours.textContent = 38; // Default mock logged hours

    // Cleanup previous Chart.js instances
    if (window.empCharts) {
        if (window.empCharts.task) window.empCharts.task.destroy();
        if (window.empCharts.hours) window.empCharts.hours.destroy();
    } else {
        window.empCharts = { task: null, hours: null };
    }

    // Task status doughnut chart
    const taskCanvas = document.getElementById("emp-task-chart");
    if (taskCanvas) {
        window.empCharts.task = new Chart(taskCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'In Progress', 'In Review', 'To Do'],
                datasets: [{
                    data: [myCompletedCount, myProgressCount, myReviewCount, myTodoCount],
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

    // Work hours logged bar chart
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
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
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
