/**
 * platform-settings.js
 * Handles dynamic platform name and basic branding across all dashboards and landing pages.
 */

window.PLATFORM_SETTINGS = {
    name: 'AfroRythm',
    description: 'Promote Cameroonian Music',
    isLoaded: false
};

async function fetchPlatformSettings() {
    try {
        const apiPath = new URL('backend/api/settings.php', window.location.href).toString();

        console.log("📂 Fetching platform settings from:", apiPath);

        const response = await fetch(apiPath);
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                window.PLATFORM_SETTINGS.name = result.data.platform_name || 'AfroRythm';
                window.PLATFORM_SETTINGS.description = result.data.platform_description || '';
                window.PLATFORM_SETTINGS.isLoaded = true;

                applyPlatformSettings();
                return result.data;
            }
        }
    } catch (error) {
        console.error("❌ Failed to fetch platform settings:", error);
    }

    // Always call apply at least once with defaults
    applyPlatformSettings();
}

function applyPlatformSettings() {
    const name = window.PLATFORM_SETTINGS.name;

    console.log("✨ Applying Platform Name:", name);

    // 1. Update document title if it contains the old name
    if (document.title.includes('AfroRythm') || document.title.includes('AfroRhythm')) {
        document.title = document.title.replace(/AfroRhythm|AfroRythm/gi, name);
    }

    // 2. Update all elements with branding classes
    document.querySelectorAll('.platform-name').forEach(el => {
        el.textContent = name;
    });

    document.querySelectorAll('.platform-description').forEach(el => {
        if (window.PLATFORM_SETTINGS.description) {
            el.textContent = window.PLATFORM_SETTINGS.description;
        }
    });

    // 3. Robust Fallback: Search for text nodes matching names
    const brandSelectors = '.navbar-brand, .logo-text, .brand-name, .sidebar-header h1, .sidebar-header h2, .sidebar-header h3';
    document.querySelectorAll(brandSelectors).forEach(el => {
        // Skip if already has a platform-name span to avoid double replacement
        if (el.querySelector('.platform-name')) return;

        const hasIcon = el.querySelector('i');
        if (hasIcon) {
            Array.from(el.childNodes).forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const trimmedText = node.textContent.trim();
                    if (trimmedText === 'AfroRythm' || trimmedText === 'AfroRhythm') {
                        // Replace while preserving original surrounding whitespace
                        node.textContent = node.textContent.replace(/AfroRhythm|AfroRythm/gi, name);
                    }
                }
            });
        } else {
            const trimmedText = el.textContent.trim();
            if (trimmedText === 'AfroRythm' || trimmedText === 'AfroRhythm') {
                el.textContent = name;
            }
        }
    });
}

// Auto-run on load
document.addEventListener('DOMContentLoaded', fetchPlatformSettings);

// Also expose as a global helper for manual refreshes
window.refreshPlatformBranding = applyPlatformSettings;

// Re-apply active language after branding updates (runs after translation.js is loaded)
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
        if (typeof applyActiveLang === 'function') applyActiveLang();
    }, 900); // After platform fetch + translation init settle
});
