// Kanban Board Module Initializer (Handles both manager and employee boards)

const renderKanbanBoard = (filterAssignee = null) => {
    const columns = {
        todo: document.getElementById("column-todo"),
        progress: document.getElementById("column-progress"),
        review: document.getElementById("column-review"),
        done: document.getElementById("column-done")
    };

    const counters = {
        todo: document.getElementById("count-todo"),
        progress: document.getElementById("count-progress"),
        review: document.getElementById("count-review"),
        done: document.getElementById("count-done")
    };

    if (!columns.todo) return;

    // Load tasks
    let tasks = JSON.parse(localStorage.getItem("workhub_tasks")) || [];

    // Filter by assignee if employee board
    if (filterAssignee) {
        tasks = tasks.filter(t => t.assignedTo && t.assignedTo.toLowerCase() === filterAssignee.toLowerCase());
    }

    // Clear lists
    Object.keys(columns).forEach(status => {
        columns[status].innerHTML = "";
    });

    const statusCounts = { todo: 0, progress: 0, review: 0, done: 0 };

    tasks.forEach(task => {
        const col = columns[task.status];
        if (!col) return;

        statusCounts[task.status]++;

        // Priority class
        let prioClass = "prio-card-low";
        if (task.priority === "high") prioClass = "prio-card-high";
        if (task.priority === "medium") prioClass = "prio-card-medium";

        // Assignee avatar
        const assigneeName = task.assignedTo || "Unassigned";

        const card = document.createElement("div");
        card.className = `kanban-card ${prioClass} fade-in-view`;
        card.draggable = true;
        card.dataset.id = task.id;
        card.innerHTML = `
            <div class="d-flex justify-content-between align-items-start mb-2">
                <span class="text-secondary small fw-semibold text-truncate" style="max-width: 140px;">${task.project}</span>
                <span class="badge-custom badge-priority-${task.priority}" style="font-size: 0.6rem;">${task.priority}</span>
            </div>
            <h6 class="fw-bold text-white mb-3" style="font-size: 0.9rem; line-height: 1.4;">${task.title}</h6>
            <div class="d-flex justify-content-between align-items-center">
                <span class="text-muted-custom small">${task.dept}</span>
                <div class="d-flex align-items-center gap-1.5" title="Assigned to ${assigneeName}">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(assigneeName)}&background=random&size=20" class="rounded-circle" style="width:20px; height:20px;" alt="Avatar">
                    <span class="small text-secondary" style="font-size:0.75rem;">${assigneeName.split(" ")[0]}</span>
                </div>
            </div>
        `;

        // Card drag events
        card.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", task.id);
            card.classList.add("dragging");
        });

        card.addEventListener("dragend", () => {
            card.classList.remove("dragging");
        });

        col.appendChild(card);
    });

    // Update numbers
    Object.keys(counters).forEach(status => {
        if (counters[status]) {
            counters[status].textContent = statusCounts[status];
        }
    });

    // Bind Column Drag & Drop listeners
    Object.keys(columns).forEach(status => {
        const col = columns[status];
        
        col.addEventListener("dragover", (e) => {
            e.preventDefault();
            col.classList.add("drag-over");
        });

        col.addEventListener("dragleave", () => {
            col.classList.remove("drag-over");
        });

        col.addEventListener("drop", (e) => {
            e.preventDefault();
            col.classList.remove("drag-over");
            
            const taskId = parseInt(e.dataTransfer.getData("text/plain"));
            let allTasks = JSON.parse(localStorage.getItem("workhub_tasks")) || [];
            
            const task = allTasks.find(t => t.id === taskId);
            if (task) {
                task.status = status;
                localStorage.setItem("workhub_tasks", JSON.stringify(allTasks));
                renderKanbanBoard(filterAssignee);
            }
        });
    });
};

// Manager Kanban view initializer
window.PageModules['manager-kanban'] = function() {
    renderKanbanBoard();
};

// Employee Kanban view initializer
window.PageModules['employee-kanban'] = function() {
    const activeUser = window.currentUser || JSON.parse(localStorage.getItem("currentUser"));
    const employeeName = activeUser ? activeUser.name : "Alex Mercer";
    renderKanbanBoard(employeeName);
};
