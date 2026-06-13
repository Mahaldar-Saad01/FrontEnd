// Meetings Module Initializer
window.PageModules['meetings'] = function() {
    const listContainer = document.getElementById("meetings-list-container");
    const scheduleForm = document.getElementById("scheduleMeetingForm");
    const overlay = document.getElementById("video-call-overlay");
    const callTitle = document.getElementById("call-meeting-title");
    const micToggle = document.getElementById("call-mic-toggle");
    const videoToggle = document.getElementById("call-video-toggle");
    const leaveBtn = document.getElementById("leave-call-btn");

    let meetings = JSON.parse(localStorage.getItem("workhub_meetings"));
    if (!meetings) {
        meetings = [
            { id: 1, title: "Daily Scrum Standup", date: "2026-06-11", time: "10:00", duration: 30, platform: "Zoom", topic: "Daily progress report, blockers review, task assignments.", status: "live" },
            { id: 2, title: "Design Sprint Alignment", date: "2026-06-11", time: "14:00", duration: 45, platform: "Google Meet", topic: "Review Figma mockups for task board screens.", status: "upcoming" },
            { id: 3, title: "DB Schema Design", date: "2026-06-12", time: "11:00", duration: 60, platform: "MS Teams", topic: "Final walkthrough of the relational database normalization.", status: "upcoming" }
        ];
        localStorage.setItem("workhub_meetings", JSON.stringify(meetings));
    }

    const renderMeetings = () => {
        if (!listContainer) return;

        listContainer.innerHTML = "";

        meetings.forEach(meet => {
            const isLive = meet.status === "live";
            
            const card = document.createElement("div");
            card.className = "col-lg-4 col-md-6 col-sm-12";
            card.innerHTML = `
                <div class="card-custom h-100 d-flex flex-column justify-content-between p-4" style="${isLive ? 'border-color: rgba(16, 185, 129, 0.4); box-shadow: 0 0 15px rgba(16, 185, 129, 0.05);' : ''}">
                    <div>
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="badge rounded-pill ${isLive ? 'bg-success' : 'bg-secondary'} py-1 px-2.5 font-size-xs" style="font-weight:600;">
                                ${isLive ? '<i class="fa-solid fa-circle-nodes me-1 animate-pulse"></i>LIVE NOW' : 'UPCOMING'}
                            </span>
                            <span class="text-secondary small fw-semibold"><i class="fa-solid fa-laptop-code me-1"></i>${meet.platform}</span>
                        </div>
                        <h5 class="fw-bold text-white mb-2">${meet.title}</h5>
                        <p class="text-secondary small mb-3 text-truncate-2" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${meet.topic}</p>
                    </div>
                    
                    <div>
                        <div class="border-top pt-3 mb-3 d-flex flex-column gap-1" style="border-color: var(--border-color) !important;">
                            <div class="d-flex justify-content-between small text-secondary-custom">
                                <span><i class="fa-regular fa-calendar me-2"></i>Date:</span>
                                <span class="text-white fw-semibold">${meet.date}</span>
                            </div>
                            <div class="d-flex justify-content-between small text-secondary-custom">
                                <span><i class="fa-regular fa-clock me-2"></i>Time:</span>
                                <span class="text-white fw-semibold">${meet.time} (${meet.duration} mins)</span>
                            </div>
                        </div>
                        <button class="btn ${isLive ? 'btn-success w-100 py-2 join-call-action' : 'btn-secondary-custom w-100 py-2 join-call-action'}" data-title="${meet.title}">
                            <i class="fa-solid fa-video me-2"></i>${isLive ? 'Join Call' : 'Enter Preview'}
                        </button>
                    </div>
                </div>
            `;
            listContainer.appendChild(card);
        });

        // Attach Join Call actions
        document.querySelectorAll(".join-call-action").forEach(btn => {
            btn.addEventListener("click", () => {
                const title = btn.dataset.title;
                showCallOverlay(title);
            });
        });
    };

    // Simulated Video Call Overlay logic
    const showCallOverlay = (title) => {
        if (!overlay) return;
        callTitle.textContent = title;
        overlay.classList.remove("d-none");
        overlay.classList.add("d-flex");
    };

    if (leaveBtn) {
        leaveBtn.addEventListener("click", () => {
            overlay.classList.remove("d-flex");
            overlay.classList.add("d-none");
        });
    }

    // Toggle states inside active video mock
    let micActive = true;
    if (micToggle) {
        micToggle.addEventListener("click", () => {
            micActive = !micActive;
            const icon = micToggle.querySelector("i");
            if (micActive) {
                micToggle.className = "btn btn-secondary-custom rounded-circle p-3";
                icon.className = "fa-solid fa-microphone";
            } else {
                micToggle.className = "btn btn-danger rounded-circle p-3";
                icon.className = "fa-solid fa-microphone-slash";
            }
        });
    }

    let videoActive = true;
    if (videoToggle) {
        videoToggle.addEventListener("click", () => {
            videoActive = !videoActive;
            const icon = videoToggle.querySelector("i");
            if (videoActive) {
                videoToggle.className = "btn btn-secondary-custom rounded-circle p-3";
                icon.className = "fa-solid fa-video";
            } else {
                videoToggle.className = "btn btn-danger rounded-circle p-3";
                icon.className = "fa-solid fa-video-slash";
            }
        });
    }

    // Schedule submission
    if (scheduleForm) {
        scheduleForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const title = document.getElementById("meetingTitle").value;
            const date = document.getElementById("meetingDate").value;
            const time = document.getElementById("meetingTime").value;
            const duration = parseInt(document.getElementById("meetingDuration").value);
            const platform = document.getElementById("meetingPlatform").value;
            const topic = document.getElementById("meetingTopic").value;

            const newMeeting = {
                id: Date.now(),
                title,
                date,
                time,
                duration,
                platform,
                topic,
                status: "upcoming"
            };

            meetings.push(newMeeting);
            localStorage.setItem("workhub_meetings", JSON.stringify(meetings));

            // Reset and close
            scheduleForm.reset();
            const modalEl = document.getElementById("scheduleMeetingModal");
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) {
                modalInstance.hide();
            }

            renderMeetings();
        });
    }

    // Run first render
    renderMeetings();
};
