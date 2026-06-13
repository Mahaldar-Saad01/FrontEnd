document.addEventListener("DOMContentLoaded", () => {
    const roleBtns = document.querySelectorAll(".role-btn");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const loginForm = document.getElementById("loginForm");

    let selectedRole = "admin";

    // Demo credential map
    const credentials = {
        admin: { email: "admin@workhub.com", pass: "admin123" },
        manager: { email: "manager@workhub.com", pass: "manager123" },
        employee: { email: "employee@workhub.com", pass: "employee123" }
    };

    // Role switcher
    roleBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            roleBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            selectedRole = btn.dataset.role;
            emailInput.value = credentials[selectedRole].email;
            passwordInput.value = credentials[selectedRole].pass;
        });
    });

    // Form Submission
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Perform login verification (accept all standard formats for demo)
        if (!email || !password) return;

        // Retrieve registered employees from localStorage to authenticate
        const employees = JSON.parse(localStorage.getItem("workhub_employees")) || [];
        const registeredUser = employees.find(emp => emp.email.toLowerCase() === email.toLowerCase());

        let userRole = selectedRole;
        let userName = "Admin Demo";
        let userDept = "Management";
        let isFirstLogin = false;

        if (registeredUser) {
            // Verify password
            const expectedPass = registeredUser.password || (registeredUser.role + "123");
            if (password !== expectedPass) {
                alert("Incorrect password!");
                return;
            }
            userRole = registeredUser.role;
            userName = registeredUser.name;
            userDept = registeredUser.dept || "Engineering";
            isFirstLogin = registeredUser.isFirstLogin === true;
        } else {
            // Perform fallback verification for standard formats for demo
            if (email.includes("manager")) {
                userRole = "manager";
                userName = "Sarah Miller";
                userDept = "Engineering";
            } else if (email.includes("employee")) {
                userRole = "employee";
                userName = "Alex Mercer";
                userDept = "Engineering";
            } else if (email.includes("admin")) {
                userRole = "admin";
                userName = "Saad Mahaldar";
                userDept = "Management";
            } else {
                userName = email.split("@")[0];
                userName = userName.charAt(0).toUpperCase() + userName.slice(1);
            }
        }

        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366f1&color=fff`;

        // Save session details
        const sessionUser = {
            email: email,
            role: userRole,
            name: userName,
            avatar: avatar,
            dept: userDept
        };

        if (isFirstLogin) {
            localStorage.setItem("changePasswordEmail", email);
            window.location.href = "change_password.html";
        } else {
            localStorage.setItem("currentUser", JSON.stringify(sessionUser));
            window.location.href = "index.html";
        }
    });
});
