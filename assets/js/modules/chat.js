/**
 * Chat Module - REST history + websocket live messages.
 */
window.PageModules['chat'] = async function () {
    const messageContainer = document.getElementById('chat-messages-container');
    const messageInput = document.getElementById('chat-message-input');
    const sendBtn = document.getElementById('chat-send-btn');
    const sendForm = document.getElementById('chat-form');
    const userListEl = document.getElementById('chat-users-list');
    const onlineListEl = document.getElementById('chat-online-list');
    const activeName = document.getElementById('chat-active-name');
    const activeDesc = document.getElementById('chat-active-desc');
    const activeAvatar = document.getElementById('chat-active-avatar');
    const profileAvatar = document.getElementById('chat-profile-avatar');
    const calendarMonthYear = document.getElementById('chat-calendar-month-year');
    const calendarGrid = document.getElementById('chat-calendar-grid');
    const calendarPrev = document.getElementById('chat-calendar-prev');
    const calendarNext = document.getElementById('chat-calendar-next');
    const plansDateLabel = document.getElementById('chat-plans-date-label');
    const dayPlans = document.getElementById('chat-day-plans');
    const addEventBtn = document.getElementById('chat-add-event-btn');

    const currentUser = WorkHubAPI.getCurrentUser();
    const clearSelections = () => {
        document.querySelectorAll('.chat-channel-btn, .chat-user-card').forEach(el => {
            el.classList.remove('bg-light', 'active');
        });
    };
    let currentRoom = 'general';
    let currentReceiver = null;
    let lastMsgId = 0;
    let socket = null;
    let reconnectTimer = null;
    let intentionallyClosed = false;
    let chatEvents = [];
    let chatCalendarDate = new Date();
    let selectedPlanDate = new Date();

    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(text || ''));
        return div.innerHTML;
    };

    const formatDateKey = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatPlanLabel = (date) => {
        const today = new Date();
        if (formatDateKey(date) === formatDateKey(today)) return 'Today';
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const renderChatPlans = () => {
        if (!dayPlans || !plansDateLabel) return;

        const selectedKey = formatDateKey(selectedPlanDate);
        const plans = chatEvents
            .filter(event => event.date === selectedKey)
            .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));

        plansDateLabel.textContent = formatPlanLabel(selectedPlanDate);

        if (!plans.length) {
            dayPlans.innerHTML = `
                <div class="text-muted small border rounded-3 p-3 text-center">
                    No plans for this day.
                </div>
            `;
            return;
        }

        dayPlans.innerHTML = plans.map(plan => `
            <div class="plan-item bg-dark border-light rounded-3 p-3 mb-2">
                <div class="d-flex justify-content-between gap-2">
                    <div class="fw-semibold small">${escapeHtml(plan.title || 'Untitled event')}</div>
                    <span class="text-muted small">${escapeHtml(plan.time || '')}</span>
                </div>
                <div class="text-muted small mt-1">${escapeHtml(plan.description || '')}</div>
            </div>
        `).join('');
    };

    const renderChatCalendar = () => {
        if (!calendarGrid || !calendarMonthYear) return;

        const month = chatCalendarDate.getMonth();
        const year = chatCalendarDate.getFullYear();
        const selectedKey = formatDateKey(selectedPlanDate);
        const todayKey = formatDateKey(new Date());
        const eventDates = new Set(chatEvents.map(event => event.date));
        const monthName = chatCalendarDate.toLocaleDateString([], { month: 'long', year: 'numeric' });

        calendarMonthYear.textContent = monthName;
        calendarGrid.innerHTML = '';

        ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach(day => {
            const label = document.createElement('div');
            label.className = 'calendar-weekday';
            label.textContent = day;
            calendarGrid.appendChild(label);
        });

        const firstDayIndex = new Date(year, month, 1).getDay();
        const firstDayOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
        const startDate = new Date(year, month, 1 - firstDayOffset);

        for (let i = 0; i < 42; i += 1) {
            const cellDate = new Date(startDate);
            cellDate.setDate(startDate.getDate() + i);
            const dateKey = formatDateKey(cellDate);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'chat-calendar-day';
            btn.textContent = cellDate.getDate();
            btn.setAttribute('aria-label', cellDate.toLocaleDateString([], {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            }));

            if (cellDate.getMonth() !== month) btn.classList.add('is-outside');
            if (dateKey === todayKey) btn.classList.add('is-today');
            if (dateKey === selectedKey) btn.classList.add('is-selected');
            if (eventDates.has(dateKey)) btn.classList.add('has-event');

            btn.addEventListener('click', () => {
                selectedPlanDate = new Date(cellDate);
                renderChatCalendar();
                renderChatPlans();
            });

            calendarGrid.appendChild(btn);
        }

        renderChatPlans();
    };

    const loadChatCalendar = async () => {
        if (!calendarGrid) return;
        try {
            const data = await WorkHubAPI.getJSON('/calendar/events/');
            chatEvents = Array.isArray(data) ? data : (data.results || []);
        } catch (err) {
            console.warn('Chat calendar load error:', err);
            chatEvents = [];
        }
        renderChatCalendar();
    };

    const getWsBase = () => {
        //const apiUrl = new URL(window.API_BASE || 'http://localhost:8000/api');
        const apiUrl = new URL(window.API_BASE || 'https://backend-257r.onrender.com0/api');
        apiUrl.protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
        apiUrl.pathname = '';
        apiUrl.search = '';
        apiUrl.hash = '';
        return apiUrl.toString().replace(/\/$/, '');
    };

    const createMessageBubble = (msg) => {
        const isSelf = Number(msg.sender) === Number(currentUser?.id) ||
            msg.sender_name === currentUser?.full_name ||
            msg.sender_name === currentUser?.name;

        const ts = new Date(msg.timestamp);
        const timeStr = isNaN(ts) ? '' : ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const bubble = document.createElement('div');
        bubble.className = `chat-message ${isSelf ? 'chat-message-self' : ''}`;
        bubble.dataset.id = msg.id;
        bubble.innerHTML = `
            <div class="chat-avatar">
                <img src="${msg.sender_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender_name || 'User')}&background=6366f1&color=fff`}"
                     class="rounded-circle" style="width:32px; height:32px;" alt="${escapeHtml(isSelf ? 'You' : (msg.sender_name || 'User'))}">
            </div>
            <div class="chat-bubble-group">
                <div class="chat-sender-name">${escapeHtml(isSelf ? 'You' : (msg.sender_name || 'User'))}</div>
                <div class="chat-bubble ${isSelf ? 'chat-bubble-self' : 'chat-bubble-other'}">
                    <span class="chat-text">${escapeHtml(msg.text)}</span>
                </div>
                <div class="chat-timestamp ${isSelf ? 'text-end' : ''}">${timeStr}</div>
            </div>
        `;
        return bubble;
    };

    const showEmptyState = () => {
        if (!messageContainer) return;
        messageContainer.innerHTML = `
            <div class="chat-empty-state text-center m-auto">
                <i class="fa-regular fa-comments mb-2"></i>
                <div class="fw-semibold">No messages yet</div>
                <div class="text-muted small">Start the conversation.</div>
            </div>
        `;
    };

    const appendMessage = (msg) => {
        if (!messageContainer || !msg?.id || msg.id <= lastMsgId) return;

        messageContainer.querySelector('.chat-empty-state')?.remove();

        const isAtBottom = messageContainer.scrollTop + messageContainer.clientHeight
            >= messageContainer.scrollHeight - 50;

        messageContainer.appendChild(createMessageBubble(msg));
        lastMsgId = Math.max(lastMsgId, msg.id);

        if (isAtBottom) {
            messageContainer.scrollTop = messageContainer.scrollHeight;
        }
    };

    const loadMessages = async () => {
        if (!messageContainer) return;

        try {
            const data = await WorkHubAPI.getJSON(`/chat/messages/?room=${encodeURIComponent(currentRoom)}`);
            const messages = Array.isArray(data) ? data : (data.results || []);

            messageContainer.innerHTML = '';
            lastMsgId = 0;
            if (messages.length) {
                messages.forEach(appendMessage);
            } else {
                showEmptyState();
            }
            messageContainer.scrollTop = messageContainer.scrollHeight;
        } catch (err) {
            console.warn('Chat history load error:', err);
        }
    };

    const closeSocket = () => {
        intentionallyClosed = true;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = null;
        if (socket) socket.close();
        socket = null;
    };

    const connectSocket = () => {
        const token = WorkHubAPI.getAccessToken();
        if (!token) return;

        intentionallyClosed = false;
        if (socket) socket.close();

        socket = new WebSocket(`${getWsBase()}/ws/chat/${encodeURIComponent(currentRoom)}/?token=${encodeURIComponent(token)}`);

        socket.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (payload.type === 'error') {
                    console.warn('Chat socket error:', payload.detail);
                    return;
                }
                appendMessage(payload);
                if (currentRoom.startsWith('dm_') && Number(payload.sender) !== Number(currentUser?.id)) {
                    WorkHubAPI.post('/chat/messages/mark-read/', { room: currentRoom });
                }
            } catch (err) {
                console.warn('Invalid chat socket payload:', err);
            }
        };

        socket.onclose = () => {
            socket = null;
            if (!intentionallyClosed) {
                reconnectTimer = setTimeout(connectSocket, 2000);
            }
        };

        socket.onerror = () => {
            if (socket) socket.close();
        };
    };

    const switchRoom = async ({ room, receiver = null, name = 'Team Chat', desc = 'Everyone in the workspace', avatar = '' }) => {
        currentRoom = room;
        currentReceiver = receiver;

        if (activeName) activeName.textContent = name;
        if (activeDesc) activeDesc.textContent = desc;
        if (activeAvatar) {
            activeAvatar.src = avatar || 'https://ui-avatars.com/api/?name=Team+Chat&background=6366f1&color=fff';
            activeAvatar.alt = name;
        }

        closeSocket();
        if (messageContainer) messageContainer.innerHTML = '';
        await loadMessages();
        connectSocket();
    };

    const sendMessage = async () => {
        const text = messageInput?.value.trim();
        if (!text) return;

        if (messageInput) messageInput.value = '';

        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                text,
                receiver: currentReceiver,
            }));
        } else {
            console.warn('Chat socket is not connected. Falling back to REST API.');
            try {
                const response = await WorkHubAPI.post('/chat/messages/', {
                    text,
                    room: currentRoom,
                    receiver: currentReceiver,
                });
                if (response.ok) {
                    const savedMsg = await response.json();
                    appendMessage(savedMsg);
                } else {
                    console.error('Failed to send message via REST fallback:', response.status);
                }
            } catch (err) {
                console.error('Error in REST fallback:', err);
            }
        }
        if (messageInput) messageInput.focus();
    };

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);

    if (sendForm) {
        sendForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendMessage();
        });
    }

    if (messageInput) {
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    if (userListEl) {
        try {
            const data = await WorkHubAPI.getJSON('/employees/chat-list/');
            const employees = Array.isArray(data) ? data : (data.results || []);

            const conversationsData = await WorkHubAPI.getJSON('/chat/messages/conversations/');
            const convMap = new Map(conversationsData.map(c => [Number(c.user_id), Number(c.unread_count || 0)]));

            if (profileAvatar && currentUser?.avatar_url) {
                profileAvatar.src = currentUser.avatar_url;
                profileAvatar.alt = currentUser.full_name || 'Profile';
            }

            if (onlineListEl) {
                onlineListEl.innerHTML = employees.slice(0, 8).map(emp => {
                    const roomIds = [Number(currentUser?.id), Number(emp.id)].sort((a, b) => a - b);
                    const dmRoom = `dm_${roomIds[0]}_${roomIds[1]}`;
                    return `
                        <div class="position-relative flex-shrink-0 cursor-pointer chat-online-avatar"
                             style="cursor: pointer;"
                             data-room="${dmRoom}"
                             data-receiver="${emp.id}"
                             data-name="${escapeHtml(emp.full_name || 'User')}"
                             data-role="${escapeHtml(emp.role || '')}"
                             data-avatar="${emp.avatar_url || ''}">
                            <img src="${emp.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.full_name || 'User')}&background=6366f1&color=fff`}"
                                 class="avatar-sm rounded-circle" alt="${escapeHtml(emp.full_name || 'User')}">
                            <span class="position-absolute bottom-0 end-0 p-1 bg-success border border-white rounded-circle"></span>
                        </div>
                    `;
                }).join('');

                onlineListEl.querySelectorAll('.chat-online-avatar').forEach(avatarEl => {
                    avatarEl.addEventListener('click', () => {
                        ensureAndOpenDM({
                            room: avatarEl.dataset.room,
                            receiver: avatarEl.dataset.receiver,
                            name: avatarEl.dataset.name,
                            role: avatarEl.dataset.role,
                            avatar: avatarEl.dataset.avatar
                        });
                    });
                });
            }

            const createDMCardHtml = (emp, unreadCount = 0) => {
                const roomIds = [Number(currentUser?.id), Number(emp.id)].sort((a, b) => a - b);
                const dmRoom = `dm_${roomIds[0]}_${roomIds[1]}`;
                const badgeHtml = unreadCount > 0 
                    ? `<span class="badge bg-danger rounded-pill unread-badge position-absolute" style="top: 50%; right: 15px; transform: translateY(-50%); font-size: 0.7rem;">${unreadCount}</span>` 
                    : '';
                return `
                    <div class="chat-user-card d-flex align-items-center gap-2 p-2 rounded-2 mb-1 position-relative"
                         style="cursor:pointer;"
                         data-room="${dmRoom}"
                         data-receiver="${emp.id}"
                         data-name="${escapeHtml(emp.full_name || 'User')}"
                         data-role="${escapeHtml(emp.role || '')}"
                         data-avatar="${emp.avatar_url || ''}">
                        <div class="position-relative">
                            <img src="${emp.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.full_name || 'User')}&background=6366f1&color=fff`}" class="rounded-circle"
                                 style="width:32px; height:32px;" alt="${escapeHtml(emp.full_name)}">
                            <span class="position-absolute" style="width:8px; height:8px;
                                  background:#10b981; border-radius:50%; border:1.5px solid var(--bg-card);
                                  bottom:-1px; right:-1px;"></span>
                        </div>
                        <div class="min-w-0 flex-grow-1 me-4">
                            <div class="fw-semibold text-white text-truncate" style="font-size:0.8rem;">
                                ${escapeHtml(emp.full_name || 'User')}
                            </div>
                            <div class="text-muted text-capitalize" style="font-size:0.7rem;">${escapeHtml(emp.role || '')}</div>
                        </div>
                        ${badgeHtml}
                    </div>
                `;
            };

            const dmEmployees = employees.filter(emp => convMap.has(Number(emp.id)));
            userListEl.innerHTML = dmEmployees.map(emp => createDMCardHtml(emp, convMap.get(Number(emp.id)) || 0)).join('');

            const bindCardClick = (card) => {
                card.addEventListener('click', () => {
                    clearSelections();
                    card.classList.add('bg-light');
                    card.querySelector('.unread-badge')?.remove();
                    
                    const room = card.dataset.room;
                    WorkHubAPI.post('/chat/messages/mark-read/', { room });
                    
                    switchRoom({
                        room: room,
                        receiver: card.dataset.receiver || null,
                        name: card.dataset.name,
                        desc: card.dataset.role ? `Direct message - ${card.dataset.role}` : 'Direct message',
                        avatar: card.dataset.avatar,
                    });
                });
            };

            userListEl.querySelectorAll('.chat-user-card').forEach(bindCardClick);

            const ensureAndOpenDM = (details) => {
                let matchedCard = userListEl.querySelector(`.chat-user-card[data-receiver="${details.receiver}"]`);
                if (!matchedCard) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = createDMCardHtml({
                        id: details.receiver,
                        full_name: details.name,
                        role: details.role,
                        avatar_url: details.avatar
                    }, 0);
                    const newCard = tempDiv.firstElementChild;
                    bindCardClick(newCard);
                    userListEl.appendChild(newCard);
                    matchedCard = newCard;
                }
                matchedCard.click();
            };

            const allLink = document.querySelector('.online-now a');
            if (allLink) {
                allLink.style.cursor = 'pointer';
                allLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    const modalEl = document.getElementById('searchAllUsersModal');
                    if (modalEl) {
                        const bsModal = new bootstrap.Modal(modalEl);
                        bsModal.show();

                        const modalListEl = document.getElementById('modal-users-list');
                        if (modalListEl) {
                            modalListEl.innerHTML = employees
                                .filter(emp => Number(emp.id) !== Number(currentUser?.id))
                                .map(emp => {
                                    const roomIds = [Number(currentUser?.id), Number(emp.id)].sort((a, b) => a - b);
                                    const dmRoom = `dm_${roomIds[0]}_${roomIds[1]}`;
                                    return `
                                        <div class="modal-user-item d-flex align-items-center gap-3 p-2 rounded-3 cursor-pointer"
                                             style="cursor: pointer;"
                                             data-room="${dmRoom}"
                                             data-receiver="${emp.id}"
                                             data-name="${escapeHtml(emp.full_name || 'User')}"
                                             data-role="${escapeHtml(emp.role || '')}"
                                             data-avatar="${emp.avatar_url || ''}">
                                            <img src="${emp.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.full_name || 'User')}&background=6366f1&color=fff`}"
                                                 class="rounded-circle" style="width:38px; height:38px;" alt="${escapeHtml(emp.full_name)}">
                                            <div class="min-w-0 flex-grow-1">
                                                <h6 class="mb-0 text-white fw-bold small">${escapeHtml(emp.full_name)}</h6>
                                                <p class="mb-0 text-muted extra-small text-capitalize" style="font-size:0.7rem;">${escapeHtml(emp.role || '')}</p>
                                            </div>
                                            <i class="fa-solid fa-chevron-right text-muted small"></i>
                                        </div>
                                    `;
                                }).join('');

                            modalListEl.querySelectorAll('.modal-user-item').forEach(item => {
                                item.addEventListener('click', () => {
                                    bsModal.hide();
                                    ensureAndOpenDM({
                                        room: item.dataset.room,
                                        receiver: item.dataset.receiver,
                                        name: item.dataset.name,
                                        role: item.dataset.role,
                                        avatar: item.dataset.avatar
                                    });
                                });
                            });
                        }

                        const modalSearchInput = document.getElementById('modal-user-search');
                        if (modalSearchInput) {
                            modalEl.addEventListener('shown.bs.modal', () => {
                                modalSearchInput.focus();
                            });
                            
                            modalSearchInput.value = '';
                            
                            modalSearchInput.addEventListener('input', (ev) => {
                                const query = ev.target.value.toLowerCase().trim();
                                modalListEl.querySelectorAll('.modal-user-item').forEach(item => {
                                    const name = (item.dataset.name || '').toLowerCase();
                                    const role = (item.dataset.role || '').toLowerCase();
                                    if (name.includes(query) || role.includes(query)) {
                                        item.style.setProperty('display', 'flex', 'important');
                                    } else {
                                        item.style.setProperty('display', 'none', 'important');
                                    }
                                });
                            });
                        }
                    }
                });
            }

            const searchInput = document.querySelector('.custom-search input');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const query = e.target.value.toLowerCase().trim();
                    userListEl.querySelectorAll('.chat-user-card').forEach(card => {
                        const name = (card.dataset.name || '').toLowerCase();
                        const role = (card.dataset.role || '').toLowerCase();
                        if (name.includes(query) || role.includes(query)) {
                            card.style.setProperty('display', 'flex', 'important');
                        } else {
                            card.style.setProperty('display', 'none', 'important');
                        }
                    });
                });
            }
        } catch (err) {
            console.warn('User list load error:', err);
        }
    }

    document.querySelectorAll('.chat-channel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            clearSelections();
            btn.classList.add('bg-light');
            switchRoom({
                room: btn.dataset.room || 'general',
                receiver: null,
                name: btn.dataset.name || 'Team Chat',
                desc: btn.dataset.desc || 'Everyone in the workspace',
            });
        });
    });

    // Dark/Light theme toggling logic
    const themeSwitch = document.getElementById('darkModeSwitch');
    const mainChatContainer = document.getElementById('main-chat-container');
    if (themeSwitch && mainChatContainer) {
        themeSwitch.addEventListener('change', () => {
            if (!themeSwitch.checked) {
                mainChatContainer.classList.add('light-theme');
            } else {
                mainChatContainer.classList.remove('light-theme');
            }
        });
        // Initial setup
        if (!themeSwitch.checked) {
            mainChatContainer.classList.add('light-theme');
        }
    }

    if (calendarPrev) {
        calendarPrev.addEventListener('click', () => {
            chatCalendarDate = new Date(chatCalendarDate.getFullYear(), chatCalendarDate.getMonth() - 1, 1);
            renderChatCalendar();
        });
    }

    if (calendarNext) {
        calendarNext.addEventListener('click', () => {
            chatCalendarDate = new Date(chatCalendarDate.getFullYear(), chatCalendarDate.getMonth() + 1, 1);
            renderChatCalendar();
        });
    }

    if (addEventBtn) {
        addEventBtn.addEventListener('click', () => {
            const calendarLink = document.querySelector('.menu-link[href="#calendar"]');
            if (calendarLink) {
                calendarLink.click();
            } else {
                window.location.hash = '#calendar';
            }
        });
    }

    await loadChatCalendar();
    await loadMessages();
    connectSocket();

    window.addEventListener('workhub:pagehide', closeSocket, { once: true });
};
