/**
 * Meetings Module — Full CRUD via /api/meetings/
 * Renders meeting cards, simulated video call overlay, schedule form.
 */
window.PageModules['meetings'] = async function () {
    const listContainer = document.getElementById('meetings-list-container');
    const scheduleForm  = document.getElementById('scheduleMeetingForm');
    const overlay       = document.getElementById('video-call-overlay');
    const callTitle     = document.getElementById('call-meeting-title');
    const micToggle     = document.getElementById('call-mic-toggle');
    const videoToggle   = document.getElementById('call-video-toggle');
    const leaveBtn      = document.getElementById('leave-call-btn');

    let meetings = [];

    // ── Render Meetings ────────────────────────────────────────────
    const renderMeetings = () => {
        if (!listContainer) return;
        listContainer.innerHTML = '';

        if (meetings.length === 0) {
            listContainer.innerHTML = `
                <div class="col-12 text-center text-secondary py-5">
                    <i class="fa-regular fa-calendar-xmark fs-1 mb-3"></i>
                    <p>No meetings scheduled.</p>
                </div>
            `;
            return;
        }

        meetings.forEach(meet => {
            const isLive = meet.status === 'live';
            const card   = document.createElement('div');
            card.className = 'col-lg-4 col-md-6 col-sm-12';
            card.innerHTML = `
                <div class="card-custom h-100 d-flex flex-column justify-content-between p-4"
                     style="${isLive ? 'border-color:rgba(16,185,129,0.4); box-shadow:0 0 15px rgba(16,185,129,0.05);' : ''}">
                    <div>
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="badge rounded-pill ${isLive ? 'bg-success' : 'bg-secondary'} py-1 px-2.5 font-size-xs fw-semibold">
                                ${isLive ? '<i class="fa-solid fa-circle-nodes me-1 animate-pulse"></i>LIVE NOW' : 'UPCOMING'}
                            </span>
                            <span class="text-secondary small fw-semibold">
                                <i class="fa-solid fa-laptop-code me-1"></i>${meet.platform}
                            </span>
                        </div>
                        <h5 class="fw-bold text-white mb-2">${meet.title}</h5>
                        <p class="text-secondary small mb-3" style="display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                            ${meet.agenda || '—'}
                        </p>
                    </div>
                    <div>
                        <div class="border-top pt-3 mb-3 d-flex flex-column gap-1" style="border-color:var(--border-color) !important;">
                            <div class="d-flex justify-content-between small text-secondary-custom">
                                <span><i class="fa-regular fa-calendar me-2"></i>Date:</span>
                                <span class="text-white fw-semibold">${meet.date}</span>
                            </div>
                            <div class="d-flex justify-content-between small text-secondary-custom">
                                <span><i class="fa-regular fa-clock me-2"></i>Time:</span>
                                <span class="text-white fw-semibold">${meet.time} (${meet.duration} mins)</span>
                            </div>
                        </div>
                        <button class="btn ${isLive ? 'btn-success' : 'btn-secondary-custom'} w-100 py-2 join-call-action"
                                data-title="${meet.title}">
                            <i class="fa-solid fa-video me-2"></i>${isLive ? 'Join Call' : 'Enter Preview'}
                        </button>
                    </div>
                </div>
            `;
            listContainer.appendChild(card);
        });

        // Join call action
        document.querySelectorAll('.join-call-action').forEach(btn => {
            btn.addEventListener('click', () => showCallOverlay(btn.dataset.title));
        });
    };

    // ── Load from API ──────────────────────────────────────────────
    try {
        const data = await WorkHubAPI.getJSON('/meetings/');
        meetings = Array.isArray(data) ? data : (data.results || []);
        renderMeetings();
    } catch (err) {
        if (listContainer) {
            listContainer.innerHTML = '<div class="col-12 text-danger text-center py-4">Failed to load meetings.</div>';
        }
    }

    // ── Video Call Overlay ─────────────────────────────────────────
    const showCallOverlay = (title) => {
        if (!overlay) return;
        if (callTitle) callTitle.textContent = title;
        overlay.classList.remove('d-none');
        overlay.classList.add('d-flex');
    };

    if (leaveBtn) {
        leaveBtn.addEventListener('click', () => {
            overlay.classList.remove('d-flex');
            overlay.classList.add('d-none');
        });
    }

    let micActive = true;
    if (micToggle) {
        micToggle.addEventListener('click', () => {
            micActive = !micActive;
            const icon = micToggle.querySelector('i');
            micToggle.className = micActive ? 'btn btn-secondary-custom rounded-circle p-3' : 'btn btn-danger rounded-circle p-3';
            icon.className = micActive ? 'fa-solid fa-microphone' : 'fa-solid fa-microphone-slash';
        });
    }

    let videoActive = true;
    if (videoToggle) {
        videoToggle.addEventListener('click', () => {
            videoActive = !videoActive;
            const icon = videoToggle.querySelector('i');
            videoToggle.className = videoActive ? 'btn btn-secondary-custom rounded-circle p-3' : 'btn btn-danger rounded-circle p-3';
            icon.className = videoActive ? 'fa-solid fa-video' : 'fa-solid fa-video-slash';
        });
    }

    // ── Schedule Form ──────────────────────────────────────────────
    if (scheduleForm && !scheduleForm.dataset.bound) {
        scheduleForm.dataset.bound = 'true';
        scheduleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title    = document.getElementById('meetingTitle').value;
            const date     = document.getElementById('meetingDate').value;
            const time     = document.getElementById('meetingTime').value;
            const duration = parseInt(document.getElementById('meetingDuration').value);
            const platform = document.getElementById('meetingPlatform').value;
            const topic    = document.getElementById('meetingTopic').value;

            try {
                const resp = await WorkHubAPI.post('/meetings/', {
                    title, date, time, duration, platform, agenda: topic, status: 'upcoming'
                });
                if (!resp.ok) { alert('Failed to schedule meeting.'); return; }

                const newMeeting = await resp.json();
                meetings.push(newMeeting);

                scheduleForm.reset();
                const modalEl = document.getElementById('scheduleMeetingModal');
                const modal   = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();

                renderMeetings();
            } catch (err) { alert('Network error.'); }
        });
    }
};
