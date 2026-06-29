// SPA-wide Bootstrap modal guard.
// Live Server injects its own script at runtime; Bootstrap injects modal backdrops.
// In this fragment-based shell those backdrops can survive page swaps, so we disable
// them globally and remove any stale ones that were already created.
(function () {
    const cleanupModalArtifacts = () => {
        document.querySelectorAll('.modal-backdrop').forEach((backdrop) => backdrop.remove());

        if (!document.querySelector('.modal.show')) {
            document.body.classList.remove('modal-open');
            document.body.style.removeProperty('overflow');
            document.body.style.removeProperty('padding-right');
        }
    };

    const disableBootstrapBackdrops = () => {
        if (!window.bootstrap?.Modal) return;
        if (window.bootstrap.Modal.Default) {
            window.bootstrap.Modal.Default.backdrop = false;
        }
        document.querySelectorAll('.modal').forEach((modalEl) => {
            modalEl.setAttribute('data-bs-backdrop', 'false');
        });
        document.querySelectorAll('[data-bs-toggle="modal"]').forEach((trigger) => {
            trigger.setAttribute('data-bs-backdrop', 'false');
        });
    };

    disableBootstrapBackdrops();
    cleanupModalArtifacts();

    document.addEventListener('show.bs.modal', disableBootstrapBackdrops);
    document.addEventListener('shown.bs.modal', cleanupModalArtifacts);
    document.addEventListener('hidden.bs.modal', cleanupModalArtifacts);

    const observer = new MutationObserver(() => {
        disableBootstrapBackdrops();
        cleanupModalArtifacts();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    window.ModalHelpers = {
        cleanup: cleanupModalArtifacts,
        show: (modalId) => {
            const el = document.getElementById(modalId);
            if (el) {
                el.setAttribute('data-bs-backdrop', 'false');
                const modal = new bootstrap.Modal(el, { backdrop: false });
                modal.show();
            }
        },
        hide: (modalId) => {
            const el = document.getElementById(modalId);
            if (el) {
                const inst = bootstrap.Modal.getInstance(el);
                if (inst) inst.hide();
                cleanupModalArtifacts();
            }
        }
    };
})();
