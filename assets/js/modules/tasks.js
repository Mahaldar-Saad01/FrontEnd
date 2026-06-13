// Tasks Module Initializer (Handles admin, manager assignments, and employee tasks)

const getTasksData = () => {
    let tasks = JSON.parse(localStorage.getItem("workhub_tasks"));
    if (!tasks) {
        tasks = [
            { id: 1, title: "Configure MySQL schemas", project: "FastAPI MySQL Migration", status: "done", priority: "high", dept: "Engineering", assignedTo: "Rihan Kahn" },
            { id: 2, title: "Create API documentation", project: "FastAPI MySQL Migration", status: "progress", priority: "medium", dept: "Engineering", assignedTo: "Alex Mercer" },
            { id: 3, title: "Draft landing page layouts", project: "Figma UI Redesign", status: "review", priority: "low", dept: "Design", assignedTo: "Saad Mahaldar" },
            { id: 4, title: "Launch Q3 AdWords campaigns", project: "Q3 Marketing Launch", status: "todo", priority: "high", dept: "Marketing", assignedTo: "Alex Mercer" },
            { id: 5, title: "Write backend unit tests", project: "FastAPI MySQL Migration", status: "todo", priority: "medium", dept: "Engineering", assignedTo: "Rihan Kahn" },
            { id: 6, title: "Conduct HR phone screens", project: "HR Recruitment Campaign", status: "done", priority: "low", dept: "HR", assignedTo: "Sarah Miller" }
        ];
        localStorage.setItem("workhub_tasks", JSON.stringify(tasks));
    }
    return tasks;
};

const renderTasksCommon = (tableBodyId, searchInputId, priorityFilterId, statusFilterId, filterAssignee = null) => {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;

    const query = document.getElementById(searchInputId)?.value.toLowerCase() || "";
    const priority = document.getElementById(priorityFilterId)?.value || "all";
    const status = document.getElementById(statusFilterId)?.value || "all";

    let tasks = getTasksData();

    // Filter by Assignee if requested
    if (filterAssignee) {
        tasks = tasks.filter(t => t.assignedTo && t.assignedTo.toLowerCase() === filterAssignee.toLowerCase());
    }

    // Filter list
    const filteredTasks = tasks.filter(task => {
        const matchesQuery = task.title.toLowerCase().includes(query) || task.project.toLowerCase().includes(query);
        const matchesPriority = priority === "all" || task.priority === priority;
        const matchesStatus = status === "all" || task.status === status;
        return matchesQuery && matchesPriority && matchesStatus;
    });

    tableBody.innerHTML = "";

    if (filteredTasks.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-secondary py-4">No tasks found.</td>
            </tr>
        `;
        return;
    }

    filteredTasks.forEach(task => {
        let pBadge = "badge-priority-low";
        if (task.priority === "high") pBadge = "badge-priority-high";
        if (task.priority === "medium") pBadge = "badge-priority-medium";

        let sBadge = "badge-status-todo";
        let statusLabel = "To Do";
        if (task.status === "progress") { sBadge = "badge-status-progress"; statusLabel = "In Progress"; }
        if (task.status === "review") { sBadge = "badge-status-review"; statusLabel = "In Review"; }
        if (task.status === "done") { sBadge = "badge-status-done"; statusLabel = "Completed"; }

        const tr = document.createElement("tr");
        
        // Render role-specific columns / actions
        const currentRole = window.currentUser?.role || "employee";
        
        let actionColumn = "";
        if (currentRole === 'admin') {
            actionColumn = `
                <td class="text-end">
                    <button class="btn btn-link text-danger p-0 delete-task-btn" data-id="${task.id}"><i class="fa-regular fa-trash-can"></i></button>
                </td>
            `;
        } else if (currentRole === 'employee') {
            // Dropdown to change status directly!
            actionColumn = `
                <td class="text-end">
                    <select class="form-select form-select-custom py-1 px-2 font-size-xs task-status-select" data-id="${task.id}" style="width: 120px; display: inline-block;">
                        <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>To Do</option>
                        <option value="progress" ${task.status === 'progress' ? 'selected' : ''}>In Progress</option>
                        <option value="review" ${task.status === 'review' ? 'selected' : ''}>In Review</option>
                        <option value="done" ${task.status === 'done' ? 'selected' : ''}>Completed</option>
                    </select>
                </td>
            `;
        } else { // Manager assignments
            actionColumn = `
                <td class="text-end">
                    <select class="form-select form-select-custom py-1 px-2 font-size-xs task-assignee-select" data-id="${task.id}" style="width: 150px; display: inline-block;">
                        <option value="">Unassigned</option>
                        <option value="Alex Mercer" ${task.assignedTo === 'Alex Mercer' ? 'selected' : ''}>Alex Mercer</option>
                        <option value="Rihan Kahn" ${task.assignedTo === 'Rihan Kahn' ? 'selected' : ''}>Rihan Kahn</option>
                        <option value="Sarah Miller" ${task.assignedTo === 'Sarah Miller' ? 'selected' : ''}>Sarah Miller</option>
                        <option value="Saad Mahaldar" ${task.assignedTo === 'Saad Mahaldar' ? 'selected' : ''}>Saad Mahaldar</option>
                    </select>
                </td>
            `;
        }

        tr.innerHTML = `
            <td class="fw-semibold text-white">${task.title}</td>
            <td><span class="text-secondary-custom">${task.project}</span></td>
            <td><span class="text-muted-custom font-size-sm">${task.dept}</span></td>
            <td><span class="badge-custom ${pBadge}">${task.priority}</span></td>
            <td><span class="badge-custom ${sBadge}">${statusLabel}</span></td>
            ${actionColumn}
        `;
        tableBody.appendChild(tr);
    });

    // Delete project click handler
    document.querySelectorAll(".delete-task-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = parseInt(btn.dataset.id);
            let allTasks = getTasksData();
            allTasks = allTasks.filter(t => t.id !== id);
            localStorage.setItem("workhub_tasks", JSON.stringify(allTasks));
            renderTasksCommon(tableBodyId, searchInputId, priorityFilterId, statusFilterId, filterAssignee);
        });
    });

    // Employee status toggle handler
    document.querySelectorAll(".task-status-select").forEach(select => {
        select.addEventListener("change", () => {
            const id = parseInt(select.dataset.id);
            const val = select.value;
            let allTasks = getTasksData();
            const task = allTasks.find(t => t.id === id);
            if (task) {
                task.status = val;
                localStorage.setItem("workhub_tasks", JSON.stringify(allTasks));
                renderTasksCommon(tableBodyId, searchInputId, priorityFilterId, statusFilterId, filterAssignee);
            }
        });
    });

    // Manager assignment toggle handler
    document.querySelectorAll(".task-assignee-select").forEach(select => {
        select.addEventListener("change", () => {
            const id = parseInt(select.dataset.id);
            const val = select.value;
            let allTasks = getTasksData();
            const task = allTasks.find(t => t.id === id);
            if (task) {
                task.assignedTo = val || null;
                localStorage.setItem("workhub_tasks", JSON.stringify(allTasks));
                renderTasksCommon(tableBodyId, searchInputId, priorityFilterId, statusFilterId, filterAssignee);
            }
        });
    });
};

const setupFilterListeners = (tableBodyId, searchInputId, priorityFilterId, statusFilterId, filterAssignee = null) => {
    const queryEl = document.getElementById(searchInputId);
    const prioEl = document.getElementById(priorityFilterId);
    const statEl = document.getElementById(statusFilterId);

    if (queryEl) queryEl.addEventListener("input", () => renderTasksCommon(tableBodyId, searchInputId, priorityFilterId, statusFilterId, filterAssignee));
    if (prioEl) prioEl.addEventListener("change", () => renderTasksCommon(tableBodyId, searchInputId, priorityFilterId, statusFilterId, filterAssignee));
    if (statEl) statEl.addEventListener("change", () => renderTasksCommon(tableBodyId, searchInputId, priorityFilterId, statusFilterId, filterAssignee));
};

// Admin Module Page Initializer
window.PageModules['admin-tasks'] = function() {
    renderTasksCommon("tasks-table-body", "task-search-input", "filter-priority", "filter-status");
    setupFilterListeners("tasks-table-body", "task-search-input", "filter-priority", "filter-status");

    // Add Task submit handler
    const form = document.getElementById("addTaskForm");
    if (form) {
        // Load active projects dynamically in select dropdown
        const projectsSelect = document.getElementById("taskProj");
        if (projectsSelect) {
            const projects = JSON.parse(localStorage.getItem("workhub_projects")) || [];
            if (projects.length > 0) {
                projectsSelect.innerHTML = projects.map(p => `<option value="${p.name}">${p.name}</option>`).join("");
            }
        }

        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const title = document.getElementById("taskTitle").value;
            const project = document.getElementById("taskProj").value;
            const priority = document.getElementById("taskPriority").value;
            const dept = document.getElementById("taskDept").value;
            const status = document.getElementById("taskStatus").value;

            let allTasks = getTasksData();
            const newTask = {
                id: Date.now(),
                title,
                project,
                priority,
                dept,
                status,
                assignedTo: null
            };

            allTasks.push(newTask);
            localStorage.setItem("workhub_tasks", JSON.stringify(allTasks));

            form.reset();
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById("addTaskModal"));
            if (modalInstance) modalInstance.hide();

            renderTasksCommon("tasks-table-body", "task-search-input", "filter-priority", "filter-status");
        });
    }
};

// Employee Module Page Initializer
window.PageModules['employee-mytasks'] = function() {
    const currentName = window.currentUser?.name || "Alex Mercer";
    
    renderTasksCommon("mytasks-table-body", "mytask-search-input", "myfilter-priority", "myfilter-status", currentName);
    setupFilterListeners("mytasks-table-body", "mytask-search-input", "myfilter-priority", "myfilter-status", currentName);
};

// Manager Module Page Initializer
window.PageModules['manager-assignments'] = function() {
    renderTasksCommon("assignments-table-body", "assign-search-input", "assign-filter-priority", "assign-filter-status");
    setupFilterListeners("assignments-table-body", "assign-search-input", "assign-filter-priority", "assign-filter-status");
};
