// Utility functions to facilitate Bootstrap modal trigger hooks in SPA
window.ModalHelpers = {
    show: (modalId) => {
        const el = document.getElementById(modalId);
        if (el) {
            const modal = new bootstrap.Modal(el);
            modal.show();
        }
    },
    hide: (modalId) => {
        const el = document.getElementById(modalId);
        if (el) {
            const inst = bootstrap.Modal.getInstance(el);
            if (inst) inst.hide();
        }
    }
};
