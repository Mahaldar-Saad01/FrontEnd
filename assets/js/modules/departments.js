// Departments Module Initializer
window.PageModules['admin-departments'] = function() {
    const gridContainer = document.getElementById("departments-grid-container");
    const addForm = document.getElementById("addDeptForm");

    let depts = JSON.parse(localStorage.getItem("workhub_departments"));
    if (!depts) {
        depts = [
            { id: 1, name: "Engineering", head: "Sarah Miller", count: 8 },
            { id: 2, name: "Design", head: "Saad Mahaldar", count: 3 },
            { id: 3, name: "Marketing", head: "Alex Mercer", count: 4 },
            { id: 4, name: "HR", head: "Sarah Miller", count: 2 }
        ];
        localStorage.setItem("workhub_departments", JSON.stringify(depts));
    }

    const renderDepartments = () => {
        if (!gridContainer) return;

        gridContainer.innerHTML = "";

        depts.forEach(dept => {
            const card = document.createElement("div");
            card.className = "col-xl-3 col-lg-4 col-md-6 col-sm-12";
            card.innerHTML = `
                <div class="card-custom h-100 d-flex flex-column justify-content-between p-4 dept-card" data-dept="${dept.name}">
                    <div>
                        <div class="d-flex align-items-center justify-content-center rounded-3 bg-dark border mb-3 text-primary" style="width: 48px; height: 48px; border-color: var(--border-color) !important;">
                            <i class="fa-solid fa-building fs-5"></i>
                        </div>
                        <h5 class="fw-bold text-white mb-1">${dept.name}</h5>
                        <span class="badge bg-secondary rounded-pill font-size-xs px-2.5 py-1 mb-3">${dept.count} Members</span>
                    </div>

                    <div class="border-top pt-3 d-flex align-items-center justify-content-between" style="border-color: var(--border-color) !important;">
                        <div class="d-flex align-items-center gap-2">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(dept.head)}&background=random" class="rounded-circle" style="width:28px; height:28px;" alt="Lead">
                            <div>
                                <div class="text-white small fw-semibold">${dept.head}</div>
                                <div class="text-muted" style="font-size: 0.7rem;">Lead Manager</div>
                            </div>
                        </div>
                        <button class="btn btn-link text-danger p-0 delete-dept-btn" data-id="${dept.id}"><i class="fa-regular fa-trash-can"></i></button>
                    </div>
                </div>
            `;
            gridContainer.appendChild(card);

            // click to open department detail
            const deptEl = card.querySelector('.dept-card');
            if (deptEl) {
                deptEl.style.cursor = 'pointer';
                deptEl.addEventListener('click', (e) => {
                    // prevent delete button clicks from triggering
                    if (e.target.closest('.delete-dept-btn')) return;
                    showDeptDetails(dept.name);
                });
            }
        });

        // Delete department handler
        document.querySelectorAll(".delete-dept-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = parseInt(btn.dataset.id);
                depts = depts.filter(d => d.id !== id);
                localStorage.setItem("workhub_departments", JSON.stringify(depts));
                renderDepartments();
            });
        });

        // showDeptDetails function
        function showDeptDetails(deptName) {
            const modalLabel = document.getElementById('deptDetailModalLabel');
            const detailName = document.getElementById('dept-detail-name');
            const detailCount = document.getElementById('dept-detail-count');
            const membersBody = document.getElementById('dept-members-body');

            if (!membersBody || !detailName || !detailCount) return;

            detailName.textContent = deptName;

            const employees = (window.getEmployeesData ? getEmployeesData() : JSON.parse(localStorage.getItem('workhub_employees') || '[]'));
            const projects = JSON.parse(localStorage.getItem('workhub_projects') || '[]');
            const tasks = JSON.parse(localStorage.getItem('workhub_tasks') || '[]');

            const members = employees.filter(e => e.dept === deptName);
            detailCount.textContent = `${members.length} Members`;

            membersBody.innerHTML = '';

            members.forEach(member => {
                // determine project for member: prefer tasks assignedTo -> project
                const assignedTasks = tasks.filter(t => t.assignedTo === member.name);
                let projectName = '—';
                let managerName = '';
                if (assignedTasks.length) {
                    projectName = assignedTasks[0].project;
                    const proj = projects.find(p => p.name === projectName);
                    managerName = proj ? proj.manager : '';
                } else {
                    // fallback: find a project in the dept that lists this member as manager
                    const projManaged = projects.find(p => p.manager === member.name || p.dept === member.dept);
                    if (projManaged) {
                        projectName = projManaged.name;
                        managerName = projManaged.manager;
                    } else {
                        // fallback to department head
                        const deptObj = depts.find(d => d.name === deptName);
                        managerName = deptObj ? deptObj.head : '';
                    }
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random" class="rounded-circle" style="width:28px; height:28px;" alt="Avatar">
                            <div>
                                <div class="fw-bold text-white">${member.name}</div>
                                <div class="text-secondary small">${member.email || ''}</div>
                            </div>
                        </div>
                    </td>
                    <td class="text-white">${projectName}</td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(managerName)}&background=random" class="rounded-circle" style="width:28px; height:28px;" alt="Manager">
                            <span class="text-white small fw-semibold">${managerName}</span>
                        </div>
                    </td>
                    <td class="text-capitalize small fw-semibold">${member.role}</td>
                    <td><span class="badge-custom ${member.status === 'Active' ? 'badge-status-progress' : 'badge-status-todo'}">${member.status}</span></td>
                `;
                membersBody.appendChild(tr);
            });

            // show modal
            const modalEl = document.getElementById('deptDetailModal');
            if (modalEl) {
                const instance = new bootstrap.Modal(modalEl);
                instance.show();
            }
        }

    };

    // Form submit handler
    if (addForm) {
        addForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const name = document.getElementById("deptName").value;
            const head = document.getElementById("deptLead").value;
            const count = parseInt(document.getElementById("deptCount").value);

            const newDept = {
                id: Date.now(),
                name,
                head,
                count
            };

            depts.push(newDept);
            localStorage.setItem("workhub_departments", JSON.stringify(depts));

            addForm.reset();
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById("addDeptModal"));
            if (modalInstance) modalInstance.hide();

            renderDepartments();
        });
    }

    renderDepartments();
};
