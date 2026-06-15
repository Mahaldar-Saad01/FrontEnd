// Chat Module Initializer
window.PageModules['chat'] = function () {

    const input = document.getElementById("chat-message-input");
    const sendBtn = document.getElementById("chat-send-btn");
    const container = document.getElementById("chat-messages-container");

    const chatItems = document.querySelectorAll(".chat-item");
    const activeName = document.getElementById("chat-active-name");
    const activeDesc = document.getElementById("chat-active-desc");
    const activeAvatar = document.getElementById("chat-active-avatar");

    const darkModeSwitch = document.getElementById("darkModeSwitch");

    // Scroll to latest message
    function scrollToBottom() {
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    scrollToBottom();

    // Change mic icon to send icon while typing
    if (input && sendBtn) {
        input.addEventListener("input", () => {
            const icon = sendBtn.querySelector("i");

            if (input.value.trim() !== "") {
                icon.className = "fa-solid fa-paper-plane";
            } else {
                icon.className = "fa-solid fa-microphone";
            }
        });
    }

    // Send Message Function
    function sendMessage() {

        if (!input || input.value.trim() === "") return;

        const msgText = input.value.trim();

        const now = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

        const userImg =
            (window.currentUser && window.currentUser.avatar) ||
            "https://ui-avatars.com/api/?name=You&background=6c5ce7&color=fff";

        const myMessage = `
            <div class="d-flex align-items-start gap-2 flex-row-reverse">
                <img src="${userImg}" class="avatar-sm rounded-circle">
                <div class="d-flex flex-column align-items-end">
                    <div class="d-flex align-items-center gap-2 mb-1 flex-row-reverse">
                        <span class="fw-semibold small">You</span>
                        <span class="text-muted small">${now}</span>
                    </div>
                    <div class="message-bubble sent p-3 rounded-4 text-white shadow-sm">
                        ${msgText}
                    </div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML("beforeend", myMessage);

        input.value = "";

        const icon = sendBtn.querySelector("i");
        icon.className = "fa-solid fa-microphone";

        scrollToBottom();

        // Auto reply
        setTimeout(() => {

            const senderName = activeName
                ? activeName.textContent
                : "Rihan";

            const senderAvatar = activeAvatar
                ? activeAvatar.src
                : "https://ui-avatars.com/api/?name=Rihan&background=random";

            const replyText = getMockReply(msgText);

            const reply = `
                <div class="d-flex align-items-start gap-2">
                    <img src="${senderAvatar}" class="avatar-sm rounded-circle">
                    <div>
                        <div class="d-flex align-items-center gap-2 mb-1">
                            <span class="fw-semibold small">${senderName}</span>
                            <span class="text-muted small">
                                ${new Date().toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                })}
                            </span>
                        </div>

                        <div class="message-bubble received p-3 rounded-4 shadow-sm">
                            ${replyText}
                        </div>
                    </div>
                </div>
            `;

            container.insertAdjacentHTML("beforeend", reply);

            scrollToBottom();

        }, 1000);
    }

    // Send button click
    if (sendBtn) {
        sendBtn.addEventListener("click", sendMessage);
    }

    // Enter key send
    if (input) {
        input.addEventListener("keypress", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Chat switching
    chatItems.forEach(item => {

        item.addEventListener("click", () => {

            chatItems.forEach(chat =>
                chat.classList.remove("bg-light")
            );

            item.classList.add("bg-light");

            const name = item.querySelector("h6").textContent;
            const avatar = item.querySelector("img").src;

            activeName.textContent = name;
            activeAvatar.src = avatar;

            if (name.includes("Team")) {
                activeDesc.innerHTML =
                    `8 members <span class="text-muted">· 5 online</span>`;
            } else {
                activeDesc.innerHTML =
                    `<span class="text-success">● Online</span>`;
            }

            // Load sample messages
            container.innerHTML = `
                <div class="text-center my-2">
                    <small class="text-muted fw-semibold">Today</small>
                </div>

                <div class="d-flex align-items-start gap-2">
                    <img src="${avatar}" class="avatar-sm rounded-circle">

                    <div>
                        <div class="d-flex align-items-center gap-2 mb-1">
                            <span class="fw-semibold small">${name}</span>
                            <span class="text-muted small">09:15 AM</span>
                        </div>

                        <div class="message-bubble received p-3 rounded-4 shadow-sm">
                            Hey! How is the project progressing?
                        </div>
                    </div>
                </div>
            `;

            scrollToBottom();
        });
    });

    // Dark mode
    if (darkModeSwitch) {
        darkModeSwitch.addEventListener("change", function () {

            if (this.checked) {
                document.body.style.filter =
                    "brightness(0.9) contrast(1.05)";
            } else {
                document.body.style.filter = "none";
            }

        });
    }

    // Mock replies
    function getMockReply(message) {

        const text = message.toLowerCase();

        if (text.includes("hello") || text.includes("hi")) {
            return "Hello! How can I help you today?";
        }

        if (text.includes("status") || text.includes("update")) {
            return "Everything is on track. Latest update will be shared shortly.";
        }

        if (
            text.includes("database") ||
            text.includes("er") ||
            text.includes("diagram")
        ) {
            return "Database design is completed. We can review it tomorrow.";
        }

        return "Thanks for your message. I'll get back to you soon.";
    }
};