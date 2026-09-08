/**
 * Shared dashboard UI — sidebar toggle, overlay, responsive close
 */
(function initDashboardUI() {
    function getSidebar() {
        return document.getElementById('sidebar-wrapper') || document.querySelector('.app > .sidebar, .sidebar');
    }

    function toggleSidebar(forceOpen) {
        const sidebar = getSidebar();
        const overlay = document.getElementById('sidebarOverlay');
        if (!sidebar) return;

        const shouldOpen = typeof forceOpen === 'boolean'
            ? forceOpen
            : !sidebar.classList.contains('open');

        sidebar.classList.toggle('open', shouldOpen);
        if (overlay) {
            overlay.classList.toggle('active', shouldOpen);
        }
    }

    function closeSidebarIfMobile() {
        if (window.innerWidth > 992) return;
        toggleSidebar(false);
    }

    document.addEventListener('DOMContentLoaded', function () {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebarClose = document.getElementById('sidebarClose');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        const sidebar = getSidebar();

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                toggleSidebar();
            });
        }

        if (sidebarClose) {
            sidebarClose.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                toggleSidebar(false);
            });
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', function () {
                toggleSidebar(false);
            });
        }

        document.addEventListener('click', function (e) {
            if (!sidebar || !sidebar.classList.contains('open') || window.innerWidth > 992) {
                return;
            }
            if (!sidebar.contains(e.target) && !e.target.closest('#sidebarToggle')) {
                toggleSidebar(false);
            }
        });

        window.addEventListener('resize', function () {
            if (window.innerWidth > 992) {
                toggleSidebar(false);
            }
        });

        window.dashboardUI = {
            toggleSidebar,
            closeSidebarIfMobile,
            getSidebar
        };
    });
})();
