// Utility script for AfroRhythm project
window.afro = window.afro || {};
window.t = window.t || function (key) { return key; };

window.afro.escapeHtml = function (value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[ch]));
};

window.afro.safeHttpUrl = function (value, fallback = '#') {
    try {
        const url = new URL(String(value || ''), window.location.origin);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : fallback;
    } catch (e) {
        return fallback;
    }
};

window.afro.csrfToken = window.afro.csrfToken || null;

window.afro.updateCsrfToken = function (payload) {
    if (payload && payload.csrf_token) {
        window.afro.csrfToken = payload.csrf_token;
    }
};

(function installCsrfFetchWrapper() {
    if (window.afro.fetchWrapperInstalled) {
        return;
    }

    const nativeFetch = window.fetch.bind(window);
    const mutatingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

    async function ensureCsrfToken() {
        if (window.afro.csrfToken) {
            return window.afro.csrfToken;
        }

        const root = window.afro.getProjectRoot ? window.afro.getProjectRoot() : '';
        const sessionUrl = `${root === '/' ? '' : root}/backend/api/session.php`;
        try {
            const response = await nativeFetch(sessionUrl, { credentials: 'same-origin' });
            const data = await response.clone().json();
            window.afro.updateCsrfToken(data);
        } catch (e) {
            // Anonymous/public requests may not have a session yet.
        }

        return window.afro.csrfToken;
    }

    window.fetch = async function (input, options = {}) {
        const requestUrl = typeof input === 'string' ? input : input.url;
        const url = new URL(requestUrl, window.location.href);
        const method = String(options.method || (typeof input !== 'string' ? input.method : 'GET') || 'GET').toUpperCase();
        const isSameOrigin = url.origin === window.location.origin;

        if (isSameOrigin && mutatingMethods.has(method)) {
            const token = await ensureCsrfToken();
            if (token) {
                const headers = new Headers(options.headers || (typeof input !== 'string' ? input.headers : undefined));
                headers.set('X-CSRF-Token', token);
                options = { ...options, headers };
            }
        }

        const response = await nativeFetch(input, options);
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            response.clone().json().then(window.afro.updateCsrfToken).catch(() => {});
        }
        return response;
    };

    window.afro.fetchWrapperInstalled = true;
})();

/**
 * Robustly determines the project root URL path.
 * Works whether the project is at the domain root or in a subdirectory.
 */
window.afro.getProjectRoot = function () {
    const pathname = window.location.pathname;
    const isAuth = pathname.includes('/auth/');

    // Split by / and remove empty entries and .html filenames
    let parts = pathname.split('/').filter(p => p !== "" && !p.endsWith('.html'));

    if (isAuth) {
        // If we're inside the /auth/ directory, the project root is one level up
        if (parts[parts.length - 1] === 'auth') {
            parts.pop();
        }
    }

    const root = '/' + parts.join('/');
    // Ensure it doesn't end with double slash if root is empty
    return root === '//' ? '/' : (root.endsWith('/') ? root.slice(0, -1) : root);
};

/**
 * Helper to redirect to a specific page relative to project root
 */
window.afro.redirectTo = function (targetPath) {
    const root = window.afro.getProjectRoot();
    const target = (root === '/' ? '' : root) + (targetPath.startsWith('/') ? targetPath : '/' + targetPath);

    console.log("🚀 AfroRhythm Redirecting...");
    console.log("📍 Current Pathname:", window.location.pathname);
    console.log("📂 Calculated Root:", root);
    console.log("🎯 Final Target:", target);

    window.location.href = target;
};

/**
 * Global Premium Glassmorphic Toast Notification System
 */
window.afro.showNotification = function(message, type = 'info') {
    // Ensure styles are injected
    if (!document.getElementById('afro-toast-styles')) {
        const style = document.createElement('style');
        style.id = 'afro-toast-styles';
        style.textContent = `
            @keyframes afroToastSlideIn {
                from { transform: translateX(120%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes afroToastSlideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(120%); opacity: 0; }
            }
            .afro-toast-container {
                position: fixed;
                top: 24px;
                right: 24px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-width: 380px;
                width: 100%;
            }
            .afro-toast {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
                border-radius: 12px;
                background: rgba(17, 24, 39, 0.85);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                color: #f3f4f6;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
                animation: afroToastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                transition: all 0.3s ease;
            }
            .afro-toast.hide {
                animation: afroToastSlideOut 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .afro-toast-icon {
                font-size: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                flex-shrink: 0;
            }
            .afro-toast-success {
                border-left: 4px solid #10b981;
            }
            .afro-toast-success .afro-toast-icon {
                color: #10b981;
                background: rgba(16, 185, 129, 0.1);
            }
            .afro-toast-error {
                border-left: 4px solid #ef4444;
            }
            .afro-toast-error .afro-toast-icon {
                color: #ef4444;
                background: rgba(239, 68, 68, 0.1);
            }
            .afro-toast-warning {
                border-left: 4px solid #f59e0b;
            }
            .afro-toast-warning .afro-toast-icon {
                color: #f59e0b;
                background: rgba(245, 158, 11, 0.1);
            }
            .afro-toast-info {
                border-left: 4px solid #3b82f6;
            }
            .afro-toast-info .afro-toast-icon {
                color: #3b82f6;
                background: rgba(59, 130, 246, 0.1);
            }
            .afro-toast-content {
                flex-grow: 1;
                font-size: 14px;
                font-weight: 500;
                line-height: 1.4;
            }
            .afro-toast-close {
                background: none;
                border: none;
                color: #9ca3af;
                cursor: pointer;
                padding: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: background 0.2s;
            }
            .afro-toast-close:hover {
                background: rgba(255, 255, 255, 0.05);
                color: #f3f4f6;
            }
        `;
        document.head.appendChild(style);
    }

    // Ensure container exists
    let container = document.querySelector('.afro-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'afro-toast-container';
        document.body.appendChild(container);
    }

    // Map types
    const typeMap = {
        'success': 'success',
        'danger': 'error',
        'error': 'error',
        'warning': 'warning',
        'info': 'info'
    };
    const mappedType = typeMap[type] || 'info';

    // Icon map
    const iconMap = {
        'success': 'check-circle',
        'error': 'times-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    const iconName = iconMap[mappedType];

    const toast = document.createElement('div');
    toast.className = `afro-toast afro-toast-${mappedType}`;
    toast.innerHTML = `
        <div class="afro-toast-icon">
            <i class="fas fa-${iconName}"></i>
        </div>
        <div class="afro-toast-content">${window.afro.escapeHtml(message)}</div>
        <button class="afro-toast-close" aria-label="Close">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(toast);

    // Auto-remove after 4.5 seconds
    const removeTimeout = setTimeout(() => {
        dismissToast(toast);
    }, 4500);

    toast.querySelector('.afro-toast-close').addEventListener('click', () => {
        clearTimeout(removeTimeout);
        dismissToast(toast);
    });

    function dismissToast(el) {
        el.classList.add('hide');
        el.addEventListener('animationend', () => {
            el.remove();
            // remove container if empty
            const currentContainer = document.querySelector('.afro-toast-container');
            if (currentContainer && currentContainer.children.length === 0) {
                currentContainer.remove();
            }
        });
    }
};

/**
 * Global safe fetch with automatic error intercepting and toast display
 */
window.afro.safeFetch = async function(url, options = {}) {
    const defaults = {
        credentials: 'same-origin'
    };
    const mergedOptions = { ...defaults, ...options };
    
    try {
        const response = await fetch(url, mergedOptions);
        
        // Handle HTTP error status codes (e.g. 500, 404, 403)
        if (!response.ok) {
            let errorMsg = (typeof t === 'function' ? t('Server error:') : 'Server error:') + ` ${response.status} ${response.statusText}`;
            try {
                const errData = await response.json();
                if (errData && errData.message) {
                    errorMsg = errData.message;
                }
            } catch (e) {}
            
            window.afro.showNotification(errorMsg, 'error');
            throw new Error(errorMsg);
        }
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            if (data && data.success === false) {
                const message = data.message || (typeof t === 'function' ? t('API request failed') : 'API request failed');
                window.afro.showNotification(message, 'error');
                throw new Error(message);
            }
            return data;
        } else {
            const textText = await response.text();
            console.error("Non-JSON response received from server:", textText);
            const genericError = (typeof t === 'function' ? t('Invalid data format received from server.') : 'Invalid data format received from server.');
            window.afro.showNotification(genericError, 'error');
            throw new Error(genericError);
        }
    } catch (error) {
        console.error(`❌ safeFetch failed for ${url}:`, error);
        // Only show general network notification if we didn't show a more specific one already
        if (!error.message || (!error.message.includes('Server error:') && !error.message.includes('API request failed') && !error.message.includes('Invalid data format'))) {
            window.afro.showNotification(typeof t === 'function' ? t('Network error: Could not connect to the server.') : `Network error: Could not connect to the server.`, 'error');
        }
        throw error;
    }
};
