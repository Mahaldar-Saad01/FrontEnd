/**
 * Kanban Board Module - via /api/tasks/
 * Drag-and-drop task status updates for manager and employee boards.
 */

const KANBAN_STATUSES = ['todo', 'progress', 'review', 'done'];

const kanbanStatusLabels = {
    todo: 'To Do',
    progress: 'In Progress',
    review: 'In Review',
    done: 'Completed'
};

const renderKanbanBoard = async (filterAssigneeId = null) => {
    const columns = {
        todo: document.getElementById('column-todo'),
        progress: document.getElementById('column-progress'),
        review: document.getElementById('column-review'),
        done: document.getElementById('column-done')
    };

    const counters = {
        todo: document.getElementById('count-todo'),
        progress: document.getElementById('count-progress'),
        review: document.getElementById('count-review'),
        done: document.getElementById('count-done')
    };

    if (!columns.todo) return;

    Object.values(columns).forEach(col => {
        if (!col) return;
        col.innerHTML = `
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
        tasks = tasks.filter(task => KANBAN_STATUSES.includes(task.status));

        if (filterAssigneeId !== null) {
            tasks = tasks.filter(task => String(task.assignee) === String(filterAssigneeId));
        }
    } catch (err) {
        console.error('Kanban load error:', err);
        Object.values(columns).forEach(col => {
            if (!col) return;
            col.innerHTML = `
                <div class="text-center text-danger small py-3">
                    Failed to load tasks.
                </div>
            `;
        });
        return;
    }

    Object.values(columns).forEach(col => {
        if (col) col.innerHTML = '';
    });

    const statusCounts = { todo: 0, progress: 0, review: 0, done: 0 };

    tasks.forEach(task => {
        const column = columns[task.status];
        if (!column) return;

        statusCounts[task.status]++;

        let prioClass = 'prio-card-low';
        if (task.priority === 'high') prioClass = 'prio-card-high';
        if (task.priority === 'medium') prioClass = 'prio-card-medium';

        const assigneeName = task.assignee_name || 'Unassigned';
        const assigneeAvatar = task.assignee_avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(assigneeName)}&background=random&size=20`;

        const card = document.createElement('div');
        card.className = `kanban-card ${prioClass} fade-in-view`;
        card.draggable = true;
        card.dataset.id = task.id;
        card.innerHTML = `
            <div class="d-flex justify-content-between align-items-start mb-2 gap-2">
                <span class="text-secondary small fw-semibold text-truncate" style="max-width: 140px;">
                    ${task.project_name || '-'}
                </span>
                <span class="badge-custom badge-priority-${task.priority}" style="font-size: 0.6rem;">
                    ${task.priority || 'low'}
                </span>
            </div>
            <h6 class="fw-bold text-white mb-3" style="font-size: 0.9rem; line-height: 1.4;">${task.title}</h6>
            <div class="d-flex justify-content-between align-items-center gap-2">
                <span class="text-muted-custom small text-truncate">${task.department_name || '-'}</span>
                <div class="d-flex align-items-center gap-1" title="Assigned to ${assigneeName}">
                    <img src="${assigneeAvatar}" class="rounded-circle"
                         style="width:20px; height:20px;" alt="Avatar">
                    <span class="small text-secondary text-truncate" style="font-size:0.75rem; max-width:64px;">
                        ${assigneeName.split(' ')[0]}
                    </span>
                </div>
            </div>
        `;

        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', String(task.id));
            e.dataTransfer.effectAllowed = 'move';
            card.classList.add('dragging');
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });

        column.appendChild(card);
    });

    KANBAN_STATUSES.forEach(status => {
        const column = columns[status];
        if (!column || statusCounts[status] > 0) return;

        column.innerHTML = `
            <div class="kanban-empty text-center text-secondary small py-3">
                No ${kanbanStatusLabels[status].toLowerCase()} tasks.
            </div>
        `;
    });

    Object.keys(counters).forEach(status => {
        if (counters[status]) counters[status].textContent = statusCounts[status];
    });

    KANBAN_STATUSES.forEach(status => {
        const column = columns[status];
        if (!column) return;

        column.ondragover = (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            column.classList.add('drag-over');
        };

        column.ondragleave = () => {
            column.classList.remove('drag-over');
        };

        column.ondrop = async (e) => {
            e.preventDefault();
            column.classList.remove('drag-over');

            const taskId = e.dataTransfer.getData('text/plain');
            const task = tasks.find(item => String(item.id) === String(taskId));
            if (!task || task.status === status) return;

            try {
                const resp = await WorkHubAPI.patch(`/tasks/${taskId}/`, { status });
                if (!resp.ok) {
                    const errText = await resp.text();
                    throw new Error(errText || `HTTP ${resp.status}`);
                }

                await renderKanbanBoard(filterAssigneeId);
            } catch (err) {
                console.error('Task status update failed:', err);
                alert('Failed to move task. Permission denied or network error.');
            }
        };
    });
};

window.PageModules['manager-kanban'] = function () {
    renderKanbanBoard(null);
};

window.PageModules['employee-kanban'] = function () {
    const activeUser = window.currentUser || WorkHubAPI.getCurrentUser();
    const userId = activeUser ? activeUser.id : null;
    renderKanbanBoard(userId);
};
