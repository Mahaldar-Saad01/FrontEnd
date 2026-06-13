document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");

    if (!registerForm) return;

    registerForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const fullName = document.getElementById("fullName").value.trim();
        const email = document.getElementById("email").value.trim();
        const role = document.getElementById("role").value;

        // Generate temporary password matching the pattern randomnumber@nameofemployee
        const randomNumber = Math.floor(1000 + Math.random() * 9000);
        const nameClean = fullName.toLowerCase().replace(/\s+/g, '');
        const generatedPassword = `${randomNumber}@${nameClean}`;

        // Mock registration logic
        let employees = JSON.parse(localStorage.getItem("workhub_employees"));
        if (!employees) {
            employees = [
                { id: 1, name: "Alex Mercer", email: "employee@workhub.com", role: "employee", dept: "Engineering", status: "Active", password: "employee123", isFirstLogin: false },
                { id: 2, name: "Rihan Kahn", email: "rihan@workhub.com", role: "employee", dept: "Engineering", status: "Active", password: "employee123", isFirstLogin: false },
                { id: 3, name: "Sarah Miller", email: "manager@workhub.com", role: "manager", dept: "Engineering", status: "Active", password: "manager123", isFirstLogin: false },
                { id: 4, name: "Saad Mahaldar", email: "admin@workhub.com", role: "admin", dept: "Management", status: "Active", password: "admin123", isFirstLogin: false },
                { id: 5, name: "Emily Watson", email: "emily@workhub.com", role: "employee", dept: "Design", status: "Active", password: "employee123", isFirstLogin: false },
                { id: 6, name: "David Chen", email: "david@workhub.com", role: "employee", dept: "Design", status: "On Leave", password: "employee123", isFirstLogin: false },
                { id: 7, name: "Sophia Martinez", email: "sophia@workhub.com", role: "employee", dept: "Marketing", status: "Active", password: "employee123", isFirstLogin: false },
                { id: 8, name: "James Wilson", email: "james@workhub.com", role: "employee", dept: "Marketing", status: "Active", password: "employee123", isFirstLogin: false },
                { id: 9, name: "Jessica Taylor", email: "jessica@workhub.com", role: "employee", dept: "HR", status: "Active", password: "employee123", isFirstLogin: false }
            ];
        }

        const newEmployee = {
            id: Date.now(),
            name: fullName,
            email: email,
            role: role,
            dept: role === "admin" ? "Management" : "Engineering",
            status: "Active",
            password: generatedPassword,
            isFirstLogin: true
        };

        employees.push(newEmployee);
        localStorage.setItem("workhub_employees", JSON.stringify(employees));

        // Populate Simulated Email Modal fields
        document.getElementById("email-to").textContent = email;
        document.getElementById("email-name").textContent = fullName;
        document.getElementById("email-val").textContent = email;
        document.getElementById("email-password").textContent = generatedPassword;

        // Trigger bootstrap modal
        const modal = new bootstrap.Modal(document.getElementById("emailSentModal"));
        modal.show();
    });
});
