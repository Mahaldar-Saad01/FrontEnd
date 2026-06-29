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
    const adminSecurityOptions = document.querySelector(".admin-security-options");

    if (securityCol) securityCol.style.display = 'block';
    if (adminSecurityOptions) adminSecurityOptions.style.display = role === 'admin' ? 'block' : 'none';
    if (brandingCol) {
        brandingCol.className = role === 'admin' ? 'col-lg-6 col-md-12' : 'col-lg-6 col-md-12';
    }

    const showPasswordAlert = (type, message) => {
        const alertEl = document.getElementById("change-password-alert");
        if (!alertEl) return;
        const tone = type === "success"
            ? "rgba(16,185,129,0.15); border-color:var(--color-success); color:var(--color-success);"
            : "rgba(239,68,68,0.15); border-color:var(--color-danger); color:var(--color-danger);";
        const icon = type === "success" ? "fa-circle-check" : "fa-triangle-exclamation";
        alertEl.innerHTML = `
            <div class="alert d-flex align-items-center mb-3 fade-in-view" role="alert" style="background-color:${tone}">
                <i class="fa-solid ${icon} me-2"></i>
                <div>${message}</div>
            </div>
        `;
    };

    const getErrorMessage = async (resp, fallback) => {
        try {
            const data = await resp.json();
            const firstValue = Object.values(data || {})[0];
            if (Array.isArray(firstValue)) return firstValue[0] || fallback;
            return firstValue || data.detail || fallback;
        } catch {
            return fallback;
        }
    };

    const sendOtpBtn = document.getElementById("send-password-otp-btn");
    const changePasswordForm = document.getElementById("change-password-otp-form");
    const confirmPasswordBtn = document.getElementById("confirm-password-change-btn");
    const emailLabel = document.getElementById("change-password-email-label");
    const modalEl = document.getElementById("changePasswordOtpModal");
    const successModalEl = document.getElementById("passwordChangedSuccessModal");

    if (emailLabel && currentUser?.email) {
        emailLabel.textContent = `Send OTP to ${currentUser.email}`;
    }

    if (sendOtpBtn) {
        sendOtpBtn.addEventListener("click", async () => {
            sendOtpBtn.disabled = true;
            sendOtpBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Sending';
            try {
                const resp = await WorkHubAPI.post('/auth/password-otp/request/', {});
                if (!resp.ok) {
                    showPasswordAlert("danger", await getErrorMessage(resp, "Failed to send OTP."));
                    return;
                }
                showPasswordAlert("success", "OTP sent. Check the backend terminal output.");
            } catch (err) {
                showPasswordAlert("danger", "Network error while sending OTP.");
            } finally {
                sendOtpBtn.disabled = false;
                sendOtpBtn.innerHTML = 'Send OTP';
            }
        });
    }

    if (changePasswordForm) {
        changePasswordForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const otp = document.getElementById("password-otp-code")?.value.trim();
            const newPassword = document.getElementById("settings-new-password")?.value;
            const confirmPassword = document.getElementById("settings-confirm-password")?.value;

            if (!otp || !newPassword || !confirmPassword) {
                showPasswordAlert("danger", "Enter the OTP and both password fields.");
                return;
            }
            if (newPassword !== confirmPassword) {
                showPasswordAlert("danger", "Passwords do not match.");
                return;
            }

            if (confirmPasswordBtn) {
                confirmPasswordBtn.disabled = true;
                confirmPasswordBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Updating';
            }

            try {
                const resp = await WorkHubAPI.post('/auth/password-otp/confirm/', {
                    otp,
                    new_password: newPassword,
                    confirm_password: confirmPassword
                });
                if (!resp.ok) {
                    showPasswordAlert("danger", await getErrorMessage(resp, "Password update failed."));
                    return;
                }

                showPasswordAlert("success", "Password changed successfully.");
                setTimeout(() => {
                    changePasswordForm.reset();
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                    if (successModalEl) {
                        const successModal = bootstrap.Modal.getOrCreateInstance(successModalEl);
                        successModal.show();
                    }
                }, 900);
            } catch (err) {
                showPasswordAlert("danger", "Network error while updating password.");
            } finally {
                if (confirmPasswordBtn) {
                    confirmPasswordBtn.disabled = false;
                    confirmPasswordBtn.innerHTML = '<i class="fa-solid fa-lock me-2"></i>Update Password';
                }
            }
        });
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
