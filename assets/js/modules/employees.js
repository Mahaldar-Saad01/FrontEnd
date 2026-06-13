// Employees Module Initializer (Handles admin employee list and manager team view)

const getEmployeesData = () => {
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
        localStorage.setItem("workhub_employees", JSON.stringify(employees));
    }
    return employees;
};

const renderEmployeesTable = () => {
    const tableBody = document.getElementById("employees-table-body");
    const countBadge = document.getElementById("employee-count-badge");
    if (!tableBody) return;

    const query = document.getElementById("employee-search-input")?.value.toLowerCase() || "";
    const employees = getEmployeesData();

    // Filter list
    const filtered = employees.filter(emp => {
        return emp.name.toLowerCase().includes(query) || 
               emp.email.toLowerCase().includes(query) || 
               emp.dept.toLowerCase().includes(query);
    });

    if (countBadge) countBadge.textContent = filtered.length;

    tableBody.innerHTML = "";

    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-secondary py-4">No employees matching search criteria.</td>
            </tr>
        `;
        return;
    }

    filtered.forEach(emp => {
        const isSelf = emp.email === window.currentUser?.email;
        
        let statusBadge = "badge-status-progress"; // Active
        if (emp.status === "On Leave") statusBadge = "badge-status-todo"; // Greyed out/leave

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="fw-bold text-white">
                <div class="d-flex align-items-center gap-2">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random" class="rounded-circle" style="width:28px; height:28px;" alt="Avatar">
                    <span>${emp.name} ${isSelf ? '<small class="text-muted-custom font-size-xs">(You)</small>' : ''}</span>
                </div>
            </td>
            <td><span class="text-secondary-custom">${emp.email}</span></td>
            <td class="text-capitalize small fw-semibold"><i class="fa-solid ${emp.role === 'admin' ? 'fa-user-shield text-danger' : (emp.role === 'manager' ? 'fa-user-tie text-warning' : 'fa-user text-primary')} me-1.5"></i>${emp.role}</td>
            <td><span class="text-muted-custom font-size-sm">${emp.dept}</span></td>
            <td><span class="badge-custom ${statusBadge}">${emp.status}</span></td>
            <td class="text-end">
                <button class="btn btn-link text-secondary-custom p-0 toggle-status-btn me-2" data-id="${emp.id}" title="Toggle Leave Status"><i class="fa-solid fa-plane-departure"></i></button>
                <button class="btn btn-link text-danger p-0 delete-emp-btn" data-id="${emp.id}" ${isSelf ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''}><i class="fa-regular fa-trash-can"></i></button>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    // Delete handler
    document.querySelectorAll(".delete-emp-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = parseInt(btn.dataset.id);
            let list = getEmployeesData();
            list = list.filter(emp => emp.id !== id);
            localStorage.setItem("workhub_employees", JSON.stringify(list));
            renderEmployeesTable();
        });
    });

    // Toggle status handler
    document.querySelectorAll(".toggle-status-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = parseInt(btn.dataset.id);
            let list = getEmployeesData();
            const emp = list.find(e => e.id === id);
            if (emp) {
                emp.status = emp.status === "Active" ? "On Leave" : "Active";
                localStorage.setItem("workhub_employees", JSON.stringify(list));
                renderEmployeesTable();
            }
        });
    });
};

// Admin personnel page initializer
window.PageModules['admin-employees'] = function() {
    renderEmployeesTable();

    const searchInput = document.getElementById("employee-search-input");
    if (searchInput) {
        searchInput.addEventListener("input", renderEmployeesTable);
    }

    const form = document.getElementById("addEmployeeForm");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const name = document.getElementById("empName").value;
            const email = document.getElementById("empEmail").value;
            const role = document.getElementById("empRole").value;
            const dept = document.getElementById("empDept").value;

            let list = getEmployeesData();
            const newEmp = {
                id: Date.now(),
                name,
                email,
                role,
                dept,
                status: "Active"
            };

            list.push(newEmp);
            localStorage.setItem("workhub_employees", JSON.stringify(list));

            form.reset();
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById("addEmployeeModal"));
            if (modalInstance) modalInstance.hide();

            renderEmployeesTable();
        });
    }
};

// Manager team workload view page initializer
window.PageModules['manager-team'] = function() {
    const listContainer = document.getElementById("manager-team-grid");
    if (!listContainer) return;

    const employees = getEmployeesData();
    const tasks = JSON.parse(localStorage.getItem("workhub_tasks")) || [];

    // Filters to employees that are not admins
    const teamMembers = employees.filter(emp => emp.role !== 'admin');

    listContainer.innerHTML = "";

    teamMembers.forEach(member => {
        // Calculate workload (number of assigned tasks that are not done)
        const activeTasks = tasks.filter(t => t.assignedTo === member.name && t.status !== 'done');
        const completedTasks = tasks.filter(t => t.assignedTo === member.name && t.status === 'done');
        const workloadIndex = activeTasks.length;

        // Visual layout details based on workload index
        let workloadBadge = "bg-success";
        let workloadLabel = "Low Workload";
        if (workloadIndex >= 3) {
            workloadBadge = "bg-danger";
            workloadLabel = "High Workload";
        } else if (workloadIndex >= 1) {
            workloadBadge = "bg-warning text-dark";
            workloadLabel = "Medium Workload";
        }

        const card = document.createElement("div");
        card.className = "col-xl-3 col-lg-4 col-md-6 col-sm-12";
        card.innerHTML = `
            <div class="card-custom h-100 d-flex flex-column justify-content-between p-4">
                <div class="text-center mb-3">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&size=64" class="rounded-circle mb-2" alt="Avatar">
                    <h6 class="fw-bold text-white mb-1">${member.name}</h6>
                    <small class="text-muted text-capitalize d-block mb-2">${member.role} · ${member.dept}</small>
                    <span class="badge ${workloadBadge} py-1 px-2.5 font-size-xs">${workloadLabel}</span>
                </div>

                <div class="border-top pt-3" style="border-color: var(--border-color) !important;">
                    <div class="d-flex justify-content-between small text-secondary mb-1">
                        <span>Active Tasks:</span>
                        <span class="text-white fw-bold">${workloadIndex}</span>
                    </div>
                    <div class="d-flex justify-content-between small text-secondary mb-2">
                        <span>Completed:</span>
                        <span class="text-success fw-bold">${completedTasks.length}</span>
                    </div>
                    <a href="mailto:${member.email}" class="btn btn-secondary-custom btn-sm w-100 mt-1"><i class="fa-regular fa-envelope me-1.5"></i>Contact</a>
                </div>
            </div>
        `;
        listContainer.appendChild(card);
    });
};

// Employee Profile initializer
window.PageModules['employee-profile'] = function() {
    const avatarImg = document.getElementById("profile-card-avatar");
    const cardName = document.getElementById("profile-card-name");
    const cardRole = document.getElementById("profile-card-role");
    const cardDept = document.getElementById("profile-card-dept");

    const inputName = document.getElementById("profile-name");
    const inputEmail = document.getElementById("profile-email");
    const inputRole = document.getElementById("profile-role");
    const inputDept = document.getElementById("profile-dept");
    const form = document.getElementById("profile-details-form");
    const alertContainer = document.getElementById("profile-alert-container");

    const activeUser = window.currentUser || JSON.parse(localStorage.getItem("currentUser"));
    if (!activeUser) return;

    const userDept = activeUser.dept || "Engineering";

    // Fill elements
    if (avatarImg) avatarImg.src = activeUser.avatar;
    if (cardName) cardName.textContent = activeUser.name;
    if (cardRole) cardRole.textContent = activeUser.role;
    if (cardDept) cardDept.textContent = userDept;

    if (inputName) inputName.value = activeUser.name;
    if (inputEmail) inputEmail.value = activeUser.email;
    if (inputRole) inputRole.value = activeUser.role;
    if (inputDept) inputDept.value = userDept;

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const updatedName = inputName.value.trim();
            const updatedEmail = inputEmail.value.trim();

            if (!updatedName || !updatedEmail) return;

            // Sync with current user session
            activeUser.name = updatedName;
            activeUser.email = updatedEmail;
            activeUser.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(updatedName)}&background=6366f1&color=fff`;
            
            localStorage.setItem("currentUser", JSON.stringify(activeUser));
            window.currentUser = activeUser;

            // Update profile card visuals
            if (avatarImg) avatarImg.src = activeUser.avatar;
            if (cardName) cardName.textContent = updatedName;

            // Sync in employees directory database
            let list = getEmployeesData();
            const idx = list.findIndex(emp => emp.email === activeUser.email);
            if (idx !== -1) {
                list[idx].name = updatedName;
                list[idx].email = updatedEmail;
                localStorage.setItem("workhub_employees", JSON.stringify(list));
            }

            // Sync visual header profile avatar/name
            const navAvatar = document.getElementById("nav-user-avatar");
            const navName = document.getElementById("nav-user-name");
            if (navAvatar) navAvatar.src = activeUser.avatar;
            if (navName) navName.textContent = updatedName;

            // Show success notification
            if (alertContainer) {
                alertContainer.innerHTML = `
                    <div class="alert alert-success d-flex align-items-center mb-4 fade-in-view" role="alert" style="background-color: rgba(16, 185, 129, 0.15); border-color: var(--color-success); color: var(--color-success);">
                        <i class="fa-solid fa-circle-check me-2"></i>
                        <div>Profile credentials updated successfully.</div>
                    </div>
                `;
                setTimeout(() => {
                    alertContainer.innerHTML = "";
                }, 3000);
            }
        });
    }
};
