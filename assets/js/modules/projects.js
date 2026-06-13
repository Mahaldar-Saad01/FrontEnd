// Projects Module Initializer (Handles both admin and manager projects view)

const renderProjectsCommon = (containerId, filterManagerName = null) => {
    const tableBody = document.getElementById(containerId);
    if (!tableBody) return;

    // Load from localStorage
    let projects = JSON.parse(localStorage.getItem("workhub_projects")) || [
        { id: 1, name: "WorkHub Mobile App", manager: "Sarah Miller", dept: "Engineering", status: "Active", progress: 65 },
        { id: 2, name: "FastAPI MySQL Migration", manager: "Sarah Miller", dept: "Engineering", status: "Active", progress: 40 },
        { id: 3, name: "Figma UI Redesign", manager: "Saad Mahaldar", dept: "Design", status: "Active", progress: 85 },
        { id: 4, name: "Q3 Marketing Launch", manager: "Alex Mercer", dept: "Marketing", status: "Pending", progress: 0 },
        { id: 5, name: "HR Recruitment Campaign", manager: "Alex Mercer", dept: "HR", status: "Completed", progress: 100 }
    ];
    localStorage.setItem("workhub_projects", JSON.stringify(projects));

    // Filter projects if viewing as a specific manager
    if (filterManagerName) {
        projects = projects.filter(p => p.manager.toLowerCase() === filterManagerName.toLowerCase());
    }

    tableBody.innerHTML = "";

    if (projects.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-secondary py-4">No projects found.</td>
            </tr>
        `;
        return;
    }

    projects.forEach(proj => {
        let statusBadge = "badge-status-todo";
        if (proj.status === "Active") statusBadge = "badge-status-progress";
        if (proj.status === "Completed") statusBadge = "badge-status-done";
        
        // Progress bar color
        let progressColor = "bg-primary";
        if (proj.status === "Completed") progressColor = "bg-success";
        if (proj.status === "Pending") progressColor = "bg-secondary";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="fw-bold text-white">${proj.name}</td>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(proj.manager)}&background=random" class="rounded-circle" style="width:24px; height:24px;" alt="Manager">
                    <span>${proj.manager}</span>
                </div>
            </td>
            <td><span class="text-secondary-custom">${proj.dept}</span></td>
            <td><span class="badge-custom ${statusBadge}">${proj.status}</span></td>
            <td style="width: 200px;">
                <div class="d-flex align-items-center gap-2">
                    <div class="progress flex-grow-1" style="height: 6px; background-color: var(--bg-input);">
                        <div class="progress-bar ${progressColor}" role="progressbar" style="width: ${proj.progress}%;" aria-valuenow="${proj.progress}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <span class="small font-weight-semibold" style="width:30px;">${proj.progress}%</span>
                </div>
            </td>
            <td class="text-end">
                <button class="btn btn-link text-secondary-custom p-0 edit-project-btn me-2" data-id="${proj.id}"><i class="fa-regular fa-edit"></i></button>
                <button class="btn btn-link text-danger p-0 delete-project-btn" data-id="${proj.id}"><i class="fa-regular fa-trash-can"></i></button>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    // Delete project click handler
    document.querySelectorAll(".delete-project-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = parseInt(btn.dataset.id);
            let allProjs = JSON.parse(localStorage.getItem("workhub_projects")) || [];
            allProjs = allProjs.filter(p => p.id !== id);
            localStorage.setItem("workhub_projects", JSON.stringify(allProjs));
            renderProjectsCommon(containerId, filterManagerName);
        });
    });

    // Edit project (Increments progress for demo click representation)
    document.querySelectorAll(".edit-project-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = parseInt(btn.dataset.id);
            let allProjs = JSON.parse(localStorage.getItem("workhub_projects")) || [];
            const proj = allProjs.find(p => p.id === id);
            if (proj) {
                proj.progress = Math.min(proj.progress + 10, 100);
                if (proj.progress === 100) proj.status = "Completed";
                else if (proj.progress > 0) proj.status = "Active";
                localStorage.setItem("workhub_projects", JSON.stringify(allProjs));
                renderProjectsCommon(containerId, filterManagerName);
            }
        });
    });
};

// Admin Projects page initializer
window.PageModules['admin-projects'] = function() {
    renderProjectsCommon("projects-table-body");

    const addForm = document.getElementById("addProjectForm");
    if (addForm) {
        addForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const name = document.getElementById("projectName").value;
            const manager = document.getElementById("projectManager").value;
            const dept = document.getElementById("projectDept").value;
            const status = document.getElementById("projectStatus").value;

            let allProjs = JSON.parse(localStorage.getItem("workhub_projects")) || [];
            const newProj = {
                id: Date.now(),
                name,
                manager,
                dept,
                status,
                progress: status === "Completed" ? 100 : (status === "Active" ? 10 : 0)
            };

            allProjs.push(newProj);
            localStorage.setItem("workhub_projects", JSON.stringify(allProjs));

            addForm.reset();
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById("addProjectModal"));
            if (modalInstance) modalInstance.hide();

            renderProjectsCommon("projects-table-body");
        });
    }
};

// Manager Projects page initializer
window.PageModules['manager-projects'] = function() {
    const activeUser = window.currentUser || JSON.parse(localStorage.getItem("currentUser"));
    const managerName = activeUser ? activeUser.name : "Sarah Miller";
    
    renderProjectsCommon("projects-table-body", managerName);

    const addForm = document.getElementById("addProjectForm");
    if (addForm) {
        // Pre-fill manager name and restrict for manager view
        const managerSelect = document.getElementById("projectManager");
        if (managerSelect) {
            managerSelect.innerHTML = `<option value="${managerName}">${managerName}</option>`;
            managerSelect.disabled = true;
        }

        addForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const name = document.getElementById("projectName").value;
            const dept = document.getElementById("projectDept").value;
            const status = document.getElementById("projectStatus").value;

            let allProjs = JSON.parse(localStorage.getItem("workhub_projects")) || [];
            const newProj = {
                id: Date.now(),
                name,
                manager: managerName,
                dept,
                status,
                progress: status === "Completed" ? 100 : (status === "Active" ? 10 : 0)
            };

            allProjs.push(newProj);
            localStorage.setItem("workhub_projects", JSON.stringify(allProjs));

            addForm.reset();
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById("addProjectModal"));
            if (modalInstance) modalInstance.hide();

            renderProjectsCommon("projects-table-body", managerName);
        });
    }
};

// Employee Projects page initializer
window.PageModules['employee-myprojects'] = function() {
    renderProjectsCommon("projects-table-body");

    // Hide edit/delete actions column for read-only access
    setTimeout(() => {
        document.querySelectorAll(".table-custom th:last-child, .table-custom td:last-child").forEach(el => {
            el.style.display = "none";
        });
    }, 100);
};
