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
                <div class="card-custom h-100 d-flex flex-column justify-content-between p-4">
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
