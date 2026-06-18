/**
 * Notifications Module — via /api/notifications/
 * Fetches user notifications, renders cards, handles mark-read and delete.
 */
window.PageModules['notifications'] = async function () {
    const logContainer = document.getElementById('notifications-log-container');
    const markReadBtn  = document.getElementById('notif-mark-read-btn');
    const clearBtn     = document.getElementById('notif-clear-btn');

    let notifications = [];

    // ── Render Notifications ───────────────────────────────────────
    const renderNotifications = () => {
        if (!logContainer) return;
        logContainer.innerHTML = '';

        if (notifications.length === 0) {
            logContainer.innerHTML = `
                <div class="text-center p-5 text-secondary">
                    <i class="fa-regular fa-bell-slash fs-1 mb-3 text-muted"></i>
                    <h5 class="fw-bold text-white mb-1">No Notifications</h5>
                    <p class="small mb-0">You are all caught up! Check back later.</p>
                </div>
            `;
            return;
        }

        notifications.forEach(notif => {
            const card = document.createElement('div');

            const borderStyle = notif.is_read
                ? 'border-color:var(--border-color); opacity:0.7;'
                : 'border-color:rgba(99,102,241,0.3); background-color:rgba(99,102,241,0.02);';

            let iconColor = 'text-primary';
            if (notif.color === 'success') iconColor = 'text-success';
            if (notif.color === 'info')    iconColor = 'text-info';
            if (notif.color === 'warning') iconColor = 'text-warning';

            // Format timestamp
            const ts = new Date(notif.timestamp);
            const timeStr = isNaN(ts) ? (notif.time || '') : ts.toLocaleString();

            card.className = 'card-custom p-3 d-flex align-items-center gap-3 transition-all';
            card.style     = borderStyle;
            card.innerHTML = `
                <div class="rounded-3 p-2.5 d-flex align-items-center justify-content-center bg-dark"
                     style="width:42px; height:42px; border:1px solid var(--border-color);">
                    <i class="fa-solid ${notif.icon || 'fa-bell'} ${iconColor}"></i>
                </div>
                <div class="flex-grow-1 min-w-0">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="fw-bold mb-0 text-white text-truncate font-size-sm">
                            ${notif.title}
                            ${!notif.is_read ? '<span class="badge bg-primary rounded-circle p-1 ms-1 d-inline-block" style="width:6px;height:6px;vertical-align:middle;"></span>' : ''}
                        </h6>
                        <small class="text-muted" style="font-size:0.75rem;">${timeStr}</small>
                    </div>
                    <p class="text-secondary small mb-0 text-truncate">${notif.text}</p>
                </div>
                <div class="d-flex gap-2">
                    ${!notif.is_read
                        ? `<button class="btn btn-link text-primary p-0 read-single-btn" data-id="${notif.id}" title="Mark as read">
                               <i class="fa-solid fa-check"></i>
                           </button>`
                        : ''}
                    <button class="btn btn-link text-muted p-0 delete-single-btn" data-id="${notif.id}" title="Delete">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            `;
            logContainer.appendChild(card);
        });

        // ── Read Single ─────────────────────────────────────────────
        document.querySelectorAll('.read-single-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                try {
                    await WorkHubAPI.patch(`/notifications/${btn.dataset.id}/`, { is_read: true });
                    const n = notifications.find(x => x.id == btn.dataset.id);
                    if (n) n.is_read = true;
                    renderNotifications();
                } catch (e) { alert('Failed to mark as read.'); }
            });
        });

        // ── Delete Single ───────────────────────────────────────────
        document.querySelectorAll('.delete-single-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                try {
                    await WorkHubAPI.delete(`/notifications/${btn.dataset.id}/`);
                    notifications = notifications.filter(n => n.id != btn.dataset.id);
                    renderNotifications();
                } catch (e) { alert('Failed to delete notification.'); }
            });
        });
    };

    // ── Load from API ──────────────────────────────────────────────
    try {
        const data = await WorkHubAPI.getJSON('/notifications/');
        notifications = Array.isArray(data) ? data : (data.results || []);
        renderNotifications();
    } catch (err) {
        if (logContainer) {
            logContainer.innerHTML = '<div class="text-danger text-center py-4">Failed to load notifications.</div>';
        }
    }

    // ── Mark All Read ──────────────────────────────────────────────
    if (markReadBtn) {
        markReadBtn.addEventListener('click', async () => {
            try {
                await WorkHubAPI.post('/notifications/mark-all-read/', {});
                notifications.forEach(n => n.is_read = true);
                renderNotifications();
            } catch (e) { alert('Failed to mark all as read.'); }
        });
    }

    // ── Clear All ──────────────────────────────────────────────────
    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            try {
                // Delete each notification sequentially
                for (const n of notifications) {
                    await WorkHubAPI.delete(`/notifications/${n.id}/`);
                }
                notifications = [];
                renderNotifications();
            } catch (e) { alert('Failed to clear notifications.'); }
        });
    }
};
