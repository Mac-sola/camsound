// Session helper: initializes user from the session endpoint and provides helpers
(function () {
    window.afro = window.afro || {};
    window.afro.user = null;
    window.afro.userPromise = null;

    window.afro.init = function () {
        try {
            this.userPromise = fetch('backend/api/session.php', { credentials: 'same-origin' })
                .then(r => r.json())
                .then(j => { if (j && j.success && j.data && j.data.user) { this.user = j.data.user; } return this.user; })
                .catch(() => null);
            return this.userPromise;
        } catch (e) {
            this.userPromise = Promise.resolve(null);
            return this.userPromise;
        }
    };

    window.afro.setUser = function (u) { this.user = u; };
    window.afro.clearUser = function () { this.user = null; };

    window.afro.storage = {
        async get(key) {
            try {
                const res = await fetch('backend/api/storage.php?action=get&key=' + encodeURIComponent(key), { credentials: 'same-origin' });
                const j = await res.json();
                if (j && j.success) return j.value ? JSON.parse(j.value) : null;
            } catch (e) { }
            return null;
        },
        async set(key, value) {
            try {
                const res = await fetch('backend/api/storage.php', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'set', key, value }) });
                const j = await res.json(); if (j && j.success) return true;
            } catch (e) { }
            return false;
        },
        async remove(key) {
            try {
                const res = await fetch('backend/api/storage.php', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'remove', key }) });
                const j = await res.json(); if (j && j.success) return true;
            } catch (e) { }
            return false;
        }
    };

    // auto-init on load
    window.addEventListener('load', () => { window.afro.init(); });
})();
