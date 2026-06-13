// Notifications Module Initializer
window.PageModules['notifications'] = function() {
    const logContainer = document.getElementById("notifications-log-container");
    const markReadBtn = document.getElementById("notif-mark-read-btn");
    const clearBtn = document.getElementById("notif-clear-btn");

    let notifications = JSON.parse(localStorage.getItem("workhub_notifications"));
    if (!notifications ||notifications.length === 0) {
        notifications = [
            { id: 1, type: "task", title: "New Task Assigned", desc: "Sarah Miller assigned you to 'Develop FastAPI endpoints for MySQL sync'.", time: "10 mins ago", read: false, icon: "fa-list-check", color: "primary" },
            { id: 2, type: "project", title: "Project Status Updated", desc: "Saad Mahaldar moved 'WorkHub Mobile App' into Active development stage.", time: "2 hours ago", read: false, icon: "fa-folder-open", color: "success" },
            { id: 3, type: "meeting", title: "Meeting Starting Soon", desc: "Daily Scrum room is active. Join now.", time: "4 hours ago", read: true, icon: "fa-clock", color: "info" },
            { id: 4, type: "system", title: "Welcome to WorkHub", desc: "Your user profile setup is complete. Check 'My Profile' to set credentials.", time: "1 day ago", read: true, icon: "fa-rocket", color: "warning" }
        ];
        localStorage.setItem("workhub_notifications", JSON.stringify(notifications));
    }

    const renderNotifications = () => {
        if (!logContainer) return;

        logContainer.innerHTML = "";

        if (notifications.length === 0) {
            logContainer.innerHTML = `
                <div class="text-center p-5 text-secondary">
                    <i class="fa-regular fa-bell-slash fs-1 mb-3 text-muted"></i>
                    <h5 class="fw-bold text-white mb-1">No Notifications</h5>
                    <p class="small mb-0">You are all caught up! Check back later for updates.</p>
                </div>
            `;
            return;
        }

        notifications.forEach(notif => {
            const card = document.createElement("div");
            
            // Custom highlight styles for unread notifications
            const borderStyle = notif.read 
                ? 'border-color: var(--border-color); opacity: 0.7;' 
                : 'border-color: rgba(99, 102, 241, 0.3); background-color: rgba(99, 102, 241, 0.02);';

            let iconColor = 'text-primary';
            if (notif.color === 'success') iconColor = 'text-success';
            if (notif.color === 'info') iconColor = 'text-info';
            if (notif.color === 'warning') iconColor = 'text-warning';

            card.className = "card-custom p-3 d-flex align-items-center gap-3 transition-all";
            card.style = borderStyle;
            card.innerHTML = `
                <div class="rounded-3 p-2.5 d-flex align-items-center justify-content-center bg-dark" style="width: 42px; height: 42px; border: 1px solid var(--border-color);">
                    <i class="fa-solid ${notif.icon} ${iconColor}"></i>
                </div>
                <div class="flex-grow-1 min-w-0">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="fw-bold mb-0 text-white text-truncate font-size-sm">
                            ${notif.title}
                            ${!notif.read ? '<span class="badge bg-primary rounded-circle p-1 ms-1 d-inline-block" style="width:6px; height:6px; vertical-align: middle;"></span>' : ''}
                        </h6>
                        <small class="text-muted" style="font-size: 0.75rem;">${notif.time}</small>
                    </div>
                    <p class="text-secondary small mb-0 text-truncate">${notif.desc}</p>
                </div>
                <div class="d-flex gap-2">
                    ${!notif.read ? `<button class="btn btn-link text-primary p-0 read-single-btn" data-id="${notif.id}" title="Mark as read"><i class="fa-solid fa-check"></i></button>` : ''}
                    <button class="btn btn-link text-muted p-0 delete-single-btn" data-id="${notif.id}" title="Delete notification"><i class="fa-regular fa-trash-can"></i></button>
                </div>
            `;
            logContainer.appendChild(card);
        });

        // Hook click handlers
        document.querySelectorAll(".read-single-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = parseInt(btn.dataset.id);
                const item = notifications.find(n => n.id === id);
                if (item) {
                    item.read = true;
                    localStorage.setItem("workhub_notifications", JSON.stringify(notifications));
                    renderNotifications();
                }
            });
        });

        document.querySelectorAll(".delete-single-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = parseInt(btn.dataset.id);
                notifications = notifications.filter(n => n.id !== id);
                localStorage.setItem("workhub_notifications", JSON.stringify(notifications));
                renderNotifications();
            });
        });
    };

    if (markReadBtn) {
        markReadBtn.addEventListener("click", () => {
            notifications.forEach(n => n.read = true);
            localStorage.setItem("workhub_notifications", JSON.stringify(notifications));
            renderNotifications();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            notifications = [];
            localStorage.setItem("workhub_notifications", JSON.stringify(notifications));
            renderNotifications();
        });
    }

    renderNotifications();
};
