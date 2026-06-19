/**
 * Settings Module
 * Handles loading system settings, dynamic layout styling based on user role,
 * and saving visual configuration parameters.
 */
window.PageModules['settings'] = async function () {
    const currentUser = WorkHubAPI.getCurrentUser();
    const role = currentUser?.role;

    const securityCol = document.getElementById("security-settings-col");
    const brandingCol = document.getElementById("branding-settings-col");

    // Hide Permissions & Security if user is not Admin
    if (securityCol) {
        if (role !== 'admin') {
            securityCol.style.display = 'none';
            if (brandingCol) {
                brandingCol.className = 'col-12';
            }
        } else {
            securityCol.style.display = 'block';
            if (brandingCol) {
                brandingCol.className = 'col-lg-6 col-md-12';
            }
        }
    }

    // Bind Save Simulation alert
    const saveBtn = document.getElementById("settings-save-btn");
    const alertContainer = document.getElementById("settings-alert-container");

    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            if (alertContainer) {
                alertContainer.innerHTML = `
                    <div class="alert alert-success d-flex align-items-center mb-4 fade-in-view" role="alert" style="background-color: rgba(16, 185, 129, 0.15); border-color: var(--color-success); color: var(--color-success);">
                        <i class="fa-solid fa-circle-check me-2"></i>
                        <div>System configuration saved successfully.</div>
                    </div>
                `;
                setTimeout(() => {
                    alertContainer.innerHTML = "";
                }, 3000);
            }
        });
    }
};
