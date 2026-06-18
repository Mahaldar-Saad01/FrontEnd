/**
 * Chat Module — via /api/chat/messages/?room=<room>
 * Renders team chat feed, handles sending messages, user list sidebar.
 * Polling every 5 seconds for new messages (long-polling alternative).
 */
window.PageModules['chat'] = async function () {
    const messageContainer = document.getElementById('chat-messages-container');
    const messageInput     = document.getElementById('chat-message-input');
    const sendBtn          = document.getElementById('chat-send-btn');
    const sendForm         = document.getElementById('chat-send-form');
    const userListEl       = document.getElementById('chat-users-list');

    const currentUser  = WorkHubAPI.getCurrentUser();
    let currentRoom    = 'general';
    let pollingInterval = null;
    let lastMsgId      = 0;

    // ── Render a Message Bubble ────────────────────────────────────
    const createMessageBubble = (msg) => {
        const isSelf = msg.sender_name === currentUser?.name ||
                       msg.sender_name === currentUser?.full_name;

        const ts      = new Date(msg.timestamp);
        const timeStr = isNaN(ts) ? '' : ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const bubble = document.createElement('div');
        bubble.className = `chat-message ${isSelf ? 'chat-message-self' : ''}`;
        bubble.dataset.id = msg.id;
        bubble.innerHTML = `
            ${!isSelf ? `
            <div class="chat-avatar">
                <img src="${msg.sender_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender_name)}&background=random`}"
                     class="rounded-circle" style="width:32px; height:32px;" alt="${msg.sender_name}">
            </div>
            ` : ''}
            <div class="chat-bubble-group">
                ${!isSelf ? `<div class="chat-sender-name">${msg.sender_name}</div>` : ''}
                <div class="chat-bubble ${isSelf ? 'chat-bubble-self' : 'chat-bubble-other'}">
                    <span class="chat-text">${escapeHtml(msg.text)}</span>
                </div>
                <div class="chat-timestamp ${isSelf ? 'text-end' : ''}">${timeStr}</div>
            </div>
        `;
        return bubble;
    };

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(text || ''));
        return div.innerHTML;
    }

    // ── Load & Render All Messages in Room ─────────────────────────
    const loadMessages = async () => {
        if (!messageContainer) return;

        try {
            const data = await WorkHubAPI.getJSON(`/chat/messages/?room=${currentRoom}`);
            const messages = Array.isArray(data) ? data : (data.results || []);

            const isAtBottom = messageContainer.scrollTop + messageContainer.clientHeight
                               >= messageContainer.scrollHeight - 50;

            // Only append new messages to avoid re-render
            const newMsgs = messages.filter(m => m.id > lastMsgId);
            if (newMsgs.length > 0) {
                newMsgs.forEach(msg => {
                    messageContainer.appendChild(createMessageBubble(msg));
                    lastMsgId = Math.max(lastMsgId, msg.id);
                });

                // Auto-scroll to bottom if was at bottom
                if (isAtBottom) {
                    messageContainer.scrollTop = messageContainer.scrollHeight;
                }
            }

        } catch (err) {
            console.warn('Chat load error:', err);
        }
    };

    // ── Initial load + scroll to bottom ───────────────────────────
    if (messageContainer) {
        messageContainer.innerHTML = '';
        await loadMessages();
        messageContainer.scrollTop = messageContainer.scrollHeight;

        // Poll every 5 seconds
        pollingInterval = setInterval(loadMessages, 5000);
    }

    // ── Send Message ───────────────────────────────────────────────
    const sendMessage = async () => {
        const text = messageInput?.value.trim();
        if (!text) return;

        messageInput.value = '';
        if (sendBtn) sendBtn.disabled = true;

        try {
            const resp = await WorkHubAPI.post('/chat/messages/', {
                text,
                room: currentRoom,
                receiver: null
            });
            if (!resp.ok) throw new Error('Send failed');
            await loadMessages();
        } catch (err) {
            console.error('Send message error:', err);
            if (messageInput) messageInput.value = text; // restore on failure
        } finally {
            if (sendBtn) sendBtn.disabled = false;
            if (messageInput) messageInput.focus();
        }
    };

    if (sendBtn)  sendBtn.addEventListener('click', sendMessage);

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

    // ── Load Online Users Sidebar ──────────────────────────────────
    if (userListEl) {
        try {
            const data = await WorkHubAPI.getJSON('/employees/');
            const employees = Array.isArray(data) ? data : (data.results || []);

            userListEl.innerHTML = employees.map(emp => {
                const isSelf = emp.email === currentUser?.email;
                return `
                    <div class="chat-user-card d-flex align-items-center gap-2 p-2 rounded-2 mb-1
                                ${isSelf ? 'bg-primary-subtle' : ''}"
                         style="cursor:pointer;">
                        <div class="position-relative">
                            <img src="${emp.avatar_url}" class="rounded-circle"
                                 style="width:32px; height:32px;" alt="${emp.full_name}">
                            <span class="position-absolute" style="width:8px; height:8px;
                                  background:#10b981; border-radius:50%; border:1.5px solid var(--bg-card);
                                  bottom:-1px; right:-1px;"></span>
                        </div>
                        <div class="min-w-0">
                            <div class="fw-semibold text-white text-truncate" style="font-size:0.8rem;">
                                ${emp.full_name} ${isSelf ? '(You)' : ''}
                            </div>
                            <div class="text-muted text-capitalize" style="font-size:0.7rem;">${emp.role}</div>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (err) {
            console.warn('User list load error:', err);
        }
    }

    // ── Channel Switch Buttons ─────────────────────────────────────
    document.querySelectorAll('.chat-channel-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            document.querySelectorAll('.chat-channel-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRoom = btn.dataset.room || 'general';
            lastMsgId   = 0;
            if (messageContainer) messageContainer.innerHTML = '';
            await loadMessages();
        });
    });

    // ── Cleanup polling on page change ─────────────────────────────
    window.addEventListener('workhub:pagehide', () => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
    }, { once: true });
};