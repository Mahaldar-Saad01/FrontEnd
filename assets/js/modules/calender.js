/**
 * Calendar Module — Full CRUD via /api/calendar/events/
 * Renders month grid, agenda sidebar, and handles add/delete events.
 * All rendering logic and element IDs preserved from original design.
 */
window.PageModules['calendar'] = async function () {
    const monthYearEl  = document.getElementById('calendar-month-year');
    const daysGrid     = document.getElementById('calendar-days-grid');
    const agendaEl     = document.getElementById('calendar-events-agenda');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const todayBtn     = document.getElementById('today-btn');
    const addEventForm = document.getElementById('addEventForm');

    let events = [];

    const now          = new Date();
    let currentDate    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let activeMonth    = currentDate.getMonth();
    let activeYear     = currentDate.getFullYear();

    const monthNames = [
        'January','February','March','April','May','June',
        'July','August','September','October','November','December'
    ];
    const categoryTextMap = {
        sprint: 'Sprint Meeting',
        client: 'Client Sync',
        review: 'Code Review',
        social: 'Team Social'
    };

    // ── Render Calendar Grid ───────────────────────────────────────
    const renderCalendar = () => {
        if (!daysGrid || !monthYearEl) return;

        daysGrid.innerHTML = '';
        monthYearEl.textContent = `${monthNames[activeMonth]} ${activeYear}`;

        const firstDayIndex    = new Date(activeYear, activeMonth, 1).getDay();
        const totalDays        = new Date(activeYear, activeMonth + 1, 0).getDate();
        const firstDayOffset   = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
        const prevMonthDays    = new Date(activeYear, activeMonth, 0).getDate();

        // Previous month tail
        for (let i = firstDayOffset - 1; i >= 0; i--) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell inactive-month';
            cell.innerHTML = `<span class="day-number">${prevMonthDays - i}</span>`;
            daysGrid.appendChild(cell);
        }

        // Current month days
        for (let day = 1; day <= totalDays; day++) {
            const cell    = document.createElement('div');
            cell.className = 'calendar-cell';

            const todayD = new Date();
            const isToday = day === todayD.getDate() && activeMonth === todayD.getMonth() && activeYear === todayD.getFullYear();
            if (isToday) cell.classList.add('today');

            cell.innerHTML = `<span class="day-number">${day}</span>`;

            const dateStr  = `${activeYear}-${String(activeMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr);

            const evCont = document.createElement('div');
            evCont.className = 'calendar-events-container';

            dayEvents.forEach(ev => {
                const dot = document.createElement('div');
                dot.className = `calendar-event-dot event-${ev.category}`;
                dot.innerHTML = `
                    <span class="calendar-event-title">${ev.title}</span>
                    <span class="calendar-event-time">${ev.time}</span>
                `;
                dot.title = `${ev.time} - ${ev.title}`;
                evCont.appendChild(dot);
            });

            cell.appendChild(evCont);

            // Click to pre-fill add event modal date
            cell.addEventListener('click', () => {
                const dateInput = document.getElementById('eventDate');
                if (dateInput) {
                    dateInput.value = dateStr;
                    const modal = new bootstrap.Modal(document.getElementById('addEventModal'));
                    modal.show();
                }
            });

            daysGrid.appendChild(cell);
        }

        // Next month head
        const totalCells   = firstDayOffset + totalDays;
        const remaining    = (7 - (totalCells % 7)) % 7;
        for (let day = 1; day <= remaining; day++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell inactive-month';
            cell.innerHTML = `<span class="day-number">${day}</span>`;
            daysGrid.appendChild(cell);
        }

        renderAgenda();
    };

    // ── Render Agenda ──────────────────────────────────────────────
    const renderAgenda = () => {
        if (!agendaEl) return;
        agendaEl.innerHTML = '';

        const sorted = [...events].sort((a, b) =>
            new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`)
        );

        if (sorted.length === 0) {
            agendaEl.innerHTML = `<div class="text-center text-muted small mt-4">No events scheduled.</div>`;
            return;
        }

        sorted.forEach(ev => {
            const evDate     = new Date(ev.date);
            const dateDisplay = evDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const card = document.createElement('div');
            card.className = `agenda-card cat-${ev.category}`;
            card.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="badge-custom badge-priority-${ev.category === 'sprint' ? 'high' : (ev.category === 'client' ? 'low' : 'medium')}"
                          style="font-size:0.65rem;">${categoryTextMap[ev.category] || ev.category}</span>
                    <small class="text-muted" style="font-size:0.75rem;">${ev.time}</small>
                </div>
                <h6 class="fw-bold mb-1 text-dark">${ev.title}</h6>
                <p class="text-secondary small mb-1">${ev.description || ev.desc || ''}</p>
                <div class="d-flex justify-content-between align-items-center mt-2">
                    <span class="text-muted" style="font-size:0.75rem;">
                        <i class="fa-regular fa-calendar me-1"></i>${dateDisplay}
                    </span>
                    <button class="btn btn-link text-danger p-0 delete-event-btn" data-id="${ev.id}"
                            style="font-size:0.8rem; text-decoration:none;">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            `;
            agendaEl.appendChild(card);
        });

        // Delete event handler
        document.querySelectorAll('.delete-event-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                try {
                    await WorkHubAPI.delete(`/calendar/events/${btn.dataset.id}/`);
                    events = events.filter(ev => ev.id != btn.dataset.id);
                    renderCalendar();
                } catch (err) { alert('Failed to delete event.'); }
            });
        });
    };

    // ── Load Events from API ───────────────────────────────────────
    try {
        const data = await WorkHubAPI.getJSON('/calendar/events/');
        events = Array.isArray(data) ? data : (data.results || []);
        renderCalendar();
    } catch (err) {
        console.error('Calendar load error:', err);
        renderCalendar(); // Render empty calendar
    }

    // ── Navigation ─────────────────────────────────────────────────
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            if (activeMonth === 0) { activeMonth = 11; activeYear--; }
            else { activeMonth--; }
            renderCalendar();
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            if (activeMonth === 11) { activeMonth = 0; activeYear++; }
            else { activeMonth++; }
            renderCalendar();
        });
    }

    if (todayBtn) {
        todayBtn.addEventListener('click', () => {
            activeMonth = currentDate.getMonth();
            activeYear  = currentDate.getFullYear();
            renderCalendar();
        });
    }

    // ── Add Event Form ─────────────────────────────────────────────
    if (addEventForm && !addEventForm.dataset.bound) {
        addEventForm.dataset.bound = 'true';
        addEventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title    = document.getElementById('eventTitle').value;
            const date     = document.getElementById('eventDate').value;
            const time     = document.getElementById('eventTime').value;
            const category = document.getElementById('eventCategory').value;
            const desc     = document.getElementById('eventDesc').value;

            try {
                const resp = await WorkHubAPI.post('/calendar/events/', {
                    title, date, time, category, description: desc
                });
                if (!resp.ok) { alert('Failed to create event.'); return; }

                const newEvent = await resp.json();
                events.push(newEvent);

                addEventForm.reset();
                const modalEl = document.getElementById('addEventModal');
                const modal   = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                modal.hide();

                renderCalendar();
            } catch (err) { alert('Network error.'); }
        });
    }
};
