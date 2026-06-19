document.addEventListener("DOMContentLoaded", async () => {
    const sidebarContainer = document.getElementById("sidebar-container");
    const mainContent = document.getElementById("main-content");

    if (!sidebarContainer || !mainContent) return;

    // Retrieve active user details
    const sessionUserRaw = localStorage.getItem("currentUser");
    if (!sessionUserRaw) return;
    const currentUser = JSON.parse(sessionUserRaw);
    const role = currentUser.role;

    // Routing page mapping
    const pageMap = {
        chat: "pages/common/chat.html",
        meetings: "pages/common/meetings.html",
        calendar: "pages/common/calendar.html",
        notifications: "pages/common/notifications.html",
        
        dashboard: `pages/${role}/dashboard.html`,
        projects: role === 'employee' ? 'pages/employee/myprojects.html' : `pages/${role}/projects.html`,
        tasks: role === 'manager' ? 'pages/manager/assignments.html' : 'pages/employee/mytasks.html',
        approvals: "pages/admin/approvals.html",
        kanban: `pages/${role}/kanban.html`,
        reports: `pages/${role}/reports.html`,
        reviews: "pages/manager/reviews.html",
        
        team: "pages/manager/team.html",
        departments: "pages/admin/departments.html",
        employees: "pages/admin/employees.html",
        settings: "pages/common/settings.html",
        myprojects: "pages/employee/myprojects.html",
        mytasks: "pages/employee/mytasks.html",
        assignments: "pages/manager/assignments.html",
        profile: "pages/employee/profile.html"
    };

    // Specific folder+file key to invoke unique PageModules script initializers
    const getPageKeyFromPath = (path) => {
        const parts = path.split("/");
        const fileName = parts.pop() || "";
        const cleanName = fileName.replace(".html", "");
        const folderName = parts.pop() || "";
        
        if (folderName === "common" || !folderName) {
            return cleanName;
        }
        if (cleanName === "calendar") {
            return "calender";
        }
        return `${folderName}-${cleanName}`;
    };

    // Clean user-facing URL hash keys
    const getUrlKeyFromPath = (path) => {
        const key = Object.keys(pageMap).find(k => pageMap[k] === path);
        if (key) return key;
        const fileName = path.split("/").pop() || "";
        return fileName.replace(".html", "");
    };

    const setActiveLink = (pagePath) => {
        const activeUrlKey = getUrlKeyFromPath(pagePath);
        document.querySelectorAll(".menu-link").forEach((link) => {
            const linkPage = link.dataset.page;
            const linkHash = link.getAttribute("href");
            const isActive = linkPage === pagePath || (linkHash && linkHash === `#${activeUrlKey}`);
            link.classList.toggle("active", isActive);
        });
    };

    // Render sidebar template in parallel
    const sidebarPromise = (async () => {
        try {
            const response = await fetch("sidebar.html");
            if (!response.ok) {
                throw new Error("Sidebar file not found");
            }
            sidebarContainer.innerHTML = await response.text();
            
            // Show active role menu
            const roleGroup = document.getElementById(`sidebar-group-${role}`);
            if (roleGroup) {
                roleGroup.style.display = "block";
            }
        } catch (error) {
            sidebarContainer.innerHTML = `
                <aside class="p-3 text-danger border-end border-danger" style="width:260px;">
                    ${error.message}
                </aside>
            `;
        }
    })();

    const loadPage = async (pagePath, shouldUpdateHistory = true) => {
        // Role authorization check for admin and manager pages
        if (pagePath.includes("pages/admin/") && role !== "admin") {
            console.warn(`Unauthorized access attempt to ${pagePath} by role: ${role}`);
            loadPage(`pages/${role}/dashboard.html`, true);
            return;
        }
        if (pagePath.includes("pages/manager/") && role !== "admin" && role !== "manager") {
            console.warn(`Unauthorized access attempt to ${pagePath} by role: ${role}`);
            loadPage(`pages/${role}/dashboard.html`, true);
            return;
        }

        try {
            // Start fetching page content in parallel immediately
            const pageFetchPromise = fetch(pagePath);

            mainContent.innerHTML = `
                <div class="d-flex h-100 align-items-center justify-content-center text-secondary">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            `;

            const response = await pageFetchPromise;

            if (!response.ok) {
                throw new Error(`${pagePath} not found`);
            }

            const htmlContent = await response.text();
            
            // Inject views
            mainContent.innerHTML = `<div class="fade-in-view h-100">${htmlContent}</div>`;
            
            // Wait for sidebar template to render before setting active highlights
            await sidebarPromise;
            setActiveLink(pagePath);

            // Update clean URL hash history
            if (shouldUpdateHistory) {
                const urlKey = getUrlKeyFromPath(pagePath);
                history.pushState({ pagePath }, "", `#${urlKey}`);
            }

            // Execute corresponding PageModule script initializers immediately
            const pageKey = getPageKeyFromPath(pagePath);
            console.log(`Page Injected: ${pagePath} (Script Key: ${pageKey})`);
            
            if (window.PageModules && typeof window.PageModules[pageKey] === 'function') {
                try {
                    window.PageModules[pageKey]();
                } catch (e) {
                    console.error(`Error executing initializer for key: ${pageKey}`, e);
                }
            }
        } catch (error) {
            mainContent.innerHTML = `
                <div class="alert alert-danger m-3" role="alert">
                    <i class="fa-solid fa-circle-exclamation me-2"></i>
                    Error loading page: ${error.message}
                </div>
            `;
        }
    };

    // Intercept sidebar navigation click actions
    sidebarContainer.addEventListener("click", (event) => {
        const link = event.target.closest(".menu-link");

        if (!link) return;

        event.preventDefault();
        
        const hash = link.getAttribute("href").replace("#", "");
        const path = link.dataset.page || pageMap[hash];
        
        if (path) {
            loadPage(path);
        }
    });

    // Handle browser navigation events
    window.addEventListener("popstate", (event) => {
        const hashKey = location.hash.replace("#", "");
        const pagePath = event.state?.pagePath || pageMap[hashKey] || pageMap.dashboard;
        loadPage(pagePath, false);
    });

    // Bootstrapped view on page load (executed immediately on DOMContentLoaded for faster rendering)
    const hashKey = location.hash.replace("#", "");
    const initialPage = pageMap[hashKey] || pageMap.dashboard;
    const cleanUrlKey = getUrlKeyFromPath(initialPage);
    
    history.replaceState({ pagePath: initialPage }, "", `#${cleanUrlKey}`);
    loadPage(initialPage, false);
});
