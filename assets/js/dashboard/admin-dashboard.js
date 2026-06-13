// Admin Dashboard Module Initializer
window.PageModules['admin-dashboard'] = function() {
    const statProjects = document.getElementById("admin-stat-projects");
    const statTasks = document.getElementById("admin-stat-tasks");
    const statDepartments = document.getElementById("admin-stat-departments");
    const statEmployees = document.getElementById("admin-stat-employees");

    // Retrieve datasets from localStorage (with defaults)
    const projects = JSON.parse(localStorage.getItem("workhub_projects")) || [
        { id: 1, name: "WorkHub Mobile App", manager: "Sarah Miller", dept: "Engineering", status: "Active" },
        { id: 2, name: "FastAPI MySQL Migration", manager: "Sarah Miller", dept: "Engineering", status: "Active" },
        { id: 3, name: "Figma UI Redesign", manager: "Saad Mahaldar", dept: "Design", status: "Active" },
        { id: 4, name: "Q3 Marketing Launch", manager: "Alex Mercer", dept: "Marketing", status: "Pending" },
        { id: 5, name: "HR Recruitment Campaign", manager: "Alex Mercer", dept: "HR", status: "Completed" }
    ];
    localStorage.setItem("workhub_projects", JSON.stringify(projects));

    const tasks = JSON.parse(localStorage.getItem("workhub_tasks")) || [
        { id: 1, title: "Configure MySQL schemas", project: "FastAPI MySQL Migration", status: "done", priority: "high", dept: "Engineering" },
        { id: 2, title: "Create API documentation", project: "FastAPI MySQL Migration", status: "progress", priority: "medium", dept: "Engineering" },
        { id: 3, title: "Draft landing page layouts", project: "Figma UI Redesign", status: "review", priority: "low", dept: "Design" },
        { id: 4, title: "Launch Q3 AdWords campaigns", project: "Q3 Marketing Launch", status: "todo", priority: "high", dept: "Marketing" },
        { id: 5, title: "Write backend unit tests", project: "FastAPI MySQL Migration", status: "todo", priority: "medium", dept: "Engineering" },
        { id: 6, title: "Conduct HR phone screens", project: "HR Recruitment Campaign", status: "done", priority: "low", dept: "HR" }
    ];
    localStorage.setItem("workhub_tasks", JSON.stringify(tasks));

    const employees = JSON.parse(localStorage.getItem("workhub_employees")) || [
        { id: 1, name: "Alex Mercer", email: "employee@workhub.com", role: "employee", dept: "Engineering", status: "Active" },
        { id: 2, name: "Rihan Kahn", email: "rihan@workhub.com", role: "employee", dept: "Engineering", status: "Active" },
        { id: 3, name: "Sarah Miller", email: "manager@workhub.com", role: "manager", dept: "Engineering", status: "Active" },
        { id: 4, name: "Saad Mahaldar", email: "admin@workhub.com", role: "admin", dept: "Management", status: "Active" }
    ];
    localStorage.setItem("workhub_employees", JSON.stringify(employees));

    const depts = JSON.parse(localStorage.getItem("workhub_departments")) || [
        { id: 1, name: "Engineering", head: "Sarah Miller", count: 8 },
        { id: 2, name: "Design", head: "Saad Mahaldar", count: 3 },
        { id: 3, name: "Marketing", head: "Alex Mercer", count: 4 },
        { id: 4, name: "HR", head: "Sarah Miller", count: 2 }
    ];
    localStorage.setItem("workhub_departments", JSON.stringify(depts));

    // Update stats counters
    if (statProjects) statProjects.textContent = projects.length;
    if (statTasks) statTasks.textContent = tasks.length;
    if (statDepartments) statDepartments.textContent = depts.length;
    if (statEmployees) statEmployees.textContent = employees.length;

    // Count tasks status for chart
    let doneCount = tasks.filter(t => t.status === 'done').length;
    let progressCount = tasks.filter(t => t.status === 'progress').length;
    let reviewCount = tasks.filter(t => t.status === 'review').length;
    let todoCount = tasks.filter(t => t.status === 'todo').length;

    // Calculate department workloads
    const deptWorkloads = { Engineering: 0, Design: 0, Marketing: 0, HR: 0 };
    tasks.forEach(t => {
        const dept = t.dept || "Engineering";
        if (deptWorkloads[dept] !== undefined) {
            deptWorkloads[dept]++;
        } else {
            deptWorkloads[dept] = 1;
        }
    });

    // Cleanup previous Chart.js instances to prevent memory leaks and error overrides in SPA
    if (window.adminCharts) {
        if (window.adminCharts.task) window.adminCharts.task.destroy();
        if (window.adminCharts.workload) window.adminCharts.workload.destroy();
    } else {
        window.adminCharts = { task: null, workload: null };
    }

    // Task Status Doughnut Chart
    const taskCanvas = document.getElementById("admin-task-chart");
    if (taskCanvas) {
        window.adminCharts.task = new Chart(taskCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'In Progress', 'In Review', 'To Do'],
                datasets: [{
                    data: [doneCount, progressCount, reviewCount, todoCount],
                    backgroundColor: [
                        '#10b981', // green
                        '#06b6d4', // cyan
                        '#6366f1', // indigo
                        '#6b7280'  // grey
                    ],
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

    // Workload Bar Chart
    const workloadCanvas = document.getElementById("admin-workload-chart");
    if (workloadCanvas) {
        window.adminCharts.workload = new Chart(workloadCanvas, {
            type: 'bar',
            data: {
                labels: Object.keys(deptWorkloads),
                datasets: [{
                    label: 'Tasks Assigned',
                    data: Object.values(deptWorkloads),
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
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
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
};
