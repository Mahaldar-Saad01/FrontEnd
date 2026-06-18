/**
 * Kanban Board Module — via /api/tasks/
 * Drag-and-drop kanban board. Status changes are PATCHed to the API.
 * Handles both manager kanban (all team tasks) and employee kanban (own tasks only).
 */

const renderKanbanBoard = async (filterAssigneeId = null) => {
    const columns = {
        todo:     document.getElementById("column-todo"),
        progress: document.getElementById("column-progress"),
        review:   document.getElementById("column-review"),
        done:     document.getElementById("column-done")
    };

    const counters = {
        todo:     document.getElementById("count-todo"),
        progress: document.getElementById("count-progress"),
        review:   document.getElementById("count-review"),
        done:     document.getElementById("count-done")
    };

    if (!columns.todo) return;

    // ── Clear columns ──────────────────────────────────────────────
    Object.keys(columns).forEach(status => {
        if (columns[status]) columns[status].innerHTML = `
            <div class="text-center text-secondary small py-2">
                <div class="spinner-border spinner-border-sm text-primary mb-1"></div>
                <div>Loading...</div>
            </div>
        `;
    });

    let tasks = [];

    try {
        const data = await WorkHubAPI.getJSON('/tasks/');
        tasks = Array.isArray(data) ? data : (data.results || []);

        // Filter by assignee ID for employee board
        if (filterAssigneeId !== null) {
            tasks = tasks.filter(t => t.assignee === filterAssigneeId);
        }

    } catch (err) {
        console.error('Kanban load error:', err);
    }

    // ── Clear & repopulate ─────────────────────────────────────────
    Object.keys(columns).forEach(s => {
        if (columns[s]) columns[s].innerHTML = '';
    });

    const statusCounts = { todo: 0, progress: 0, review: 0, done: 0 };

    tasks.forEach(task => {
        const col = columns[task.status];
        if (!col) return;

        statusCounts[task.status]++;

        let prioClass = "prio-card-low";
        if (task.priority === "high")   prioClass = "prio-card-high";
        if (task.priority === "medium") prioClass = "prio-card-medium";

        const assigneeName   = task.assignee_name   || 'Unassigned';
        const assigneeAvatar = task.assignee_avatar  ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(assigneeName)}&background=random&size=20`;

        const card = document.createElement("div");
        card.className = `kanban-card ${prioClass} fade-in-view`;
        card.draggable = true;
        card.dataset.id = task.id;
        card.innerHTML = `
            <div class="d-flex justify-content-between align-items-start mb-2">
                <span class="text-secondary small fw-semibold text-truncate" style="max-width: 140px;">
                    ${task.project_name || '—'}
                </span>
                <span class="badge-custom badge-priority-${task.priority}" style="font-size: 0.6rem;">
                    ${task.priority}
                </span>
            </div>
            <h6 class="fw-bold text-white mb-3" style="font-size: 0.9rem; line-height: 1.4;">${task.title}</h6>
            <div class="d-flex justify-content-between align-items-center">
                <span class="text-muted-custom small">${task.department_name || '—'}</span>
                <div class="d-flex align-items-center gap-1.5" title="Assigned to ${assigneeName}">
                    <img src="${assigneeAvatar}" class="rounded-circle"
                         style="width:20px; height:20px;" alt="Avatar">
                    <span class="small text-secondary" style="font-size:0.75rem;">
                        ${assigneeName.split(" ")[0]}
                    </span>
                </div>
            </div>
        `;

        // ── Card Drag Events ───────────────────────────────────────
        card.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", String(task.id));
            card.classList.add("dragging");
        });

        card.addEventListener("dragend", () => {
            card.classList.remove("dragging");
        });

        col.appendChild(card);
    });

    // ── Update counters ────────────────────────────────────────────
    Object.keys(counters).forEach(status => {
        if (counters[status]) {
            counters[status].textContent = statusCounts[status];
        }
    });

    // ── Bind Column Drag & Drop with API PATCH ─────────────────────
    Object.keys(columns).forEach(status => {
        const col = columns[status];
        if (!col) return;

        col.addEventListener("dragover", (e) => {
            e.preventDefault();
            col.classList.add("drag-over");
        });

        col.addEventListener("dragleave", () => {
            col.classList.remove("drag-over");
        });

        col.addEventListener("drop", async (e) => {
            e.preventDefault();
            col.classList.remove("drag-over");

            const taskId = parseInt(e.dataTransfer.getData("text/plain"));
            const task   = tasks.find(t => t.id === taskId);

            if (task && task.status !== status) {
                try {
                    await WorkHubAPI.patch(`/tasks/${taskId}/`, { status });
                    // Re-render to reflect updated status
                    await renderKanbanBoard(filterAssigneeId);
                } catch (err) {
                    console.error('Task status update failed:', err);
                    alert('Failed to move task. Permission denied or network error.');
                }
            }
        });
    });
};

// ── Manager Kanban view initializer ───────────────────────────────────────
window.PageModules['manager-kanban'] = function () {
    renderKanbanBoard(null); // Load all manager tasks
};

// ── Employee Kanban view initializer ──────────────────────────────────────
window.PageModules['employee-kanban'] = function () {
    const activeUser = window.currentUser || WorkHubAPI.getCurrentUser();
    const userId     = activeUser ? activeUser.id : null;
    renderKanbanBoard(userId); // Filter by employee's own ID
};
