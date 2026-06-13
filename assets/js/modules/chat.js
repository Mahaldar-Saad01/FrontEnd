// Chat Module Initializer
window.PageModules['chat'] = function() {
    const input = document.getElementById("chat-message-input");
    const sendBtn = document.getElementById("chat-send-btn");
    const container = document.getElementById("chat-messages-container");
    const chatItems = document.querySelectorAll(".chat-item");
    const activeName = document.getElementById("chat-active-name");
    const activeDesc = document.getElementById("chat-active-desc");
    const activeAvatar = document.getElementById("chat-active-avatar");
    const darkModeSwitch = document.getElementById("darkModeSwitch");

    // Scroll to bottom
    const scrollToBottom = () => {
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    };
    scrollToBottom();

    // Toggle Send/Microphone icon state based on input text
    if (input && sendBtn) {
        input.addEventListener("input", () => {
            const icon = sendBtn.querySelector("i");
            if (input.value.trim().length > 0) {
                icon.className = "fa-solid fa-paper-plane";
            } else {
                icon.className = "fa-solid fa-microphone";
            }
        });
    }

    // Send actions
    const sendMessage = () => {
        if (!input || !input.value.trim()) return;
        const msgText = input.value.trim();
        input.value = "";
        
        // Reset button icon
        const icon = sendBtn.querySelector("i");
        if (icon) icon.className = "fa-solid fa-microphone";

        // Append sent message bubble
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const userImg = (window.currentUser && window.currentUser.avatar) || "https://ui-avatars.com/api/?name=Saad&background=random";
        
        const messageHtml = `
            <div class="d-flex align-items-start gap-2 flex-row-reverse fade-in-view">
                <img src="${userImg}" class="avatar-sm rounded-circle" alt="User">
                <div class="d-flex flex-column align-items-end">
                    <div class="d-flex align-items-center gap-2 mb-1 flex-row-reverse">
                        <span class="fw-semibold small">You</span>
                        <span class="text-muted small" style="font-size: 0.7rem;">${now}</span>
                    </div>
                    <div class="message-bubble sent p-3 rounded-4 text-white shadow-sm" style="background-color: #6c5ce7;">
                        ${msgText}
                    </div>
                </div>
            </div>
        `;
        
        if (container) {
            container.insertAdjacentHTML("beforeend", messageHtml);
            scrollToBottom();
        }

        // Trigger bot mock reply after 1.2s
        setTimeout(() => {
            const botName = activeName ? activeName.textContent : "Rihan";
            const botAvatar = activeAvatar ? activeAvatar.src : "https://ui-avatars.com/api/?name=Rihan&background=random";
            const replyText = getMockReply(msgText, botName);
            
            const replyHtml = `
                <div class="d-flex align-items-start gap-2 fade-in-view">
                    <img src="${botAvatar}" class="avatar-sm rounded-circle" alt="User">
                    <div>
                        <div class="d-flex align-items-center gap-2 mb-1">
                            <span class="fw-semibold small">${botName}</span>
                            <span class="text-muted small" style="font-size: 0.7rem;">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div class="message-bubble received p-3 rounded-4 bg-white shadow-sm border">
                            ${replyText}
                        </div>
                    </div>
                </div>
            `;
            
            if (container) {
                container.insertAdjacentHTML("beforeend", replyHtml);
                scrollToBottom();
            }
        }, 1200);
    };

    if (sendBtn) {
        sendBtn.addEventListener("click", sendMessage);
    }
    if (input) {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Switch conversations on sidebar item click
    chatItems.forEach(item => {
        item.addEventListener("click", () => {
            chatItems.forEach(i => i.classList.remove("bg-light"));
            item.classList.add("bg-light");

            const name = item.querySelector("h6").textContent;
            const img = item.querySelector("img").src;
            
            if (activeName) activeName.textContent = name;
            if (activeAvatar) activeAvatar.src = img;
            if (activeDesc) {
                if (name.includes("Team")) {
                    activeDesc.innerHTML = `8 members <span class="text-muted">· 5 online</span>`;
                } else {
                    activeDesc.innerHTML = `<span class="text-success">· Online</span>`;
                }
            }

            // Replace messages panel
            if (container) {
                container.innerHTML = `
                    <div class="text-center my-2"><small class="text-muted fw-semibold">Today</small></div>
                    <div class="d-flex align-items-start gap-2">
                        <img src="${img}" class="avatar-sm rounded-circle" alt="User">
                        <div>
                            <div class="d-flex align-items-center gap-2 mb-1">
                                <span class="fw-semibold small">${name}</span>
                                <span class="text-muted small" style="font-size: 0.7rem;">9:15 AM</span>
                            </div>
                            <div class="message-bubble received p-3 rounded-4 bg-white shadow-sm border">
                                Hey! How is everything going with our project sprint? Let me know if you need any feedback or code review.
                            </div>
                        </div>
                    </div>
                `;
            }
        });
    });

    // Dark Mode switch interaction
    if (darkModeSwitch) {
        darkModeSwitch.addEventListener("change", () => {
            if (darkModeSwitch.checked) {
                document.body.style.filter = "brightness(0.9) contrast(1.05)";
            } else {
                document.body.style.filter = "none";
            }
        });
    }

    function getMockReply(userMsg, sender) {
        const text = userMsg.toLowerCase();
        if (text.includes("hello") || text.includes("hi")) {
            return `Hello! Hope you are having a productive day. How can I help you?`;
        }
        if (text.includes("status") || text.includes("update")) {
            return `I am currently reviewing our sprint goals. Everything looks on track!`;
        }
        if (text.includes("er") || text.includes("database") || text.includes("diagram")) {
            return `Perfect! The database schemas are completed. Let's meet tomorrow morning to review the relationships.`;
        }
        return `Thanks for the message! Let's double check this at our next sync.`;
    }
};