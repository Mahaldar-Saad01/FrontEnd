// Calendar Module Initializer
window.PageModules['calender'] = function() {
    const monthYearEl = document.getElementById("calendar-month-year");
    const daysGrid = document.getElementById("calendar-days-grid");
    const agendaEl = document.getElementById("calendar-events-agenda");
    const prevMonthBtn = document.getElementById("prev-month-btn");
    const nextMonthBtn = document.getElementById("next-month-btn");
    const todayBtn = document.getElementById("today-btn");
    const addEventForm = document.getElementById("addEventForm");

    // Static events data list (persisted in localStorage)
    let events = JSON.parse(localStorage.getItem("workhub_events"));
    if (!events) {
        events = [
            { id: 1, title: "Sprint Planning", date: "2026-06-08", time: "10:00", category: "sprint", desc: "Align on upcoming sprint goals and assign tasks." },
            { id: 2, title: "FastAPI MySQL Sync", date: "2026-06-11", time: "11:30", category: "review", desc: "Discuss FastAPI database schema and MySQL migration." },
            { id: 3, title: "Client Feedback Sync", date: "2026-06-15", time: "15:00", category: "client", desc: "Walkthrough work in progress features with the client." },
            { id: 4, title: "Friday Game Night", date: "2026-06-19", time: "17:00", category: "social", desc: "Relax and play some games with the team." }
        ];
        localStorage.setItem("workhub_events", JSON.stringify(events));
    }

    // Initialize to June 2026 (matching demo timeline)
    let currentDate = new Date(2026, 5, 11); // June 11, 2026
    let activeMonth = currentDate.getMonth();
    let activeYear = currentDate.getFullYear();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const categoryTextMap = {
        sprint: "Sprint Meeting",
        client: "Client Sync",
        review: "Code Review",
        social: "Team Social"
    };

    const renderCalendar = () => {
        if (!daysGrid || !monthYearEl) return;

        daysGrid.innerHTML = "";
        monthYearEl.textContent = `${monthNames[activeMonth]} ${activeYear}`;

        // Get first day of month and total days
        const firstDayIndex = new Date(activeYear, activeMonth, 1).getDay(); // 0 is Sunday, 1 is Monday...
        const totalDays = new Date(activeYear, activeMonth + 1, 0).getDate();
        
        // Translate Sunday-first (0) to Monday-first index:
        // Sun: 0 -> 6, Mon: 1 -> 0, Tue: 2 -> 1, Wed: 3 -> 2, Thu: 4 -> 3, Fri: 5 -> 4, Sat: 6 -> 5
        const firstDayOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

        // Get total days in previous month
        const prevMonthTotalDays = new Date(activeYear, activeMonth, 0).getDate();

        // Render previous month's ending days
        for (let i = firstDayOffset - 1; i >= 0; i--) {
            const dayNum = prevMonthTotalDays - i;
            const cell = document.createElement("div");
            cell.className = "calendar-cell inactive-month";
            cell.innerHTML = `<span class="day-number">${dayNum}</span>`;
            daysGrid.appendChild(cell);
        }

        // Render current month days
        const today = new Date();
        for (let day = 1; day <= totalDays; day++) {
            const cell = document.createElement("div");
            cell.className = "calendar-cell";

            // Highlight current day if matches June 11, 2026 (or real today)
            const isToday = (day === 11 && activeMonth === 5 && activeYear === 2026);
            if (isToday) {
                cell.classList.add("today");
            }

            cell.innerHTML = `<span class="day-number">${day}</span>`;

            // Query events matching this specific date
            const dateStr = `${activeYear}-${String(activeMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr);

            const eventsContainer = document.createElement("div");
            eventsContainer.className = "calendar-events-container";

            dayEvents.forEach(ev => {
                const dot = document.createElement("div");
                dot.className = `calendar-event-dot event-${ev.category}`;
                dot.textContent = ev.title;
                dot.title = `${ev.time} - ${ev.title}`;
                eventsContainer.appendChild(dot);
            });

            cell.appendChild(eventsContainer);

            // Click cell to trigger pre-fill modal date
            cell.addEventListener("click", () => {
                const dateInput = document.getElementById("eventDate");
                if (dateInput) {
                    dateInput.value = dateStr;
                    const modal = new bootstrap.Modal(document.getElementById("addEventModal"));
                    modal.show();
                }
            });

            daysGrid.appendChild(cell);
        }

        // Render next month's starting days to fill grid row
        const totalCellsFilled = firstDayOffset + totalDays;
        const remainingCells = (7 - (totalCellsFilled % 7)) % 7;
        for (let day = 1; day <= remainingCells; day++) {
            const cell = document.createElement("div");
            cell.className = "calendar-cell inactive-month";
            cell.innerHTML = `<span class="day-number">${day}</span>`;
            daysGrid.appendChild(cell);
        }

        renderAgenda();
    };

    const renderAgenda = () => {
        if (!agendaEl) return;

        agendaEl.innerHTML = "";

        // Sort events chronologically
        const sortedEvents = [...events].sort((a, b) => {
            return new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`);
        });

        if (sortedEvents.length === 0) {
            agendaEl.innerHTML = `<div class="text-center text-muted small mt-4">No events scheduled.</div>`;
            return;
        }

        sortedEvents.forEach(ev => {
            const eventDate = new Date(ev.date);
            const dateDisplay = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            
            const card = document.createElement("div");
            card.className = `agenda-card cat-${ev.category}`;
            card.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="badge-custom badge-priority-${ev.category === 'sprint' ? 'high' : (ev.category === 'client' ? 'low' : 'medium')}" style="font-size: 0.65rem;">
                        ${categoryTextMap[ev.category]}
                    </span>
                    <small class="text-muted" style="font-size: 0.75rem;">${ev.time}</small>
                </div>
                <h6 class="fw-bold mb-1 text-white">${ev.title}</h6>
                <p class="text-secondary small mb-1">${ev.desc}</p>
                <div class="d-flex justify-content-between align-items-center mt-2">
                    <span class="text-muted" style="font-size: 0.75rem;"><i class="fa-regular fa-calendar me-1"></i>${dateDisplay}</span>
                    <button class="btn btn-link text-danger p-0 delete-event-btn" data-id="${ev.id}" style="font-size: 0.8rem; text-decoration: none;">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            `;
            agendaEl.appendChild(card);
        });

        // Add delete triggers
        document.querySelectorAll(".delete-event-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                events = events.filter(ev => ev.id !== id);
                localStorage.setItem("workhub_events", JSON.stringify(events));
                renderCalendar();
            });
        });
    };

    // Navigation events
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener("click", () => {
            if (activeMonth === 0) {
                activeMonth = 11;
                activeYear--;
            } else {
                activeMonth--;
            }
            renderCalendar();
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener("click", () => {
            if (activeMonth === 11) {
                activeMonth = 0;
                activeYear++;
            } else {
                activeMonth++;
            }
            renderCalendar();
        });
    }

    if (todayBtn) {
        todayBtn.addEventListener("click", () => {
            activeMonth = currentDate.getMonth();
            activeYear = currentDate.getFullYear();
            renderCalendar();
        });
    }

    // Modal submit handler
    if (addEventForm) {
        addEventForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const title = document.getElementById("eventTitle").value;
            const date = document.getElementById("eventDate").value;
            const time = document.getElementById("eventTime").value;
            const category = document.getElementById("eventCategory").value;
            const desc = document.getElementById("eventDesc").value;

            const newEvent = {
                id: Date.now(),
                title,
                date,
                time,
                category,
                desc
            };

            events.push(newEvent);
            localStorage.setItem("workhub_events", JSON.stringify(events));

            // Reset Form and hide modal
            addEventForm.reset();
            const modalEl = document.getElementById("addEventModal");
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) {
                modalInstance.hide();
            } else {
                // Fallback for custom triggers
                const bsModal = new bootstrap.Modal(modalEl);
                bsModal.hide();
            }

            renderCalendar();
        });
    }

    // Run first render
    renderCalendar();
};
