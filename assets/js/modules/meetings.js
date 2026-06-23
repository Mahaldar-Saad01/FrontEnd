/**
 * Meetings Module — Full CRUD via /api/meetings/
 * Renders meeting cards, simulated video call overlay, schedule form.
 */
// window.PageModules['meetings'] = async function () {
//     const listContainer = document.getElementById('meetings-list-container');
//     const scheduleForm  = document.getElementById('scheduleMeetingForm');
//     const overlay       = document.getElementById('video-call-overlay');
//     const callTitle     = document.getElementById('call-meeting-title');
//     const micToggle     = document.getElementById('call-mic-toggle');
//     const videoToggle   = document.getElementById('call-video-toggle');
//     const leaveBtn      = document.getElementById('leave-call-btn');

//     let meetings = [];

//     // ── Render Meetings ────────────────────────────────────────────
//     const renderMeetings = () => {
//         if (!listContainer) return;
//         listContainer.innerHTML = '';

//         if (meetings.length === 0) {
//             listContainer.innerHTML = `
//                 <div class="col-12 text-center text-secondary py-5">
//                     <i class="fa-regular fa-calendar-xmark fs-1 mb-3"></i>
//                     <p>No meetings scheduled.</p>
//                 </div>
//             `;
//             return;
//         }

//         meetings.forEach(meet => {
//             const isLive = meet.status === 'live';
//             const card   = document.createElement('div');
//             card.className = 'col-lg-4 col-md-6 col-sm-12';
//             card.innerHTML = `
//                 <div class="card-custom h-100 d-flex flex-column justify-content-between p-4"
//                      style="${isLive ? 'border-color:rgba(16,185,129,0.4); box-shadow:0 0 15px rgba(16,185,129,0.05);' : ''}">
//                     <div>
//                         <div class="d-flex justify-content-between align-items-center mb-3">
//                             <span class="badge rounded-pill ${isLive ? 'bg-success' : 'bg-secondary'} py-1 px-2.5 font-size-xs fw-semibold">
//                                 ${isLive ? '<i class="fa-solid fa-circle-nodes me-1 animate-pulse"></i>LIVE NOW' : 'UPCOMING'}
//                             </span>
//                             <span class="text-secondary small fw-semibold">
//                                 <i class="fa-solid fa-laptop-code me-1"></i>${meet.platform}
//                             </span>
//                         </div>
//                         <h5 class="fw-bold text-white mb-2">${meet.title}</h5>
//                         <p class="text-secondary small mb-3" style="display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
//                             ${meet.agenda || '—'}
//                         </p>
//                     </div>
//                     <div>
//                         <div class="border-top pt-3 mb-3 d-flex flex-column gap-1" style="border-color:var(--border-color) !important;">
//                             <div class="d-flex justify-content-between small text-secondary-custom">
//                                 <span><i class="fa-regular fa-calendar me-2"></i>Date:</span>
//                                 <span class="text-white fw-semibold">${meet.date}</span>
//                             </div>
//                             <div class="d-flex justify-content-between small text-secondary-custom">
//                                 <span><i class="fa-regular fa-clock me-2"></i>Time:</span>
//                                 <span class="text-white fw-semibold">${meet.time} (${meet.duration} mins)</span>
//                             </div>
//                         </div>
//                         <button class="btn ${isLive ? 'btn-success' : 'btn-secondary-custom'} w-100 py-2 join-call-action"
//                                 data-title="${meet.title}">
//                             <i class="fa-solid fa-video me-2"></i>${isLive ? 'Join Call' : 'Enter Preview'}
//                         </button>
//                     </div>
//                 </div>
//             `;
//             listContainer.appendChild(card);
//         });

//         // Join call action
//         document.querySelectorAll('.join-call-action').forEach(btn => {
//             btn.addEventListener('click', () => showCallOverlay(btn.dataset.title));
//         });
//     };

//     // ── Load from API ──────────────────────────────────────────────
//     try {
//         const data = await WorkHubAPI.getJSON('/meetings/');
//         meetings = Array.isArray(data) ? data : (data.results || []);
//         renderMeetings();
//     } catch (err) {
//         if (listContainer) {
//             listContainer.innerHTML = '<div class="col-12 text-danger text-center py-4">Failed to load meetings.</div>';
//         }
//     }

//     // ── Video Call Overlay ─────────────────────────────────────────
//     const showCallOverlay = (title) => {
//         if (!overlay) return;
//         if (callTitle) callTitle.textContent = title;
//         overlay.classList.remove('d-none');
//         overlay.classList.add('d-flex');
//     };

//     if (leaveBtn) {
//         leaveBtn.addEventListener('click', () => {
//             overlay.classList.remove('d-flex');
//             overlay.classList.add('d-none');
//         });
//     }

// //     let micActive = true;
// //     if (micToggle) {
// //         micToggle.addEventListener('click', () => {
// //             micActive = !micActive;
// //             const icon = micToggle.querySelector('i');
// //             micToggle.className = micActive ? 'btn btn-secondary-custom rounded-circle p-3' : 'btn btn-danger rounded-circle p-3';
// //             icon.className = micActive ? 'fa-solid fa-microphone' : 'fa-solid fa-microphone-slash';
// //         });
// //     }

// //     let videoActive = true;
// //     if (videoToggle) {
// //         videoToggle.addEventListener('click', () => {
// //             videoActive = !videoActive;
// //             const icon = videoToggle.querySelector('i');
// //             videoToggle.className = videoActive ? 'btn btn-secondary-custom rounded-circle p-3' : 'btn btn-danger rounded-circle p-3';
// //             icon.className = videoActive ? 'fa-solid fa-video' : 'fa-solid fa-video-slash';
// //         });
// //     }

// //     // ── Schedule Form ──────────────────────────────────────────────
// //     if (scheduleForm && !scheduleForm.dataset.bound) {
// //         scheduleForm.dataset.bound = 'true';
// //         scheduleForm.addEventListener('submit', async (e) => {
// //             e.preventDefault();
// //             const title    = document.getElementById('meetingTitle').value;
// //             const date     = document.getElementById('meetingDate').value;
// //             const time     = document.getElementById('meetingTime').value;
// //             const duration = parseInt(document.getElementById('meetingDuration').value);
// //             const platform = document.getElementById('meetingPlatform').value;
// //             const topic    = document.getElementById('meetingTopic').value;

// //             try {
// //                 const resp = await WorkHubAPI.post('/meetings/', {
// //                     title, date, time, duration, platform, agenda: topic, status: 'upcoming'
// //                 });
// //                 if (!resp.ok) { alert('Failed to schedule meeting.'); return; }

// //                 const newMeeting = await resp.json();
// //                 meetings.push(newMeeting);

// //                 scheduleForm.reset();
// //                 const modalEl = document.getElementById('scheduleMeetingModal');
// //                 const modal   = bootstrap.Modal.getInstance(modalEl);
// //                 if (modal) modal.hide();

// //                 renderMeetings();
// //             } catch (err) { alert('Network error.'); }
// //         });
// //     }
// // };
// /**
//  * Meetings Module — Full CRUD via /api/meetings/
//  * Real Jitsi video call integrated inside overlay.
//  */
// window.PageModules['meetings'] = async function () {
//     const listContainer  = document.getElementById('meetings-list-container');
//     const scheduleForm   = document.getElementById('scheduleMeetingForm');
//     const overlay        = document.getElementById('video-call-overlay');
//     const callTitle      = document.getElementById('call-meeting-title');
//     const jitsiContainer = document.getElementById('jitsi-call-container');
//     const micToggle      = document.getElementById('call-mic-toggle');
//     const videoToggle    = document.getElementById('call-video-toggle');
//     const leaveBtn       = document.getElementById('leave-call-btn');

//     let meetings  = [];
//     let jitsiApi  = null;
//     let micActive = true;
//     let vidActive = true;

//     // ── Render Meeting Cards ───────────────────────────────────────
//     const renderMeetings = () => {
//         if (!listContainer) return;
//         listContainer.innerHTML = '';

//         if (meetings.length === 0) {
//             listContainer.innerHTML = `
//                 <div class="col-12 text-center text-secondary py-5">
//                     <i class="fa-regular fa-calendar-xmark fs-1 mb-3"></i>
//                     <p>No meetings scheduled.</p>
//                 </div>`;
//             return;
//         }

//         meetings.forEach(meet => {
//             const isLive = meet.status === 'live';
//             const card   = document.createElement('div');
//             card.className = 'col-lg-4 col-md-6 col-sm-12';
//             card.innerHTML = `
//                 <div class="card-custom h-100 d-flex flex-column justify-content-between p-4"
//                      style="${isLive ? 'border-color:rgba(16,185,129,0.4);box-shadow:0 0 15px rgba(16,185,129,0.05);' : ''}">
//                     <div>
//                         <div class="d-flex justify-content-between align-items-center mb-3">
//                             <span class="badge rounded-pill ${isLive ? 'bg-success' : 'bg-secondary'} py-1 px-3 fw-semibold">
//                                 ${isLive
//                                     ? '<i class="fa-solid fa-circle-nodes me-1"></i>LIVE NOW'
//                                     : 'UPCOMING'}
//                             </span>
//                             <span class="text-secondary small fw-semibold">
//                                 <i class="fa-solid fa-laptop-code me-1"></i>${meet.platform}
//                             </span>
//                         </div>
//                         <h5 class="fw-bold text-white mb-2">${meet.title}</h5>
//                         <p class="text-secondary small mb-3"
//                            style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
//                             ${meet.agenda || '—'}
//                         </p>
//                     </div>
//                     <div>
//                         <div class="border-top pt-3 mb-3 d-flex flex-column gap-1"
//                              style="border-color:var(--border-color) !important;">
//                             <div class="d-flex justify-content-between small text-secondary-custom">
//                                 <span><i class="fa-regular fa-calendar me-2"></i>Date:</span>
//                                 <span class="text-white fw-semibold">${meet.date}</span>
//                             </div>
//                             <div class="d-flex justify-content-between small text-secondary-custom">
//                                 <span><i class="fa-regular fa-clock me-2"></i>Time:</span>
//                                 <span class="text-white fw-semibold">${meet.time} (${meet.duration} mins)</span>
//                             </div>
//                             <div class="d-flex justify-content-between small text-secondary-custom">
//                                 <span><i class="fa-solid fa-users me-2"></i>Participants:</span>
//                                 <span class="text-white fw-semibold">${meet.participant_names?.join(', ') || 'None assigned'}</span>
//                             </div>
//                         </div>
//                         <button class="btn ${isLive ? 'btn-success' : 'btn-secondary-custom'} w-100 py-2 join-call-action"
//                                 data-id="${meet.id}" data-title="${meet.title}">
//                             <i class="fa-solid fa-video me-2"></i>
//                             ${isLive ? 'Join Call' : 'Start Meeting'}
//                         </button>
//                     </div>
//                 </div>`;
//             listContainer.appendChild(card);
//         });

//         document.querySelectorAll('.join-call-action').forEach(btn => {
//             btn.addEventListener('click', () => {
//                 joinMeeting(btn.dataset.id, btn.dataset.title);
//             });
//         });
//     };

//     // ── Load Meetings from API ─────────────────────────────────────
//     try {
//         const data = await WorkHubAPI.getJSON('/meetings/');
//         meetings   = Array.isArray(data) ? data : (data.results || []);
//         renderMeetings();
//     } catch (err) {
//         if (listContainer) {
//             listContainer.innerHTML =
//                 '<div class="col-12 text-danger text-center py-4">Failed to load meetings.</div>';
//         }
//     }

//     // ── Join Meeting — calls backend then launches Jitsi ──────────
//     const joinMeeting = async (meetingId, title) => {
//         if (!overlay) return;

//         // Show overlay immediately with a loading state
//         if (callTitle) callTitle.textContent = title;
//         if (jitsiContainer) jitsiContainer.innerHTML = `
//             <div class="d-flex align-items-center justify-content-center h-100 text-secondary">
//                 <i class="fa-solid fa-spinner fa-spin me-2"></i> Connecting to meeting room...
//             </div>`;

//         overlay.classList.remove('d-none');
//         overlay.classList.add('d-flex');

//         try {
//             // Call backend join endpoint
//             const resp     = await WorkHubAPI.get(`/meetings/${meetingId}/join/`);
//             const joinData = await resp.json();

//             if (!resp.ok) {
//                 // Backend returned 403 (not invited) or 404
//                 alert(joinData.detail || 'Could not join meeting.');
//                 closeOverlay();
//                 return;
//             }

//             // Launch real Jitsi with data from backend
//             launchJitsi(joinData);

//             // Update local status to live
//             const idx = meetings.findIndex(m => m.id == meetingId);
//             if (idx !== -1) meetings[idx].status = 'live';

//         } catch (err) {
//             console.error('Join error:', err);
//             alert('Could not connect to the meeting room. Please try again.');
//             closeOverlay();
//         }
//     };

//     // ── Launch Jitsi Inside the Container ─────────────────────────
//     const launchJitsi = (joinData) => {
//         if (!jitsiContainer || typeof JitsiMeetExternalAPI === 'undefined') {
//             alert('Video call library not loaded. Please refresh and try again.');
//             return;
//         }

//         jitsiContainer.innerHTML = ''; // clear loading spinner

//         const options = {
//             roomName:   joinData.room_name,
//             width:      '100%',
//             height:     '100%',
//             parentNode: jitsiContainer,
//             userInfo: {
//                 displayName: joinData.display_name
//             },
//             configOverwrite: {
//                 startWithAudioMuted:  false,
//                 startWithVideoMuted:  false,
//                 prejoinPageEnabled:   false,   // skip Jitsi's pre-join screen, go straight in
//                 disableDeepLinking:   true
//             },
//             interfaceConfigOverwrite: {
//                 SHOW_JITSI_WATERMARK:       false,
//                 SHOW_WATERMARK_FOR_GUESTS:  false,
//                 TOOLBAR_BUTTONS:            []  // hide Jitsi toolbar — we use our own buttons
//             }
//         };

//         jitsiApi = new JitsiMeetExternalAPI(joinData.jitsi_domain, options);

//         // When user leaves via Jitsi itself
//         jitsiApi.addEventListener('videoConferenceLeft', () => {
//             closeOverlay();
//         });

//         // When call is ready — reset button states
//         jitsiApi.addEventListener('videoConferenceJoined', () => {
//             micActive = true;
//             vidActive = true;
//             resetButtons();
//         });
//     };

//     // ── Close Overlay + Clean Up ───────────────────────────────────
//     const closeOverlay = () => {
//         if (jitsiApi) {
//             jitsiApi.dispose();
//             jitsiApi = null;
//         }
//         if (jitsiContainer) jitsiContainer.innerHTML = '';
//         overlay.classList.remove('d-flex');
//         overlay.classList.add('d-none');
//         renderMeetings(); // refresh cards to show updated live status
//     };

//     // ── Control Buttons ────────────────────────────────────────────
//     const resetButtons = () => {
//         if (micToggle) {
//             const icon = micToggle.querySelector('i');
//             micToggle.className = 'btn btn-secondary-custom rounded-circle p-3';
//             icon.className = 'fa-solid fa-microphone';
//         }
//         if (videoToggle) {
//             const icon = videoToggle.querySelector('i');
//             videoToggle.className = 'btn btn-secondary-custom rounded-circle p-3';
//             icon.className = 'fa-solid fa-video';
//         }
//     };

//     if (leaveBtn) {
//         leaveBtn.addEventListener('click', () => {
//             if (jitsiApi) {
//                 jitsiApi.executeCommand('hangup'); // triggers videoConferenceLeft → closeOverlay
//             } else {
//                 closeOverlay();
//             }
//         });
//     }

//     if (micToggle) {
//         micToggle.addEventListener('click', () => {
//             micActive = !micActive;
//             if (jitsiApi) jitsiApi.executeCommand('toggleAudio');
//             const icon = micToggle.querySelector('i');
//             micToggle.className = micActive
//                 ? 'btn btn-secondary-custom rounded-circle p-3'
//                 : 'btn btn-danger rounded-circle p-3';
//             icon.className = micActive
//                 ? 'fa-solid fa-microphone'
//                 : 'fa-solid fa-microphone-slash';
//         });
//     }

//     if (videoToggle) {
//         videoToggle.addEventListener('click', () => {
//             vidActive = !vidActive;
//             if (jitsiApi) jitsiApi.executeCommand('toggleVideo');
//             const icon = videoToggle.querySelector('i');
//             videoToggle.className = vidActive
//                 ? 'btn btn-secondary-custom rounded-circle p-3'
//                 : 'btn btn-danger rounded-circle p-3';
//             icon.className = vidActive
//                 ? 'fa-solid fa-video'
//                 : 'fa-solid fa-video-slash';
//         });
//     }

//     // ── Schedule Meeting Form ──────────────────────────────────────
//     if (scheduleForm && !scheduleForm.dataset.bound) {
//         scheduleForm.dataset.bound = 'true';
//         scheduleForm.addEventListener('submit', async (e) => {
//             e.preventDefault();

//             const payload = {
//                 title:    document.getElementById('meetingTitle').value,
//                 date:     document.getElementById('meetingDate').value,
//                 time:     document.getElementById('meetingTime').value,
//                 duration: parseInt(document.getElementById('meetingDuration').value),
//                 platform: document.getElementById('meetingPlatform').value,
//                 agenda:   document.getElementById('meetingTopic').value,
//                 status:   'upcoming'
//             };

//             try {
//                 const resp = await WorkHubAPI.post('/meetings/', payload);
//                 if (!resp.ok) {
//                     alert('Failed to schedule meeting.');
//                     return;
//                 }

//                 const newMeeting = await resp.json();
//                 meetings.push(newMeeting);

//                 scheduleForm.reset();
//                 const modalEl = document.getElementById('scheduleMeetingModal');
//                 const modal   = bootstrap.Modal.getInstance(modalEl);
//                 if (modal) modal.hide();

//                 renderMeetings();
//             } catch (err) {
//                 alert('Network error. Please try again.');
//             }
//         });
//     }
// };
/**
 * Meetings Module — Full CRUD + Participants + Real Jitsi Video + Delete
 */
window.PageModules['meetings'] = async function () {
    const listContainer  = document.getElementById('meetings-list-container');
    const scheduleForm   = document.getElementById('scheduleMeetingForm');
    const overlay        = document.getElementById('video-call-overlay');
    const callTitle      = document.getElementById('call-meeting-title');
    const jitsiContainer = document.getElementById('jitsi-call-container');
    const micToggle      = document.getElementById('call-mic-toggle');
    const videoToggle    = document.getElementById('call-video-toggle');
    const leaveBtn       = document.getElementById('leave-call-btn');
    const deptFilter     = document.getElementById('meetingDeptFilter');
    const participantSel = document.getElementById('meetingParticipants');
    const participantCount = document.getElementById('participant-count');

    let meetings     = [];
    let allEmployees = [];
    let jitsiApi     = null;
    let micActive    = true;
    let vidActive    = true;

    const currentUser = WorkHubAPI.getCurrentUser();
    const userRole    = currentUser?.role;

    // ── Render Meeting Cards ───────────────────────────────────────
    const renderMeetings = () => {
        if (!listContainer) return;
        listContainer.innerHTML = '';

        if (meetings.length === 0) {
            listContainer.innerHTML = `
                <div class="col-12 text-center text-secondary py-5">
                    <i class="fa-regular fa-calendar-xmark fs-1 mb-3"></i>
                    <p>No meetings scheduled.</p>
                </div>`;
            return;
        }

        meetings.forEach(meet => {
            const isLive   = meet.status === 'live';
            const isCreator = meet.creator === currentUser?.id;
            const canDelete = userRole === 'admin' || isCreator;

            const card     = document.createElement('div');
            card.className = 'col-lg-4 col-md-6 col-sm-12';
            card.innerHTML = `
                <div class="card-custom h-100 d-flex flex-column justify-content-between p-4"
                     style="${isLive ? 'border-color:rgba(16,185,129,0.4);box-shadow:0 0 15px rgba(16,185,129,0.05);' : ''}">
                    <div>
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="badge rounded-pill ${isLive ? 'bg-success' : 'bg-secondary'} py-1 px-3 fw-semibold">
                                ${isLive
                                    ? '<i class="fa-solid fa-circle-nodes me-1"></i>LIVE NOW'
                                    : 'UPCOMING'}
                            </span>
                            <span class="text-secondary small fw-semibold">
                                <i class="fa-solid fa-laptop-code me-1"></i>${meet.platform}
                            </span>
                        </div>
                        <h5 class="fw-bold text-white mb-2">${meet.title}</h5>
                        <p class="text-secondary small mb-3"
                           style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                            ${meet.agenda || '—'}
                        </p>
                    </div>
                    <div>
                        <div class="border-top pt-3 mb-3 d-flex flex-column gap-1"
                             style="border-color:var(--border-color) !important;">
                            <div class="d-flex justify-content-between small text-secondary-custom">
                                <span><i class="fa-regular fa-calendar me-2"></i>Date:</span>
                                <span class="text-white fw-semibold">${meet.date}</span>
                            </div>
                            <div class="d-flex justify-content-between small text-secondary-custom">
                                <span><i class="fa-regular fa-clock me-2"></i>Time:</span>
                                <span class="text-white fw-semibold">${meet.time} (${meet.duration} mins)</span>
                            </div>
                            <div class="d-flex justify-content-between small text-secondary-custom">
                                <span><i class="fa-solid fa-users me-2"></i>Participants:</span>
                                <span class="text-white fw-semibold">
                                    ${meet.participant_names?.length
                                        ? meet.participant_names.join(', ')
                                        : 'None assigned'}
                                </span>
                            </div>
                        </div>

                        <!-- Join + Delete buttons -->
                        <div class="d-flex gap-2">
                            <button class="btn ${isLive ? 'btn-success' : 'btn-secondary-custom'} flex-grow-1 py-2 join-call-action"
                                    data-id="${meet.id}" data-title="${meet.title}">
                                <i class="fa-solid fa-video me-2"></i>
                                ${isLive ? 'Join Call' : 'Start Meeting'}
                            </button>

                            ${canDelete
                                ? `<button class="btn btn-danger py-2 px-3 delete-meeting-action"
                                           data-id="${meet.id}" data-title="${meet.title}"
                                           title="Delete Meeting">
                                       <i class="fa-solid fa-trash"></i>
                                   </button>`
                                : ''}
                        </div>
                    </div>
                </div>`;
            listContainer.appendChild(card);
        });

        // Join call listener
        document.querySelectorAll('.join-call-action').forEach(btn => {
            btn.addEventListener('click', () => {
                joinMeeting(btn.dataset.id, btn.dataset.title);
            });
        });

        // Delete meeting listener
        document.querySelectorAll('.delete-meeting-action').forEach(btn => {
            btn.addEventListener('click', () => {
                deleteMeeting(btn.dataset.id, btn.dataset.title);
            });
        });
    };

    // ── Load Meetings ──────────────────────────────────────────────
    try {
        const data = await WorkHubAPI.getJSON('/meetings/');
        meetings   = Array.isArray(data) ? data : (data.results || []);
        renderMeetings();
    } catch (err) {
        if (listContainer) {
            listContainer.innerHTML =
                '<div class="col-12 text-danger text-center py-4">Failed to load meetings.</div>';
        }
    }

    // ── Load Employees + Departments for Participant Selector ──────
    const loadParticipantData = async () => {
        if (!participantSel || !deptFilter) return;

        // Clear previous data to avoid duplicates on modal reopen
        deptFilter.innerHTML = '<option value="">All Departments</option>';
        participantSel.innerHTML = '';

        try {
            const empData  = await WorkHubAPI.getJSON('/employees/');
            allEmployees   = Array.isArray(empData) ? empData : (empData.results || []);

            const deptData = await WorkHubAPI.getJSON('/departments/');
            const depts    = Array.isArray(deptData) ? deptData : (deptData.results || []);

            depts.forEach(dept => {
                const opt       = document.createElement('option');
                opt.value       = dept.id;
                opt.textContent = dept.name;
                deptFilter.appendChild(opt);
            });

            populateEmployees(allEmployees);

        } catch (err) {
            console.error('Failed to load participant data:', err);
        }
    };

    const populateEmployees = (employees) => {
        if (!participantSel) return;
        participantSel.innerHTML = '';

        employees.forEach(emp => {
            if (emp.id === currentUser?.id) return; // skip self
            const opt       = document.createElement('option');
            opt.value       = emp.id;
            opt.textContent = `${emp.full_name} — ${emp.department_name || 'No Dept'} (${emp.role})`;
            participantSel.appendChild(opt);
        });
    };

    // Filter by department
    if (deptFilter) {
        deptFilter.addEventListener('change', () => {
            const deptId = deptFilter.value;
            if (!deptId) {
                populateEmployees(allEmployees);
            } else {
                const filtered = allEmployees.filter(
                    emp => String(emp.department) === String(deptId)
                );
                populateEmployees(filtered);
            }
        });
    }

    // Show selected count
    if (participantSel) {
        participantSel.addEventListener('change', () => {
            const count = participantSel.selectedOptions.length;
            if (participantCount) {
                participantCount.textContent =
                    `${count} participant${count !== 1 ? 's' : ''} selected`;
            }
        });
    }

    // Load participant data when modal opens
    const modalEl = document.getElementById('scheduleMeetingModal');
    if (modalEl) {
        modalEl.addEventListener('show.bs.modal', () => {
            loadParticipantData();
        });
    }

    // ── Join Meeting ───────────────────────────────────────────────
    const joinMeeting = async (meetingId, title) => {
        if (!overlay) return;

        if (callTitle) callTitle.textContent = title;
        if (jitsiContainer) jitsiContainer.innerHTML = `
            <div class="d-flex align-items-center justify-content-center h-100 text-secondary">
                <i class="fa-solid fa-spinner fa-spin me-2"></i> Connecting to meeting room...
            </div>`;

        overlay.classList.remove('d-none');
        overlay.classList.add('d-flex');

        try {
            const resp     = await WorkHubAPI.get(`/meetings/${meetingId}/join/`);
            const joinData = await resp.json();

            console.log('Join response:', resp.status, joinData);

            if (!resp.ok) {
                alert(joinData.detail || 'You are not invited to this meeting.');
                closeOverlay();
                return;
            }

            if (!joinData.room_name) {
                alert('Meeting room not available. Please try again.');
                closeOverlay();
                return;
            }

            launchJitsi(joinData);

            const idx = meetings.findIndex(m => m.id == meetingId);
            if (idx !== -1) meetings[idx].status = 'live';

        } catch (err) {
            console.error('Join error:', err);
            alert('Could not connect to the meeting room. Please try again.');
            closeOverlay();
        }
    };

    // ── Delete Meeting ─────────────────────────────────────────────
    const deleteMeeting = async (meetingId, title) => {
        const confirmed = confirm(
            `Are you sure you want to delete "${title}"?\n\nAll participants will be notified.`
        );
        if (!confirmed) return;

        try {
            const resp = await WorkHubAPI.delete(`/meetings/${meetingId}/`);

            if (resp.ok) {
                // Remove from local list and re-render
                meetings = meetings.filter(m => m.id != meetingId);
                renderMeetings();
            } else {
                const err = await resp.json();
                alert(err.detail || 'Failed to delete meeting.');
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('Network error. Please try again.');
        }
    };

    // ── Launch Jitsi ───────────────────────────────────────────────
    const launchJitsi = (joinData) => {
        if (!jitsiContainer) return;

        if (typeof JitsiMeetExternalAPI === 'undefined') {
            let attempts = 0;
            const waitForJitsi = setInterval(() => {
                attempts++;
                if (typeof JitsiMeetExternalAPI !== 'undefined') {
                    clearInterval(waitForJitsi);
                    launchJitsi(joinData);
                } else if (attempts >= 10) {
                    clearInterval(waitForJitsi);
                    alert('Video call library failed to load. Check your internet and refresh.');
                    closeOverlay();
                }
            }, 500);
            return;
        }

        jitsiContainer.innerHTML = '';

        const options = {
            roomName:   joinData.room_name,
            width:      '100%',
            height:     '100%',
            parentNode: jitsiContainer,
            userInfo: {
                displayName: joinData.display_name
            },
            configOverwrite: {
                startWithAudioMuted: false,
                startWithVideoMuted: false,
                prejoinPageEnabled:  false,
                disableDeepLinking:  true
            },
            interfaceConfigOverwrite: {
                SHOW_JITSI_WATERMARK:      false,
                SHOW_WATERMARK_FOR_GUESTS: false,
                TOOLBAR_BUTTONS:           []
            }
        };

        jitsiApi = new JitsiMeetExternalAPI(joinData.jitsi_domain, options);

        jitsiApi.addEventListener('videoConferenceLeft', () => closeOverlay());
        jitsiApi.addEventListener('videoConferenceJoined', () => {
            micActive = true;
            vidActive = true;
            resetButtons();
        });
    };

    // ── Close Overlay ──────────────────────────────────────────────
    const closeOverlay = () => {
        if (jitsiApi) { jitsiApi.dispose(); jitsiApi = null; }
        if (jitsiContainer) jitsiContainer.innerHTML = '';
        overlay.classList.remove('d-flex');
        overlay.classList.add('d-none');
        renderMeetings();
    };

    // ── Control Buttons ────────────────────────────────────────────
    const resetButtons = () => {
        if (micToggle) {
            micToggle.className = 'btn btn-secondary-custom rounded-circle p-3';
            micToggle.querySelector('i').className = 'fa-solid fa-microphone';
        }
        if (videoToggle) {
            videoToggle.className = 'btn btn-secondary-custom rounded-circle p-3';
            videoToggle.querySelector('i').className = 'fa-solid fa-video';
        }
    };

    if (leaveBtn) {
        leaveBtn.addEventListener('click', () => {
            if (jitsiApi) jitsiApi.executeCommand('hangup');
            else closeOverlay();
        });
    }

    if (micToggle) {
        micToggle.addEventListener('click', () => {
            micActive = !micActive;
            if (jitsiApi) jitsiApi.executeCommand('toggleAudio');
            micToggle.className = micActive
                ? 'btn btn-secondary-custom rounded-circle p-3'
                : 'btn btn-danger rounded-circle p-3';
            micToggle.querySelector('i').className = micActive
                ? 'fa-solid fa-microphone'
                : 'fa-solid fa-microphone-slash';
        });
    }

    if (videoToggle) {
        videoToggle.addEventListener('click', () => {
            vidActive = !vidActive;
            if (jitsiApi) jitsiApi.executeCommand('toggleVideo');
            videoToggle.className = vidActive
                ? 'btn btn-secondary-custom rounded-circle p-3'
                : 'btn btn-danger rounded-circle p-3';
            videoToggle.querySelector('i').className = vidActive
                ? 'fa-solid fa-video'
                : 'fa-solid fa-video-slash';
        });
    }

    // ── Schedule Meeting Form ──────────────────────────────────────
    if (scheduleForm && !scheduleForm.dataset.bound) {
        scheduleForm.dataset.bound = 'true';
        scheduleForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const selectedParticipants = participantSel
                ? Array.from(participantSel.selectedOptions).map(o => parseInt(o.value))
                : [];

            const payload = {
                title:        document.getElementById('meetingTitle').value,
                date:         document.getElementById('meetingDate').value,
                time:         document.getElementById('meetingTime').value,
                duration:     parseInt(document.getElementById('meetingDuration').value),
                platform:     document.getElementById('meetingPlatform').value,
                agenda:       document.getElementById('meetingTopic').value,
                status:       'upcoming',
                participants: selectedParticipants
            };

            try {
                const resp = await WorkHubAPI.post('/meetings/', payload);
                if (!resp.ok) {
                    const err = await resp.json();
                    alert(err.detail || 'Failed to schedule meeting.');
                    return;
                }

                const newMeeting = await resp.json();
                meetings.push(newMeeting);

                scheduleForm.reset();
                if (participantSel) participantSel.innerHTML = '';
                if (participantCount) participantCount.textContent = '0 participants selected';

                const modal = bootstrap.Modal.getInstance(
                    document.getElementById('scheduleMeetingModal')
                );
                if (modal) modal.hide();

                renderMeetings();

            } catch (err) {
                alert('Network error. Please try again.');
            }
        });
    }
};
