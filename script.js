// script.js

// 1. DATA SIMULATIONS
const platformStatsData = [
  { title: "Total Departments", value: "8", subtext: "Managed by System", iconClass: "bi-building text-primary" },
  { title: "Total Users", value: "24", subtext: "License Allocation", iconClass: "bi-people text-success" },
  { title: "Active Projects", value: "14", subtext: "System Wide Overview", iconClass: "bi-folder text-warning" },
  { title: "Global Health", value: "99%", subtext: "Uptime %", iconClass: "bi-activity text-danger" }
];

const pmProjectsData = [
    { name: "Website Redesign", code: "PROJ-WR-201", members: 5, progress: 75, deadline: "Due: 2026-12-15", status: "In Progress", color: "#0d6efd" },
    { name: "Mobile App Milestone 2", code: "PROJ-MA-002", members: 8, progress: 45, deadline: "Due: 2026-12-30", status: "In Progress", color: "#6f42c1" },
    { name: "CRM Database Migration", code: "PROJ-DB-404", members: 3, progress: 100, deadline: "Due: 2026-11-01", status: "Completed", color: "#198754" },
    { name: "Marketing Campaign Q4", code: "PROJ-MC-Q4", members: 4, progress: 15, deadline: "Due: 2027-01-10", status: "Pending", color: "#fd7e14" }
];

const pmStatsData = [
    { title: "My Projects", value: "3", subtext: "Assignees & Milestones", iconClass: "bi-folder text-primary" },
    { title: "My Open Tasks", value: "18", subtext: "Assigned Across Projects", iconClass: "bi-list-task text-warning" },
    { title: "Team Capacity", value: "75%", subtext: "Weekly Average", iconClass: "bi-graph-up text-success" },
    { title: "Overdue Tasks", value: "2", subtext: "Require Attention", iconClass: "bi-exclamation-octagon text-danger" }
];

const usersTableData = [
    { name: "Alex Admin", email: "admin@projflow.com", initials: "AA", role: "Super Admin", status: "Active" },
    { name: "Maria Manager", email: "maria@projflow.com", initials: "MM", role: "Project Manager", status: "Active" },
    { name: "Ethan Employee", email: "ethan@projflow.com", initials: "EE", role: "Employee", status: "Active" }
];

// 2. ROLE CONFIGURATIONS
const rolesConfig = {
    superadmin: {
        id: 'superadmin',
        displayName: 'Alex Admin',
        initials: 'AA',
        roleTitle: 'Super Admin',
        navGroups: ['nav-group-superadmin'],
        actions: ['btn-admin-add-user']
    },
    pm: {
        id: 'pm',
        displayName: 'Maria Manager',
        initials: 'MM',
        roleTitle: 'Project Manager',
        navGroups: ['nav-group-pm'],
        actions: ['btn-pm-create-project']
    },
    employee: {
        id: 'employee',
        displayName: 'Ethan Employee',
        initials: 'EE',
        roleTitle: 'Employee',
        navGroups: ['nav-group-employee'],
        actions: []
    }
};

let currentUser = rolesConfig.superadmin; // Default

// 3. PAGE INITIALIZATION
window.addEventListener('DOMContentLoaded', () => {
    // Menu Toggle functionality
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('wrapper').classList.toggle('toggled');
        });
    }

    // Dropdown Change Listener
    const loginSelector = document.getElementById('mock-login-selector');
    if (loginSelector) {
        loginSelector.addEventListener('change', (e) => {
            const selectedRole = e.target.value;
            if (rolesConfig[selectedRole]) {
                currentUser = rolesConfig[selectedRole];
                applyRBACPermissions(currentUser);
            }
        });
    }

    // Navigation Click Engine
    setupViewNavigation();

    // Trigger initial load for default user
    applyRBACPermissions(currentUser);
});

// 4. RBAC DISPLAY ENFORCER
function applyRBACPermissions(user) {
    // Update Topbar Profile Details
    document.getElementById('user-avatar-initials').innerText = user.initials;
    document.getElementById('user-display-name').innerText = user.displayName;
    document.getElementById('user-display-role').innerText = user.roleTitle;

    // Hide all role-specific sidebar options and buttons
    document.querySelectorAll('.rbac-managed, #role-action-area button').forEach(el => {
        el.classList.add('d-none');
    });

    // Unhide current role features
    user.navGroups.forEach(groupId => {
        const el = document.getElementById(groupId);
        if (el) el.classList.remove('d-none');
    });
    user.actions.forEach(actionId => {
        const el = document.getElementById(actionId);
        if (el) el.classList.remove('d-none');
    });

    // Reset layout navigation back to default general dashboard view on switch
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById('nav-dashboard').classList.add('active');
    
    loadView('dashboard');
}

function setupViewNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            const targetRoute = this.getAttribute('href').substring(1);
            loadView(targetRoute);
        });
    });
}

// 5. VIEW CONTEXT LOADER
function loadView(viewName) {
    const mainContainer = document.getElementById('main-view-container');
    if (!mainContainer) return;

    switch (viewName) {
        case 'dashboard':
            renderDashboard(mainContainer, currentUser);
            break;
        case 'manage-users':
            renderUsersCrud(mainContainer);
            break;
        case 'manage-projects':
            renderProjectsCrud(mainContainer);
            break;
        case 'my-tasks':
            renderEmployeeTasks(mainContainer);
            break;
        default:
            mainContainer.innerHTML = `
                <div class="card p-4 shadow-sm">
                    <h5 class="text-muted mb-0"><i class="bi bi-cone-striped me-2 text-warning"></i>${viewName.replace('-',' ')} Page</h5>
                    <p class="text-muted fs-7 mb-0 mt-2">Content container successfully linked. Ready for functional layout additions.</p>
                </div>`;
    }
}

// 6. FRONT-END GENERATION TEMPLATES
function renderDashboard(container, user) {
    let cardContent = '';
    let welcomeMessage = '';
    let cardsArray = [];

    if (user.id === 'superadmin') {
        welcomeMessage = "Platform Overview and Global System Metrics.";
        cardsArray = platformStatsData;
    } else if (user.id === 'pm') {
        welcomeMessage = "Monitor project progress, workloads, and operational outputs.";
        cardsArray = pmStatsData;
    } else {
        renderEmployeeDashboard(container);
        return;
    }

    cardsArray.forEach(stat => {
        cardContent += `
            <div class="col-md-3">
                <div class="card shadow-sm h-100 stat-card">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-2">
                          <i class="bi ${stat.iconClass} fs-3 me-3"></i>
                          <h6 class="card-subtitle text-muted mb-0">${stat.title}</h6>
                        </div>
                        <h2 class="card-title fw-bold text-center text-primary fs-1 mb-1">${stat.value}</h2>
                        <p class="card-text text-muted text-center fs-7 mb-0">${stat.subtext}</p>
                    </div>
                </div>
            </div>`;
    });

    container.innerHTML = `
        <div class="welcome-banner p-5 mb-4 text-white rounded">
            <h1 class="display-6 fw-bold">Welcome back, ${user.displayName}!</h1>
            <p class="fs-5 mb-0">${welcomeMessage}</p>
        </div>
        <div class="row g-4 mb-4">${cardContent}</div>
    `;
}

function renderEmployeeDashboard(container) {
    container.innerHTML = `
        <div class="welcome-banner p-5 mb-4 text-white rounded bg-success-gradient">
            <h1 class="display-6 fw-bold">Good Morning, Ethan!</h1>
            <p class="fs-5 mb-0">Your workspace focus and current assigned performance metrics.</p>
        </div>
        <div class="card shadow-sm p-4">
            <h5 class="text-muted mb-3">My Current Metrics</h5>
            <div class="row g-3">
                <div class="col-md-6"><div class="p-3 border rounded bg-light"><strong>Assigned Tasks:</strong> 5 Open Tasks</div></div>
                <div class="col-md-6"><div class="p-3 border rounded bg-light"><strong>Hours Logged:</strong> 14.5 hrs this week</div></div>
            </div>
        </div>`;
}

function renderProjectsCrud(container) {
    let rows = '';
    pmProjectsData.forEach(p => {
        rows += `
            <tr>
                <td><strong>${p.name}</strong><br><small class="text-muted">${p.code}</small></td>
                <td><span class="badge bg-light text-dark border">${p.members} Workers</span></td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="progress flex-grow-1 me-2"><div class="progress-bar" style="width: ${p.progress}%; background-color: ${p.color};"></div></div>
                        <span class="fs-7 fw-bold">${p.progress}%</span>
                    </div>
                </td>
                <td><small>${p.deadline}</small></td>
                <td><span class="badge bg-primary">${p.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-secondary me-1"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`;
    });

    container.innerHTML = `
        <div class="card shadow-sm p-4">
            <div class="d-flex align-items-center mb-4">
                <h5 class="text-muted mb-0">Active Project Framework</h5>
                <button class="btn btn-success btn-sm ms-auto" onclick="alert('Project Modal Form Triggered')"><i class="bi bi-plus-lg me-1"></i>New Project</button>
            </div>
            <div class="table-responsive">
                <table class="table align-middle crud-table">
                    <thead class="table-light">
                        <tr><th>Project Title</th><th>Team size</th><th>Progress</th><th>Deadline</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>`;
}

function renderUsersCrud(container) {
    let rows = '';
    usersTableData.forEach(u => {
        rows += `
            <tr>
                <td><div class="d-flex align-items-center"><div class="avatar-small me-2 fs-7">${u.initials}</div><strong>${u.name}</strong></div></td>
                <td>${u.email}</td>
                <td><span class="badge bg-secondary">${u.role}</span></td>
                <td><span class="badge bg-success">${u.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-secondary me-1"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`;
    });

    container.innerHTML = `
        <div class="card shadow-sm p-4">
            <h5 class="text-muted mb-4">System User Registry</h5>
            <div class="table-responsive">
                <table class="table align-middle crud-table">
                    <thead class="table-light">
                        <tr><th>User Profile</th><th>System Email</th><th>Permission Group</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>`;
}

function renderEmployeeTasks(container) {
    container.innerHTML = `
        <div class="card shadow-sm p-4">
            <h5 class="text-muted mb-3">Task Workspace Assignments</h5>
            <div class="list-group list-group-flush">
                <div class="list-group-item d-flex align-items-center py-3">
                    <i class="bi bi-circle-fill text-primary me-3"></i>
                    <div><h6 class="mb-0 fw-bold">Finalize Interface Mockups</h6><small class="text-muted">Due: 2026-12-15</small></div>
                    <div class="ms-auto">
                        <button class="btn btn-sm btn-outline-primary" onclick="alert('File selector activated')"><i class="bi bi-cloud-arrow-up me-1"></i>Upload Resource</button>
                    </div>
                </div>
            </div>
        </div>`;
}